// src/components/dashboard/FilterSidebar.tsx

import React, { useState, useMemo } from 'react';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/I18nProvider';
import { getInitialFilters } from '@/utils/logUtils';
import { LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';
import { Filter, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { LogEntry, LogFilters } from '@/types';

// Memoized selectors to avoid infinite loops
const selectFilters = (state: { filters: LogFilters }) => state.filters;
const selectSetFilters = (state: { setFilters: (filters: LogFilters) => void }) => state.setFilters;
const selectViewMode = (state: { viewMode: 'STREAM' | 'HISTORY' }) => state.viewMode;
const selectSetViewMode = (state: { setViewMode: (mode: 'STREAM' | 'HISTORY', clearLogs?: boolean) => void }) => state.setViewMode;
const selectLogs = (state: { logs: LogEntry[] }) => state.logs;

export const FilterSidebar = () => {
  const { t } = useI18n();
  const [openSection, setOpenSection] = useState<'levels' | 'modules'>('levels');

  const filters = useLogStore(selectFilters);
  const setFilters = useLogStore(selectSetFilters);
  const viewMode = useLogStore(selectViewMode);
  const setViewMode = useLogStore(selectSetViewMode);
  const logs = useLogStore(selectLogs);
  
  // Calculate counts based on currently visible logs in STREAM mode
  const logCounts = useMemo(() => {
    if (viewMode !== 'STREAM') return {};
    const counts: Record<string, number> = {};
    logs.forEach((log: LogEntry) => {
      counts[log.level] = (counts[log.level] || 0) + 1;
      counts[log.module] = (counts[log.module] || 0) + 1;
    });
    return counts;
  }, [logs, viewMode]);

  const toggleFilter = (type: 'levels' | 'modules', key: string) => {
    setFilters({
      ...filters,
      [type]: {
        ...filters[type],
        [key]: !filters[type][key],
      },
    });
  };

  const handleHistorySearch = () => {
    setViewMode('HISTORY', true);
    // Load history will be triggered by the useEffect in useLogStream
  };
  
  const handleClearFilters = () => {
    setFilters(getInitialFilters());
  }

  const renderFilterGroup = (titleKey: 'logLevels' | 'modules', keys: string[], type: 'levels' | 'modules') => (
    <div className="mb-4 rounded-lg bg-white dark:bg-gray-800 p-3 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3
        className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setOpenSection(openSection === type ? ('' as 'levels') : type)}
      >
        {t(titleKey)}
        {openSection === type ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </h3>
      <div className={openSection === type ? 'block' : 'hidden'}>
        {keys.map(key => (
          <div key={key} className="flex items-center justify-between py-1 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!filters[type][key]}
                onChange={() => toggleFilter(type, key)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-700 dark:text-gray-300">{key}</span>
            </label>
            <span className="text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full min-w-[50px] text-center">
              {viewMode === 'STREAM' ? (logCounts[key] || 0) : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-64 p-4 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700 overflow-y-auto shrink-0">
      <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
        <Filter size={18} className="mr-2" /> {t('filter')}
      </div>
      
      <div className={`p-3 rounded-lg text-sm mb-4 transition-colors font-semibold border ${viewMode === 'STREAM' ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700' : 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}>
        {t('currentMode')}: {viewMode === 'STREAM' ? t('streamMode') : t('historyMode')}
      </div>

      {renderFilterGroup('logLevels', LOG_LEVELS, 'levels')}
      {renderFilterGroup('modules', LOG_MODULES, 'modules')}
      
      <div className="space-y-2 mt-6">
        <button 
          onClick={handleHistorySearch}
          className="w-full py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center justify-center"
        >
          <Database size={16} className="mr-2" />
          {t('applyHistorySearch')}
        </button>
        <button 
          onClick={handleClearFilters}
          className="w-full py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors shadow-sm"
        >
          {t('clearFilters')}
        </button>
      </div>
    </div>
  );
};