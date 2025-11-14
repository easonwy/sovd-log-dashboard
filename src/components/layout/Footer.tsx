'use client';

import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/useI18n';
import type { LogState } from '@/store/logStore';
import { BACKEND_URL } from '@/constants/logConstants';

// Memoized selector to avoid infinite loops
const selectViewMode = (state: LogState) => state.viewMode;

export const Footer = () => {
  const { t } = useI18n();
  const viewMode = useLogStore(selectViewMode);

  return (
    <footer className="p-2 text-xs text-gray-500 dark:text-gray-400 text-center bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
      {t('appStatus')} {viewMode} {t('modeActive')} {BACKEND_URL}。
      <span className="ml-4 font-semibold text-red-500">
        {t('warningBackend')}
      </span>
    </footer>
  );
};