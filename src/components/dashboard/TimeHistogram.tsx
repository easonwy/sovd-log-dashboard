// src/components/dashboard/TimeHistogram.tsx

'use client';

import { useMemo } from 'react';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/I18nProvider';
import type { LogState } from '@/store/logStore';
import type { TimeBin } from '@/types';
import { Clock } from 'lucide-react';

// Memoized selectors to avoid infinite loops
const selectLogs = (state: LogState) => state.logs;
const selectViewMode = (state: LogState) => state.viewMode;

export const TimeHistogram = () => {
  const { t, language } = useI18n();
  const logs = useLogStore(selectLogs);
  const viewMode = useLogStore(selectViewMode);

  const { bins, maxCount } = useMemo(() => {
    if (viewMode !== 'STREAM') return { bins: [], maxCount: 0 };
    
    const intervalMs = 60 * 1000;
    const now = Date.now();
    const startTime = now - intervalMs;
    const numBins = 30; // 30 bins = 2 seconds per bin
    const binSizeMs = intervalMs / numBins;
    
    const bins: TimeBin[] = Array(numBins).fill(0).map((_, i) => ({
      timestamp: startTime + i * binSizeMs,
      count: 0,
    }));

    let currentMax = 0;
    
    logs.forEach((log) => {
      try {
        const logTime = new Date(log.timestamp).getTime(); 
        if (logTime >= startTime) {
          const binIndex = Math.floor((logTime - startTime) / binSizeMs);
          if (binIndex >= 0 && binIndex < numBins) {
            bins[binIndex].count++;
            currentMax = Math.max(currentMax, bins[binIndex].count);
          }
        }
      } catch {
        // Ignore invalid timestamps
      }
    });

    return { bins, maxCount: currentMax };
  }, [logs, viewMode]);

  if (viewMode !== 'STREAM') return null;

  const getLocale = () => (language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US');

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-b border-t dark:border-gray-700 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
          <Clock size={16} className="mr-1 text-indigo-500" />
          {t('logRateTitle')}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('maxLogsPerInterval')}: {maxCount}</span>
      </div>
      <div className="flex h-12 w-full space-x-[1px] items-end">
        {bins.map((bin, index) => {
          const heightPercent = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
          return (
            <div 
              key={index} 
              className="flex-1 bg-indigo-300 hover:bg-indigo-500 transition-colors"
              style={{ height: `${heightPercent}%` }}
              title={`Time: ${new Date(bin.timestamp).toLocaleTimeString(getLocale())} | Logs: ${bin.count}`}
            ></div>
          );
        })}
      </div>
    </div>
  );
};