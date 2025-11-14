// src/components/dashboard/LogList.tsx

'use client';

import { useRef, useEffect } from 'react';
import { useLogStore } from '@/store/logStore';
import type { LogState } from '@/store/logStore';
import { useI18n } from '@/i18n/useI18n';
import { LogEntry } from '@/types';
import { List } from 'lucide-react';
import LogItem from './LogItem'; // Using default export

interface LogListProps {
  filteredLogs: LogEntry[];
}

// Memoized selectors to avoid infinite loops
const selectSelectedLog = (state: LogState) => state.selectedLog;
const selectSetSelectedLog = (state: LogState) => state.setSelectedLog;
const selectIsPaused = (state: LogState) => state.isPaused;
const selectViewMode = (state: LogState) => state.viewMode;
const selectIsLoading = (state: LogState) => state.isLoading;

export const LogList = ({ filteredLogs }: LogListProps) => {
  const { t } = useI18n();
  const selectedLog = useLogStore(selectSelectedLog);
  const setSelectedLog = useLogStore(selectSetSelectedLog);
  const isPaused = useLogStore(selectIsPaused);
  const viewMode = useLogStore(selectViewMode);
  const isLoading = useLogStore(selectIsLoading);
  
  const logListRef = useRef<HTMLDivElement>(null);

  // Auto-scrolling logic
  useEffect(() => {
    if (logListRef.current && !isPaused && viewMode === 'STREAM') {
      logListRef.current.scrollTop = 0;
    }
  }, [filteredLogs.length, isPaused, viewMode]);

  return (
    <div 
      ref={logListRef} 
      className="w-full h-full overflow-y-scroll bg-white dark:bg-gray-800"
    >
      {filteredLogs.map(log => (
        <LogItem
          key={log.id} 
          log={log}
          onSelect={setSelectedLog}
          isSelected={selectedLog?.id === log.id}
        />
      ))}

      {filteredLogs.length === 0 && !isLoading && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <List size={32} className="mx-auto mb-2" />
          {viewMode === 'STREAM' ? t('streamEmptyMessage') : t('historyEmptyMessage')}
        </div>
      )}
    </div>
  );
};