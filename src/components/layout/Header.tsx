'use client';

import React from 'react';
import { useLogStore } from '@/store/logStore';
import { useI18n } from '@/i18n/useI18n';
import type { LogState } from '@/store/logStore';
import {
  LogOut,
  List,
  Database,
  Languages,
  BarChart3,
  Play,
  Pause,
  Wifi,
  Filter,
} from 'lucide-react';

import ThemeSwitcher from '@/components/common/ThemeSwitcher';

// The Header needs a prop to toggle the stats panel visibility
interface HeaderProps {
  isStatsVisible: boolean;
  onToggleStats: () => void;
  isFiltersVisible: boolean;
  onToggleFilters: () => void;
}

// Memoized selectors to avoid infinite loops
const selectFilters = (state: LogState) => state.filters;
const selectSetSearchText = (state: LogState) => state.setSearchText;
const selectViewMode = (state: LogState) => state.viewMode;
const selectSetViewMode = (state: LogState) => state.setViewMode;
const selectIsPaused = (state: LogState) => state.isPaused;
const selectTogglePause = (state: LogState) => state.togglePause;
const selectIsConnected = (state: LogState) => state.isConnected;

export const Header = ({ isStatsVisible, onToggleStats, isFiltersVisible, onToggleFilters }: HeaderProps) => {
  const { t, language, setLanguage } = useI18n();

  // Select individual state values and actions from the Zustand store
  const filters = useLogStore(selectFilters);
  const setSearchText = useLogStore(selectSetSearchText);
  const viewMode = useLogStore(selectViewMode);
  const setViewMode = useLogStore(selectSetViewMode);
  const isPaused = useLogStore(selectIsPaused);
  const togglePause = useLogStore(selectTogglePause);
  const isConnected = useLogStore(selectIsConnected);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const switchToHistoryMode = () => {
    setViewMode('HISTORY'); // Switch mode and clear logs
    // Load history will be triggered by the useEffect in useLogStream
  };

  const switchToStreamMode = () => {
    setViewMode('STREAM'); // Switch mode and load initial buffer
    // Load history will be triggered by the useEffect in useLogStream
  };

  const toggleLanguage = () => {
    const nextLang = language === 'zh' ? 'en' : language === 'en' ? 'ja' : 'zh';
    setLanguage(nextLang);
  };

  const getNextLangCode = () => {
    if (language === 'zh') return 'EN';
    if (language === 'en') return 'JP';
    return '中';
  };
  
  const getNextLangTitle = () => {
    if (language === 'zh') return 'Switch to English';
    if (language === 'en') return '日本語に切り替える';
    return '切换到中文';
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md z-10 shrink-0 dark:bg-gray-800">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center dark:text-gray-200">
        <LogOut size={24} className="text-indigo-600 mr-3 transform rotate-90" />
        {t('appTitle')}
      </h1>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="py-2 px-4 w-64 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            value={filters.searchText}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* View Mode Switcher */}
        {viewMode === 'HISTORY' ? (
          <button
            onClick={switchToStreamMode}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center"
            title={t('switchToStream')}
          >
            <List size={16} className="mr-2" />
            {t('streamMode')}
          </button>
        ) : (
           <button
            onClick={switchToHistoryMode}
            className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors shadow-sm flex items-center"
            title={t('applyHistoryFilters')}
          >
            <Database size={16} className="mr-2" />
            {t('historyMode')}
          </button>
        )}
        
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full shadow-md transition-all bg-gray-200 text-gray-600 hover:bg-gray-300 font-semibold text-sm flex items-center"
          title={getNextLangTitle()}
        >
          <Languages size={20} className="mr-1" />
          {getNextLangCode()}
        </button>

        <ThemeSwitcher />

        {/* Toggle Stats Panel Button */}
        <button
          onClick={onToggleStats}
          className={`p-2 rounded-full shadow-md transition-all ${isStatsVisible ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          title={isStatsVisible ? t('hideStats') : t('showStats')}
        >
          <BarChart3 size={20} />
        </button>

        {/* Toggle Filters Panel Button */}
        <button
          onClick={onToggleFilters}
          className={`p-2 rounded-full shadow-md transition-all ${isFiltersVisible ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          title={isFiltersVisible ? t('hideFilters') : t('showFilters')}
        >
          <Filter size={20} />
        </button>
        
        {/* Pause/Play Toggle (Only in Stream Mode) */}
        <button
          onClick={togglePause}
          disabled={!isConnected || viewMode !== 'STREAM'}
          className={`p-2 rounded-full shadow-md transition-all disabled:opacity-50 ${isPaused ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          title={isPaused ? t('resumeStream') : t('pauseStream')}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>

        {/* Connection Status Indicator */}
        <span className={`flex items-center text-sm font-medium p-2 rounded-lg transition-colors ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ${viewMode === 'HISTORY' ? 'opacity-50' : ''}`}>
          <Wifi size={16} className={`mr-1 ${isConnected && viewMode === 'STREAM' ? 'animate-pulse' : ''}`} />
          {isConnected ? t('live') : t('disconnected')}
        </span>
      </div>
    </header>
  );
};