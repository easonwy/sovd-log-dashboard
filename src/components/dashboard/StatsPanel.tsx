// src/components/dashboard/StatsPanel.tsx

import React, { useMemo } from 'react';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/I18nProvider';
import { getColorClass } from '@/utils/colorUtils';
import { LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';
import { CalculatedStats, DistributionItem } from '@/types';
import { BarChart3, TrendingUp, ChevronUp } from 'lucide-react';

interface StatsPanelProps {
  filteredLogs: any[]; // Pass filtered logs as a prop
  onClose: () => void;
}

export const StatsPanel = ({ filteredLogs, onClose }: StatsPanelProps) => {
  const { t } = useI18n();

  const stats: CalculatedStats = useMemo(() => {
    const totalCount = filteredLogs.length;
    const levelCounts: Record<string, number> = {};
    const moduleCounts: Record<string, number> = {};

    filteredLogs.forEach(log => {
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      moduleCounts[log.module] = (moduleCounts[log.module] || 0) + 1;
    });

    const calculateDistribution = (counts: Record<string, number>, keys: string[]): DistributionItem[] => {
      return keys
        .map(key => ({
          key,
          count: counts[key] || 0,
          percentage: totalCount > 0 ? ((counts[key] || 0) / totalCount) * 100 : 0,
          colorClass: getColorClass(key),
        }))
        .filter(item => item.count > 0);
    };

    return {
      totalCount,
      levelDistribution: calculateDistribution(levelCounts, LOG_LEVELS),
      moduleDistribution: calculateDistribution(moduleCounts, LOG_MODULES),
    };
  }, [filteredLogs]);

  const renderDistributionChart = (titleKey: 'levelDistribution' | 'moduleDistribution', distribution: DistributionItem[]) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">{t(titleKey)}</h4>
      {stats.totalCount === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noMatchingLogs')}</p>
      ) : (
        <div className="space-y-3">
          {distribution
            .sort((a, b) => b.count - a.count)
            .map(({ key, count, percentage, colorClass }) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{key}</span>
                  <span className="text-gray-600 dark:text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`} 
                    style={{ width: `${percentage}%` }}
                    title={`${key}: ${count} (${percentage.toFixed(1)}%)`}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 border-b dark:border-gray-700 shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <BarChart3 size={20} className="mr-2 text-indigo-600" />
          {t('analyticsAndStats')}
        </h3>
        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-400/50 dark:hover:bg-gray-600 transition-colors">
          <ChevronUp size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalFilteredLogs')}</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalCount}</p>
          </div>
          <TrendingUp size={36} className="text-indigo-200 dark:text-indigo-800" />
        </div>
        {renderDistributionChart('levelDistribution', stats.levelDistribution)}
        {renderDistributionChart('moduleDistribution', stats.moduleDistribution)}
      </div>
    </div>
  );
};