// src/pages/DashboardPage.tsx

import React, { useState, useMemo } from 'react';
import { useLogStream } from '@/hooks/useLogStream';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/I18nProvider';
import { shallow } from 'zustand/shallow';

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

export const DashboardPage = () => {
  const { t } = useI18n();

  // This custom hook initializes and manages the WebSocket connection and data flow.
  useLogStream();
  
  // UI-specific state that doesn't need to be global.
  const [isStatsVisible, setIsStatsVisible] = useState(true);

  // Select all necessary state from the Zustand store.
  // Using a single selector is often more performant than multiple individual ones.
  const {
    logs,
    filters,
    viewMode,
    selectedLog,
    setSelectedLog,
    isLoading,
    connectionError,
  } = useLogStore(state => ({
    logs: state.logs,
    filters: state.filters,
    viewMode: state.viewMode,
    selectedLog: state.selectedLog,
    setSelectedLog: state.setSelectedLog,
    isLoading: state.isLoading,
    connectionError: state.connectionError,
  }), shallow);
  
  /**
   * Memoized calculation for client-side filtering.
   * This is only applied in 'STREAM' mode, as 'HISTORY' mode logs
   * are pre-filtered by the backend.
   * `useMemo` prevents re-calculating this on every render unless logs or filters change.
   */
  const filteredLogs = useMemo(() => {
    if (viewMode === 'HISTORY') {
      return logs;
    }
    
    const { levels, modules, searchText } = filters;
    const lowerCaseSearch = searchText.toLowerCase();

    return logs.filter(log => {
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