'use client';

import { useState, useMemo } from 'react';
import { useLogStream } from '@/hooks/useLogStream';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/useI18n';
import { LogEntry, LogFilters } from '@/types';

// Layout Components
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Dashboard Components
import { FilterSidebar } from '@/components/dashboard/FilterSidebar';
import { LogList } from '@/components/dashboard/LogList';
import { LogListHeader } from '@/components/dashboard/LogListHeader';
import { LogDetailPanel } from '@/components/dashboard/LogDetailPanel';
import { StatsPanel } from '@/components/dashboard/StatsPanel';
import { TimeHistogram } from '@/components/dashboard/TimeHistogram';
import { AlertTriangle } from 'lucide-react';

// Memoized selectors to avoid infinite loops
const selectLogs = (state: { logs: LogEntry[] }) => state.logs;
const selectFilters = (state: { filters: LogFilters }) => state.filters;
const selectViewMode = (state: { viewMode: 'STREAM' | 'HISTORY' }) => state.viewMode;
const selectSelectedLog = (state: { selectedLog: LogEntry | null }) => state.selectedLog;
const selectSetSelectedLog = (state: { setSelectedLog: (log: LogEntry | null) => void }) => state.setSelectedLog;
const selectIsLoading = (state: { isLoading: boolean }) => state.isLoading;
const selectConnectionError = (state: { connectionError: string | null }) => state.connectionError;

export const DashboardPage = () => {
  const { t } = useI18n();

  // This custom hook initializes and manages the WebSocket connection and data flow.
  useLogStream();
  
  // UI-specific state that doesn't need to be global.
  const [isStatsVisible, setIsStatsVisible] = useState(true);

  // Select state from the Zustand store using stable selectors.
  // Each selector is defined outside the component to avoid recreation.
  const logs = useLogStore(selectLogs);
  const filters = useLogStore(selectFilters);
  const viewMode = useLogStore(selectViewMode);
  const selectedLog = useLogStore(selectSelectedLog);
  const setSelectedLog = useLogStore(selectSetSelectedLog);
  const isLoading = useLogStore(selectIsLoading);
  const connectionError = useLogStore(selectConnectionError);
  
  /**
   * Memoized calculation for client-side filtering.
   * This is only applied in 'STREAM' mode, as 'HISTORY' mode logs
   * are pre-filtered by the backend.
   * `useMemo` prevents re-calculating this on every render unless logs or filters change.
   */
  const filteredLogs = useMemo(() => {
    if (viewMode === 'HISTORY') {
      console.log('[Dashboard] In HISTORY mode, returning logs directly:', { count: logs.length, logs: logs.slice(0, 2) });
      return logs;
    }
    
    const { levels, modules, searchText } = filters;
    const lowerCaseSearch = searchText.toLowerCase();

    return logs.filter((log: LogEntry) => {
      const levelMatch = levels[log.level];
      const moduleMatch = modules[log.module];
      const searchMatch = !searchText || 
                          log.message.toLowerCase().includes(lowerCaseSearch) || 
                          log.traceId.toLowerCase().includes(lowerCaseSearch);
      
      return levelMatch && moduleMatch && searchMatch;
    });
  }, [logs, filters, viewMode]);

  const getLoadingMessage = () => {
    if (viewMode === 'HISTORY') return t('loadingHistory');
    // If it's the first load in stream mode, it's the initial buffer.
    return logs.length > 0 ? t('loadingHistory') : t('loadingInitial');
  }

  return (
    <PageWrapper>
      <Header 
        isStatsVisible={isStatsVisible} 
        onToggleStats={() => setIsStatsVisible(p => !p)} 
      />
      
      {/* Loading / Error Bar */}
      {(isLoading || connectionError) && (
          <div className={`p-3 text-sm flex items-center shrink-0 ${connectionError ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'}`}>
              <AlertTriangle size={18} className="mr-2" />
              {isLoading ? getLoadingMessage() : connectionError}
          </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <FilterSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {isStatsVisible && (
            <StatsPanel 
              filteredLogs={filteredLogs} 
              onClose={() => setIsStatsVisible(false)} 
            />
          )}

          {viewMode === 'STREAM' && <TimeHistogram />}

          <LogListHeader filteredLogCount={filteredLogs.length} />
          
          <div className="flex-1 flex overflow-hidden">
            <LogList filteredLogs={filteredLogs} />
            
            {selectedLog && (
              <LogDetailPanel 
                log={selectedLog} 
                onClose={() => setSelectedLog(null)} 
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </PageWrapper>
  );
};

export default DashboardPage;