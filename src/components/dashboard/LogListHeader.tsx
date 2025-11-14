'use client';

import { useLogStore } from '@/store/logStore';
import type { LogState } from '@/store/logStore';
import { useI18n } from '@/i18n/useI18n';
import { MAX_LOG_COUNT, PAGE_SIZE } from '@/constants/logConstants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LogListHeaderProps {
  filteredLogCount: number;
}

// Memoized selectors to avoid infinite loops
const selectViewMode = (state: LogState) => state.viewMode;
const selectLogs = (state: LogState) => state.logs;
const selectTotalLogsCount = (state: LogState) => state.totalLogsCount;
const selectPage = (state: LogState) => state.page;
const selectLoadHistory = (state: LogState) => state.loadHistory;
const selectIsLoading = (state: LogState) => state.isLoading;

export const LogListHeader = ({ filteredLogCount }: LogListHeaderProps) => {
  const { t } = useI18n();
  const viewMode = useLogStore(selectViewMode);
  const logs = useLogStore(selectLogs);
  const totalLogsCount = useLogStore(selectTotalLogsCount);
  const page = useLogStore(selectPage);
  const loadHistory = useLogStore(selectLoadHistory);
  const isLoading = useLogStore(selectIsLoading);

  const maxPage = Math.ceil(totalLogsCount / PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > maxPage || isLoading) return;
    loadHistory(newPage);
  };

  return (
    <div className="py-2 px-4 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-inner shrink-0">
      {viewMode === 'STREAM' ? (
        <span>
          {t('showing')} {filteredLogCount} {t('logsUnit')} ({t('filtered')}) / {t('totalStreamBuffer')} {logs.length} ({t('maxStorage')}: {MAX_LOG_COUNT})
        </span>
      ) : (
        <div className="flex items-center space-x-4">
          <span>
            {t('historyResults')} 
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 ml-1">{totalLogsCount.toLocaleString()}</span> {t('unit')}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
              className="p-1 rounded bg-white hover:bg-gray-100 disabled:opacity-50 border dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {t('pageOf')} {page} / {maxPage}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= maxPage || isLoading}
              className="p-1 rounded bg-white hover:bg-gray-100 disabled:opacity-50 border dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};