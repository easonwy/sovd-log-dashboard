// src/components/dashboard/LogItem.tsx

'use client';

import React, { useMemo } from 'react';
import { LogEntry } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

interface LogItemProps {
  log: LogEntry;
  isSelected: boolean;
  onSelect: (log: LogEntry) => void;
}

const LogItem = ({ log, isSelected, onSelect }: LogItemProps) => {
  const { t, language } = useI18n();

  const timeString = useMemo(() => {
    try {
      const locale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US';
      return new Date(log.timestamp).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return t('invalidTime');
    }
  }, [log.timestamp, t, language]);

  const getLevelClasses = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-100 border-red-300';
      case 'WARN': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'INFO': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'SUCCESS': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const levelClasses = getLevelClasses(log.level);

  return (
    <div
      className={`flex items-center text-xs transition-colors duration-100 px-4 cursor-pointer h-9 border-b border-gray-100 dark:border-gray-700 ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
      onClick={() => onSelect(log)}
    >
      <div className="w-24 font-mono text-gray-500 dark:text-gray-400 shrink-0">
        {timeString}
      </div>
      <div className={`w-16 font-semibold rounded-full px-2 py-0.5 text-center shrink-0 border ${levelClasses}`}>
        {log.level.slice(0, 1)}
      </div>
      <div className="w-40 font-mono text-purple-600 dark:text-purple-400 ml-4 shrink-0 truncate" title={log.module}>
        {log.module}
      </div>
      <div className="flex-grow text-gray-800 dark:text-gray-200 font-mono text-xs truncate ml-4">
        {log.message}
      </div>
      <div className="w-20 text-gray-400 dark:text-gray-500 text-[10px] shrink-0 text-right">
        {log.traceId}
      </div>
    </div>
  );
};

export default React.memo(LogItem);