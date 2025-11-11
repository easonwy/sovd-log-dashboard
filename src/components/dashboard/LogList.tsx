// src/components/dashboard/LogList.tsx

import React, { useRef, useEffect } from 'react';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/I18nProvider';
import { LogEntry } from '@/types';
import { List } from 'lucide-react';
import LogItem from './LogItem'; // Using default export

interface LogListProps {
  filteredLogs: LogEntry[];
}

export const LogList = ({ filteredLogs }: LogListProps) => {
  const { t } = useI18n();
  const {
    selectedLog,
    setSelectedLog,
    isPaused,
    viewMode,
    isLoading
  } = useLogStore(state => ({
    selectedLog: state.selectedLog,
    setSelectedLog: state.setSelectedLog,
    isPaused: state.isPaused,
    viewMode: state.viewMode,
    isLoading: state.isLoading,
  }));
  
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
      className="w-full h-full overflow-y-scroll bg-white dark:bg-gray-900"
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