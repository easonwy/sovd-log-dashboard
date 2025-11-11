import create from 'zustand';
import { LogEntry, LogFilters } from '@/types';
import { getInitialFilters, generateDemoLogs } from '@/utils/logUtils';
import { fetchHistoricalLogs } from '@/api/logService';
import { PAGE_SIZE, MAX_LOG_COUNT } from '@/constants/logConstants';

// (Define the LogState interface here as shown in the previous answer)
interface LogState {
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
  
  // Actions
  setFilters: (filters: LogFilters) => void;
  setSearchText: (text: string) => void;
  setViewMode: (mode: 'STREAM' | 'HISTORY', clearLogs?: boolean) => void;
  togglePause: () => void;
  addLog: (log: LogEntry) => void;
  setSelectedLog: (log: LogEntry | null) => void;
  setConnectionStatus: (status: { isConnected: boolean; error?: string | null }) => void;
  
  // Async Actions
  loadHistory: (page?: number) => Promise<void>;
}


export const useLogStore = create<LogState>((set, get) => ({
    logs: generateDemoLogs(),
    filters: getInitialFilters(),
    viewMode: 'STREAM',
    isPaused: false,
    isConnected: false,
    isLoading: false,
    connectionError: null,
    page: 1,
    totalLogsCount: 0,
    selectedLog: null,
  
    setFilters: (filters) => set({ filters, page: 1 }), // Reset page on filter change
    setSearchText: (text) => set(state => ({ filters: { ...state.filters, searchText: text } })),
    togglePause: () => set(state => ({ isPaused: !state.isPaused })),
    setSelectedLog: (log) => set(state => ({ 
      selectedLog: state.selectedLog?.id === log?.id ? null : log 
    })),
    setConnectionStatus: ({ isConnected, error = null }) => set({ isConnected, connectionError: error }),
  
    addLog: (log) => set(state => {
      if (state.isPaused || state.viewMode === 'HISTORY') return {};
      const newLogs = [log, ...state.logs];
      return { logs: newLogs.slice(0, MAX_LOG_COUNT) };
    }),

    setViewMode: (mode, clearLogs = false) => {
        set({ 
            viewMode: mode,
            page: 1,
            selectedLog: null,
            filters: getInitialFilters(), // Reset filters on mode change
            logs: clearLogs ? [] : generateDemoLogs(),
        });
        // After setting mode, trigger a data load
        if (mode === 'STREAM') {
            get().loadHistory(1); // Load initial buffer for stream
        }
    },
  
    loadHistory: async (newPage) => {
        const { filters, viewMode } = get();
        const targetPage = newPage ?? 1;
        
        set({ isLoading: true, connectionError: null, selectedLog: null });
        
        try {
          const offset = (targetPage - 1) * PAGE_SIZE;
          // In stream mode, we fetch a buffer, not a "page"
          const limit = viewMode === 'STREAM' ? PAGE_SIZE : PAGE_SIZE; 
          const data = await fetchHistoricalLogs(offset, limit, filters);
          set({ 
            logs: data.logs, 
            totalLogsCount: data.total, 
            page: targetPage,
            isLoading: false 
          });
        } catch (error) {
            console.error(error);
          set({ connectionError: 'Failed to fetch historical logs.', isLoading: false });
        }
    },
}));