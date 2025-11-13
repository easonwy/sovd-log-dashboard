import { create } from 'zustand'
import { LogEntry, LogFilters } from '@/types';
import { getInitialFilters, generateDemoLogs } from '@/utils/logUtils';
import { fetchHistoricalLogs } from '@/api/logService';
import { PAGE_SIZE, MAX_LOG_COUNT } from '@/constants/logConstants';

/**
 * Defines the complete shape of our application's state,
 * including both the data and the actions that can modify it.
 */
export interface LogState {
  // --- STATE ---
  logs: LogEntry[];
  filters: LogFilters;
  viewMode: 'STREAM' | 'HISTORY';
  isPaused: boolean;
  isConnected: boolean;
  isLoading: boolean;
  connectionError: string | null;
  page: number;
  totalLogsCount: number;
  selectedLog: LogEntry | null;

  // --- ACTIONS ---
  setFilters: (filters: LogFilters) => void;
  setSearchText: (text: string) => void;
  setViewMode: (mode: 'STREAM' | 'HISTORY') => void;
  togglePause: () => void;
  addLog: (log: LogEntry) => void;
  setSelectedLog: (log: LogEntry | null) => void;
  setConnectionStatus: (status: { isConnected: boolean; error?: string | null }) => void;
  
  // --- ASYNC ACTIONS ---
  loadHistory: (page?: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

/**
 * Creates the Zustand store.
 * The `create` function takes a "creator" function that receives `set` and `get` as arguments.
 * - `set`: A function to update the state.
 * - `get`: A function to read the current state (useful for actions that depend on existing state).
 */
export const useLogStore = create<LogState>((set, get) => ({
  // --- INITIAL STATE ---
  logs: generateDemoLogs(), // Start with demo logs for an immediate UI.
  filters: getInitialFilters(),
  viewMode: 'STREAM',
  isPaused: false,
  isConnected: false,
  isLoading: false,
  connectionError: null,
  page: 1,
  totalLogsCount: 0,
  selectedLog: null,

  // --- ACTION IMPLEMENTATIONS ---
  
  setFilters: (filters) => set({ filters, page: 1 }), // Reset to page 1 whenever filters change.
  
  setSearchText: (text) => set(state => ({ 
    filters: { ...state.filters, searchText: text } 
  })),
  
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  setSelectedLog: (log) => set(state => ({ 
    // If the same log is selected again, deselect it (toggle behavior).
    selectedLog: state.selectedLog?.id === log?.id ? null : log 
  })),

  setConnectionStatus: ({ isConnected, error = null }) => set({ 
    isConnected, 
    connectionError: isConnected ? null : error 
  }),

  addLog: (log) => set(state => {
    // Prevent new logs from being added if paused or in history mode.
    if (state.isPaused || state.viewMode === 'HISTORY') {
      return {}; // Return empty object to not change state.
    }
    // Deduplicate by id: skip if this log already exists in the list
    if (state.logs.some(existing => existing.id === log.id)) {
      return {};
    }
    const newLogs = [log, ...state.logs];
    // Enforce the max log count to prevent memory issues.
    return { logs: newLogs.slice(0, MAX_LOG_COUNT) };
  }),

  setViewMode: (mode) => set({ 
    viewMode: mode,
    page: 1,
    selectedLog: null,
    filters: getInitialFilters(), // Reset filters on mode change for a clean slate.
    logs: [], // Always clear logs when switching modes to prevent mixing data
    totalLogsCount: 0, // Reset total count as well
  }),

  // --- ASYNC ACTION IMPLEMENTATION ---
  
  loadHistory: async (newPage) => {
    const { filters } = get();
    const targetPage = newPage ?? 1;
    
    console.log('[Store] Loading history for page:', targetPage, 'with filters:', filters);
    set({ isLoading: true, connectionError: null, selectedLog: null });
    
    try {
      const offset = (targetPage - 1) * PAGE_SIZE;
      // In STREAM mode, we are fetching an initial buffer, not a "page".
      const limit = PAGE_SIZE; 
      const data = await fetchHistoricalLogs(offset, limit, filters);

      console.log('[Store] History loaded:', { logsCount: data.logs.length, total: data.total });

      set({ 
        logs: data.logs, 
        totalLogsCount: data.total, 
        page: targetPage,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Failed to load historical logs:", error);
      // Use a generic, translated error message for the UI.
      // The actual error is logged to the console for developers.
      set({ 
        connectionError: 'restError', // Use the key for i18n
        isLoading: false,
        logs: [], // Clear logs on error
      });
    }
  },

  refreshHistory: async () => {
    // Refresh history by clearing state and loading fresh data
    const currentPage = get().page;
    set({ 
      logs: [],
      totalLogsCount: 0,
      isLoading: true,
      connectionError: null,
      selectedLog: null,
    });
    // Fetch fresh data for the current page
    await get().loadHistory(currentPage);
  },
}));