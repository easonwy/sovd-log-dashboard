# SOVD Log Dashboard

SOVD Log Dashboard is a comprehensive web application designed to provide a robust, user-friendly interface for monitoring and analyzing system logs. It is built using React, TypeScript, and Tailwind CSS, with a focus on clean code, scalability, and maintainability.


## Original Code

```javascript
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { 
  LogOut, Filter, Wifi, Pause, Play, Settings, ChevronDown, ChevronUp, X, Copy, Zap, 
  BarChart3, TrendingUp, Clock, AlertTriangle, List, Database, ChevronLeft, ChevronRight, Languages
} from 'lucide-react';

// --- 全局配置 (Global Configuration) ---
// 注意：此 URL 必须与您的 mock 后端服务地址匹配
const BACKEND_URL = 'http://localhost:3000'; 
const MAX_LOG_COUNT = 5000; // 实时流缓冲区最大日志数量
const PAGE_SIZE = 500; // 历史查询模式下每页的日志数量

// --- 多语言翻译数据 (Translation Data) ---
const translations = {
  zh: {
    appTitle: 'SOVD 远程诊断日志仪表盘',
    filter: '过滤器',
    currentMode: '当前模式',
    streamMode: '实时流',
    historyMode: '历史查询',
    applyHistorySearch: '应用历史查询',
    clearFilters: '清除过滤器',
    logLevels: '日志级别 (Log Levels)',
    modules: '模块 (Modules)',
    invalidTime: '时间无效',
    logDetails: '日志详情',
    timestamp: '时间戳',
    level: '级别',
    module: '模块',
    fullTrace: '完整跟踪',
    message: '消息',
    structuredData: '结构化数据',
    copyJson: '复制 JSON',
    detailsParseError: '无法解析详情',
    analyticsAndStats: '分析与统计',
    totalFilteredLogs: '过滤后的日志总数',
    levelDistribution: '日志级别分布',
    moduleDistribution: '模块分布',
    noMatchingLogs: '没有匹配的日志数据。',
    logRateTitle: '日志速率 (Logs/sec) - 过去 60 秒',
    maxLogsPerInterval: '每 2 秒间隔最大日志数',
    searchPlaceholder: '搜索消息或 Trace ID...',
    switchToStream: '切换到实时日志流',
    applyHistoryFilters: '应用当前过滤器进行历史查询',
    hideStats: '隐藏统计面板',
    showStats: '显示统计面板',
    resumeStream: '恢复实时流',
    pauseStream: '暂停实时流',
    live: 'LIVE',
    disconnected: 'DISCONNECTED',
    loadingHistory: '正在查询历史日志...',
    loadingInitial: '正在加载初始日志...',
    restError: '无法连接到后端 REST API 或查询失败。',
    wsError: 'WebSocket 连接错误。请检查服务状态。',
    showing: '显示',
    logsUnit: '条日志',
    filtered: '已过滤',
    totalStreamBuffer: '实时流缓冲区总共',
    maxStorage: '最大存储量',
    historyResults: '历史查询结果:',
    unit: '条',
    pageOf: '页 / 共',
    perPage: '页 (每页',
    streamEmptyMessage: '实时流已暂停或没有匹配的日志。',
    historyEmptyMessage: '没有找到匹配的历史日志。',
    appStatus: '应用状态:',
    modeActive: '模式激活。后端 URL:',
    warningBackend: '**警告: 如果后端服务未运行，WebSocket 将报告连接错误。',
    pageTitle: '日志仪表盘',
    logs: '日志',
  },
  en: {
    appTitle: 'SOVD Remote Diagnosis Log Dashboard',
    filter: 'Filters',
    currentMode: 'Current Mode',
    streamMode: 'Stream Mode',
    historyMode: 'History Query',
    applyHistorySearch: 'Apply History Search',
    clearFilters: 'Clear Filters',
    logLevels: 'Log Levels',
    modules: 'Modules',
    invalidTime: 'Invalid Time',
    logDetails: 'Log Details',
    timestamp: 'Timestamp',
    level: 'Level',
    module: 'Module',
    fullTrace: 'Full Trace',
    message: 'Message',
    structuredData: 'Structured Data',
    copyJson: 'Copy JSON',
    detailsParseError: 'Failed to parse details',
    analyticsAndStats: 'Analytics & Statistics',
    totalFilteredLogs: 'Total Filtered Logs',
    levelDistribution: 'Log Level Distribution',
    moduleDistribution: 'Module Distribution',
    noMatchingLogs: 'No matching log data.',
    logRateTitle: 'Log Rate (Logs/sec) - Last 60 seconds',
    maxLogsPerInterval: 'Max logs per 2s interval',
    searchPlaceholder: 'Search Message or Trace ID...',
    switchToStream: 'Switch to Real-time Stream',
    applyHistoryFilters: 'Apply Filters for History Query',
    hideStats: 'Hide Stats Panel',
    showStats: 'Show Stats Panel',
    resumeStream: 'Resume Stream',
    pauseStream: 'Pause Stream',
    live: 'LIVE',
    disconnected: 'DISCONNECTED',
    loadingHistory: 'Querying historical logs...',
    loadingInitial: 'Loading initial logs...',
    restError: 'Could not connect to backend REST API or query failed.',
    wsError: 'WebSocket connection error. Check service status.',
    showing: 'Showing',
    logsUnit: 'logs',
    filtered: 'filtered',
    totalStreamBuffer: 'Total stream buffer:',
    maxStorage: 'Max storage:',
    historyResults: 'History results:',
    unit: '',
    pageOf: 'Page / Of',
    perPage: 'Pages (per',
    streamEmptyMessage: 'Stream paused or no matching logs found.',
    historyEmptyMessage: 'No matching historical logs found.',
    appStatus: 'Application Status:',
    modeActive: 'mode active. Backend URL:',
    warningBackend: '**WARNING: WebSocket will report a connection error if the backend service is not running.',
    pageTitle: 'Log Dashboard',
    logs: 'Logs',
  },
  ja: {
    appTitle: 'SOVDリモート診断ログダッシュボード',
    filter: 'フィルター',
    currentMode: '現在のモード',
    streamMode: 'リアルタイムストリーム',
    historyMode: '履歴検索',
    applyHistorySearch: '履歴検索を適用',
    clearFilters: 'フィルターをクリア',
    logLevels: 'ログレベル (Log Levels)',
    modules: 'モジュール (Modules)',
    invalidTime: '無効な時間',
    logDetails: 'ログの詳細',
    timestamp: 'タイムスタンプ',
    level: 'レベル',
    module: 'モジュール',
    fullTrace: '完全なトレース',
    message: 'メッセージ',
    structuredData: '構造化データ',
    copyJson: 'JSONをコピー',
    detailsParseError: '詳細の解析に失敗しました',
    analyticsAndStats: '分析と統計',
    totalFilteredLogs: 'フィルタリングされたログの合計数',
    levelDistribution: 'ログレベルの分布',
    moduleDistribution: 'モジュールの分布',
    noMatchingLogs: '一致するログデータがありません。',
    logRateTitle: 'ログレート (Logs/sec) - 過去60秒',
    maxLogsPerInterval: '2秒間隔あたりの最大ログ数',
    searchPlaceholder: 'メッセージまたはトレースIDを検索...',
    switchToStream: 'リアルタイムストリームに切り替える',
    applyHistoryFilters: '履歴検索にフィルターを適用',
    hideStats: '統計パネルを非表示',
    showStats: '統計パネルを表示',
    resumeStream: 'リアルタイムストリームを再開',
    pauseStream: 'リアルタイムストリームを一時停止',
    live: 'ライブ',
    disconnected: '切断済み',
    loadingHistory: '履歴ログを検索中...',
    loadingInitial: '初期ログをロード中...',
    restError: 'バックエンドREST APIに接続できませんでした、または検索に失敗しました。',
    wsError: 'WebSocket接続エラー。サービスの状態を確認してください。',
    showing: '表示中',
    logsUnit: '件のログ',
    filtered: 'フィルタリング済み',
    totalStreamBuffer: 'ストリームバッファ合計:',
    maxStorage: '最大ストレージ:',
    historyResults: '履歴検索結果:',
    unit: '件',
    pageOf: 'ページ / 全',
    perPage: 'ページ (1ページあたり',
    streamEmptyMessage: 'ストリームが一時停止しているか、一致するログが見つかりません。',
    historyEmptyMessage: '一致する履歴ログが見つかりません。',
    appStatus: 'アプリケーションステータス:',
    modeActive: 'モードがアクティブです。バックエンドURL:',
    warningBackend: '**警告: バックエンドサービスが実行されていない場合、WebSocketは接続エラーを報告します。',
    pageTitle: 'ログダッシュボード',
    logs: 'ログ',
  }
};

// --- TypeScript 接口定义 (Type Definitions) ---
type Language = 'zh' | 'en' | 'ja';
// 简化 T 函数类型，避免编译环境对泛型类型推断的复杂性
type TFunction = (key: string) => string; 

interface LogEntry {
  id: string;
  timestamp: string; 
  module: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'SUCCESS' | string;
  message: string;
  traceId: string;
  details: object | null; 
}

interface LogFilters {
  levels: Record<string, boolean>;
  modules: Record<string, boolean>;
  searchText: string;
}

interface DistributionItem {
  key: string;
  count: number;
  percentage: number;
  colorClass: string;
}

interface CalculatedStats {
  totalCount: number;
  levelDistribution: DistributionItem[];
  moduleDistribution: DistributionItem[];
}

interface TimeBin {
  timestamp: number;
  count: number;
}

// 预定义常量
const LOG_LEVELS: LogEntry['level'][] = ['ERROR', 'WARN', 'INFO', 'SUCCESS'];

// --- SOVD 模块定义 ---
const LOG_MODULES: LogEntry['module'][] = [
  'VEHICLE_OWNER',            // 车主应用/客户端
  'DIAGNOSIS_PLATFORM',       // 远程诊断平台
  'SOVD_CLIENT',              // 车载SOVD客户端/代理
  'HMI',                      // 人机界面
  'AUTH_SERVER',              // 认证服务器
  'CDA',                      // 云数据适配器 (Cloud Data Adapter)
  'PRIVATE_SERVER',           // 私有SOVD服务器
  'SOVD_GATEWAY',             // SOVD网关
];
// --------------------

// --- 工具函数 (Utility Functions) ---

const getColorClass = (key: string): string => {
  switch (key) {
    case 'ERROR': return 'bg-red-500';
    case 'WARN': return 'bg-yellow-500';
    case 'INFO': return 'bg-blue-500';
    case 'SUCCESS': return 'bg-green-500';
    // SOVD 模块颜色
    case 'VEHICLE_OWNER': return 'bg-sky-500';
    case 'DIAGNOSIS_PLATFORM': return 'bg-orange-500';
    case 'SOVD_CLIENT': return 'bg-fuchsia-500';
    case 'HMI': return 'bg-lime-500';
    case 'AUTH_SERVER': return 'bg-purple-500';
    case 'CDA': return 'bg-teal-500';
    case 'PRIVATE_SERVER': return 'bg-pink-500';
    case 'SOVD_GATEWAY': return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
};

const getInitialFilters = (): LogFilters => ({
  levels: LOG_LEVELS.reduce((acc, level) => ({ ...acc, [level]: true }), {} as Record<string, boolean>),
  modules: LOG_MODULES.reduce((acc, module) => ({ ...acc, [module]: true }), {} as Record<string, boolean>),
  searchText: '',
});

/**
 * 生成一组演示日志数据，用于在后端连接前填充UI。
 * 日志消息已更新为英文，以更好地模拟国际化系统的日志。
 */
const generateDemoLogs = (): LogEntry[] => {
  const now = Date.now();
  const baseLogs: Partial<LogEntry>[] = [
    { level: 'ERROR', module: 'SOVD_GATEWAY', message: 'Connection to on-board SOVD Client lost, attempting reconnect.', details: { vehicle_id: 'V-001A', reason: 'Timeout' } },
    { level: 'INFO', module: 'VEHICLE_OWNER', message: 'Vehicle Owner initiated remote diagnosis request via App.', details: { user_id: 'U789', timestamp_ms: now - 30000 } },
    { level: 'SUCCESS', module: 'DIAGNOSIS_PLATFORM', message: 'Diagnosis task D-456 started, beginning data pull from CDA.', details: { task_id: 'D-456', vehicle_id: 'V-002B' } },
    { level: 'WARN', module: 'SOVD_CLIENT', message: 'Local log cache size exceeds threshold (500MB).', details: { current_size_mb: 512, limit_mb: 500 } },
    { level: 'INFO', module: 'HMI', message: 'Displaying "Remote Diagnosis In Progress" notification on HMI.', details: { hmi_view: 'DIAG_LOADING' } },
    { level: 'ERROR', module: 'AUTH_SERVER', message: 'Authentication token provided by SOVD Gateway expired. Access denied.', details: { token_expiry: '2025-09-10T10:00:00Z', gateway_ip: '10.0.1.5' } },
    { level: 'SUCCESS', module: 'CDA', message: 'ECU data stream ingestion complete, took 120ms.', details: { data_type: 'ECU_STREAM', record_count: 5000 } },
    { level: 'WARN', module: 'SOVD_GATEWAY', message: 'High data reception latency from Private SOVD Server (3500ms).', details: { latency_ms: 3500, server_id: 'PS-EAST' } },
    { level: 'INFO', module: 'PRIVATE_SERVER', message: 'Received data query request from Diagnosis Platform.', details: { query_type: 'TELEMETRY_BATCH', vehicle_count: 1 } },
    { level: 'ERROR', module: 'SOVD_CLIENT', message: 'Failed to compress diagnosis log package, filesystem error.', details: { log_path: '/mnt/diag/logs.zip', error_code: 'FS_003' } },
  ];

  return baseLogs.map((log, index) => {
    const timeOffset = index * 3000 + Math.random() * 1000;
    const timestamp = new Date(now - timeOffset).toISOString();
    return {
      id: `demo-${index}-${now}`,
      timestamp: timestamp,
      traceId: `TRACE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      // 确保所有属性都存在
      message: log.message || 'Demo log message',
      level: log.level || 'INFO',
      module: log.module || 'SYSTEM',
      details: log.details || null,
    } as LogEntry;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- LogItem Component ---
const LogItem = React.memo(({ log, onSelect, isSelected, t }: { log: LogEntry, onSelect: (log: LogEntry) => void, isSelected: boolean, t: TFunction }) => {
  if (!log) return null;

  const timeString = useMemo(() => {
    try {
      // 动态使用本地化时间格式
      const locale = t('appStatus').includes('Application Status') ? 'en-US' : (t('appStatus').includes('アプリケーションステータス') ? 'ja-JP' : 'zh-CN');
      return new Date(log.timestamp).toLocaleTimeString(locale);
    } catch {
      return t('invalidTime');
    }
  }, [log.timestamp, t]);

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
      className={`flex items-center text-xs transition-colors duration-100 px-4 cursor-pointer h-9 border-b border-gray-100 ${isSelected ? 'bg-indigo-100 hover:bg-indigo-200' : 'hover:bg-gray-50'}`}
      onClick={() => onSelect(log)}
    >
      <div className="w-32 font-mono text-gray-500 shrink-0">
        {timeString}
      </div>
      <div className={`w-16 font-semibold rounded-full px-2 py-0.5 text-center shrink-0 border ${levelClasses}`}>
        {log.level.slice(0, 1)}
      </div>
      <div className="w-20 font-mono text-purple-600 ml-4 shrink-0 truncate" title={log.module}>
        {log.module}
      </div>
      <div className="flex-grow text-gray-800 font-mono text-xs truncate ml-4">
        {log.message}
      </div>
      <div className="w-20 text-gray-400 text-[10px] shrink-0 text-right">
        {log.traceId}
      </div>
    </div>
  );
});

// --- FilterSidebar Component ---
const FilterSidebar = ({ filters, setFilters, logCounts, viewMode, onHistorySearch, t }: { 
    filters: LogFilters, 
    setFilters: (f: LogFilters) => void, 
    logCounts: Record<string, number>,
    viewMode: 'STREAM' | 'HISTORY',
    onHistorySearch: () => void,
    t: TFunction
  }) => {
  const [openSection, setOpenSection] = useState<'levels' | 'modules'>('levels');

  const toggleFilter = (type: 'levels' | 'modules', key: string) => {
    setFilters({
      ...filters,
      [type]: {
        ...filters[type],
        [key]: !filters[type][key],
      },
    });
  };

  const renderFilterGroup = (titleKey: 'logLevels' | 'modules', keys: string[], type: 'levels' | 'modules') => (
    <div className="mb-4 rounded-lg bg-white p-3 shadow-sm border border-gray-100">
      <h3
        className="text-sm font-semibold text-gray-700 mb-2 flex justify-between items-center cursor-pointer"
        onClick={() => setOpenSection(openSection === type ? ('' as 'levels') : type)}
      >
        {t(titleKey)}
        {openSection === type ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </h3>
      <div className={openSection === type ? 'block' : 'hidden'}>
        {keys.map(key => {
          const isChecked = filters[type][key];
          const count = logCounts[key] || 0;
          return (
            <div key={key} className="flex items-center justify-between py-1 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFilter(type, key)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{key}</span>
              </label>
              <span className="text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full min-w-[50px] text-center">
                {viewMode === 'STREAM' ? count : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-64 p-4 bg-gray-50 border-r overflow-y-auto shrink-0">
      <div className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <Filter size={18} className="mr-2" /> {t('filter')}
      </div>
      
      <div className={`p-3 rounded-lg text-sm mb-4 transition-colors font-semibold border ${viewMode === 'STREAM' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
        {t('currentMode')}: {viewMode === 'STREAM' ? t('streamMode') : t('historyMode')}
      </div>

      {/* Level Filter Group */}
      {renderFilterGroup('logLevels', LOG_LEVELS, 'levels')}

      {/* Module Filter Group */}
      {renderFilterGroup('modules', LOG_MODULES, 'modules')}
      
      {/* Action Buttons */}
      <div className="space-y-2 mt-6">
        <button 
          onClick={onHistorySearch}
          className="w-full py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center justify-center"
        >
          <Database size={16} className="mr-2" />
          {t('applyHistorySearch')}
        </button>

        <button 
          onClick={() => setFilters(getInitialFilters())}
          className="w-full py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors shadow-sm"
        >
          {t('clearFilters')}
        </button>
      </div>
    </div>
  );
};

// --- LogDetailPanel Component ---
const DetailItem = ({ label, value, color }: { label: string, value: string, color?: string }) => {
  const levelColor = color ? (
    color === 'ERROR' ? 'text-red-600' :
    color === 'WARN' ? 'text-yellow-700' :
    color === 'INFO' ? 'text-blue-600' :
    color === 'SUCCESS' ? 'text-green-600' : 'text-gray-700'
  ) : 'text-gray-700';

  return (
    <div className="flex text-sm font-medium">
      <span className="w-24 text-gray-500 shrink-0">{label}:</span>
      <span className={`flex-1 font-mono text-xs ${levelColor}`}>{value}</span>
    </div>
  );
};

const LogDetailPanel = ({ log, onClose, t }: { log: LogEntry, onClose: () => void, t: TFunction }) => {
  
  const handleCopy = (text: string) => {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
  };
  
  const detailsString = useMemo(() => {
    if (!log.details) return null;
    try {
      return JSON.stringify(log.details, null, 2);
    } catch (e) {
      return JSON.stringify({ error: t('detailsParseError') }, null, 2);
    }
  }, [log.details, t]);

  const handleTraceRequest = (traceId: string) => {
    console.warn(`Requested Trace ID: ${traceId}. Backend is processing full span data.`);
  };

  // 根据当前语言获取对应的 locale 字符串
  const getLocale = () => {
    if (t('appStatus').includes('Application Status')) return 'en-US';
    if (t('appStatus').includes('アプリケーションステータス')) return 'ja-JP';
    return 'zh-CN';
  };


  return (
    <div className="w-96 bg-white border-l flex flex-col shadow-xl z-20 shrink-0">
      <div className="p-4 flex justify-between items-center border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">{t('logDetails')}</h3>
        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        <div className="space-y-1">
          <DetailItem label={t('timestamp')} value={new Date(log.timestamp).toLocaleString(getLocale())} />
          <DetailItem label={t('level')} value={log.level} color={log.level} />
          <DetailItem label={t('module')} value={log.module} />
          <div className="flex items-center text-sm font-medium">
            <span className="w-24 text-gray-500 shrink-0">Trace ID:</span>
            <code className="text-indigo-600 font-mono text-xs bg-indigo-50 px-2 py-0.5 rounded mr-2">{log.traceId}</code>
            <button 
              onClick={() => handleTraceRequest(log.traceId)}
              className="text-xs text-white bg-indigo-500 hover:bg-indigo-600 rounded px-2 py-0.5 flex items-center transition-colors"
              title={t('fullTrace')}
            >
              <Zap size={12} className="mr-1" /> {t('fullTrace')}
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />
        
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-700">{t('message')}:</p>
          <p className="text-gray-800 font-mono text-sm whitespace-pre-wrap p-2 bg-gray-100 rounded">{log.message}</p>
        </div>

        {detailsString && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700">{t('structuredData')}:</p>
              <button 
                onClick={() => handleCopy(detailsString || '')}
                className="text-xs text-gray-500 hover:text-indigo-600 flex items-center transition-colors"
              >
                <Copy size={12} className="mr-1" /> {t('copyJson')}
              </button>
            </div>
            <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto max-h-96">
              <code>{detailsString}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};


// --- StatsPanel Component ---
const StatsPanel = ({ stats, onClose, t }: { stats: CalculatedStats, onClose: () => void, t: TFunction }) => {

  const renderDistributionChart = (titleKey: 'levelDistribution' | 'moduleDistribution', distribution: DistributionItem[]) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h4 className="text-base font-semibold text-gray-700 mb-3">{t(titleKey)}</h4>
      {stats.totalCount === 0 ? (
        <p className="text-sm text-gray-500">{t('noMatchingLogs')}</p>
      ) : (
        <div className="space-y-3">
          {distribution
            .sort((a, b) => b.count - a.count)
            .map(({ key, count, percentage, colorClass }) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-800">{key}</span>
                  <span className="text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2.5`}>
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`} 
                    style={{ width: `${percentage}%` }}
                    title={`${key}: ${count} (${percentage.toFixed(1)}%)`}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-100 p-4 border-b shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <BarChart3 size={20} className="mr-2 text-indigo-600" />
          {t('analyticsAndStats')}
        </h3>
        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-400 transition-colors">
          <ChevronUp size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('totalFilteredLogs')}</p>
            <p className="text-3xl font-extrabold text-gray-900">{stats.totalCount}</p>
          </div>
          <TrendingUp size={36} className="text-indigo-200" />
        </div>
        {renderDistributionChart('levelDistribution', stats.levelDistribution)}
        {renderDistributionChart('moduleDistribution', stats.moduleDistribution)}
      </div>
    </div>
  );
}


// --- TimeHistogram Component ---
const TimeHistogram = ({ data, maxCount, t }: { data: TimeBin[], maxCount: number, t: TFunction }) => {
  
  const getLocale = () => {
    if (t('appStatus').includes('Application Status')) return 'en-US';
    if (t('appStatus').includes('アプリケーションステータス')) return 'ja-JP';
    return 'zh-CN';
  };
  
  return (
    <div className="bg-gray-50 p-3 border-b border-t shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
          <Clock size={16} className="mr-1 text-indigo-500" />
          {t('logRateTitle')}
        </h4>
        <span className="text-xs text-gray-500">{t('maxLogsPerInterval')}: {maxCount}</span>
      </div>
      <div className="flex h-12 w-full space-x-[1px] items-end">
        {data.map((bin, index) => {
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


// --- Main Application Component (App) ---
const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh'); // 默认中文
  const t = useCallback((key: keyof typeof translations['zh']) => {
    // 强制类型转换为索引签名，以便可以使用任何键
    return (translations[language] as any)[key] || key;
  }, [language]);
    
  const [isAuthReady, setIsAuthReady] = useState(false);
  // 使用 demo logs 初始化状态，确保UI在加载真实数据前不为空
  const [logs, setLogs] = useState<LogEntry[]>(() => generateDemoLogs()); 
  const [filters, setFilters] = useState<LogFilters>(getInitialFilters());
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  // 初始设置为 false，以便 demo logs 能够立即显示
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); 
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 历史模式状态
  const [viewMode, setViewMode] = useState<'STREAM' | 'HISTORY'>('STREAM'); 
  const [page, setPage] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(generateDemoLogs().length); // 初始计数使用 demo logs 数量

  const logListRef = useRef<HTMLDivElement>(null); 
  const wsRef = useRef<WebSocket | null>(null);
  
  // --- 1. Firebase 初始化与认证 ---
  useEffect(() => {
    // 强制使用提供的全局变量进行配置
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

    if (Object.keys(firebaseConfig).length === 0) {
      console.warn("未提供 Firebase 配置。以本地模拟模式运行。");
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      // const db = getFirestore(app); // Firestore 在本应用中不需要

      const authenticate = async () => {
        if (initialAuthToken) {
          try {
            await signInWithCustomToken(auth, initialAuthToken);
          } catch (error) {
            console.error("使用自定义令牌登录失败:", error);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
        setIsAuthReady(true);
      };

      authenticate();
    } catch (e) {
      console.error("Firebase 初始化失败:", e);
      setIsAuthReady(true); 
    }
  }, []);
  
  // --- UTILITY: 日志处理 ---
  const processNewLog = useCallback((newLog: LogEntry) => {
     setLogs(prevLogs => {
        // 限制日志数量以保持性能
        const newLogs = [newLog, ...prevLogs];
        return newLogs.slice(0, MAX_LOG_COUNT);
     });
  }, []);

  // --- 2. REST API 历史日志获取 ---
  const fetchHistoricalLogs = useCallback(async (
    offset: number, 
    limit: number, 
    currentFilters: LogFilters
  ) => {
    setIsLoadingHistory(true);
    setConnectionError(null);
    setSelectedLog(null); 

    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    // 过滤活动级别和模块
    const activeLevels = LOG_LEVELS.filter(l => currentFilters.levels[l]).join(',');
    if (activeLevels) queryParams.append('levels', activeLevels);

    const activeModules = LOG_MODULES.filter(m => currentFilters.modules[m]).join(',');
    if (activeModules) queryParams.append('modules', activeModules);

    if (currentFilters.searchText) queryParams.append('search', currentFilters.searchText);
    
    // 增加指数退避重试逻辑
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/logs?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        setLogs(data.logs || []);
        // 假设 mock 后端返回 { logs: [...], total: N }
        setTotalLogsCount(data.total || data.logs.length); 
        setIsLoadingHistory(false);
        return; // 成功返回
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          // 等待指数退避时间
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error("Failed to fetch historical logs:", lastError);
    setConnectionError(t('restError'));
    setIsLoadingHistory(false);
    
  }, [t]);

  // --- 3. WebSocket 连接管理 ---
  const setupWebSocket = useCallback(() => {
      // 检查当前是否已连接，如果是，则先关闭
      if (wsRef.current) {
          wsRef.current.onclose = null; // 避免触发自动重连
          wsRef.current.close();
          wsRef.current = null;
      }
      
      const wsUrl = BACKEND_URL.replace('http', 'ws') + '/ws/logs';
      
      try {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
              console.log("WebSocket connected.");
              setIsConnected(true);
              setConnectionError(null);
          };

          ws.onmessage = (event) => {
              if (!isPaused && viewMode === 'STREAM') {
                  try {
                      const newLog: LogEntry = JSON.parse(event.data);
                      processNewLog(newLog); 
                  } catch (e) {
                      console.error("Failed to parse WebSocket message:", e);
                  }
              }
          };

          ws.onclose = () => {
              console.log("WebSocket disconnected.");
              setIsConnected(false);
              // 自动重连 (3秒后)
              setTimeout(setupWebSocket, 3000); 
          };

          ws.onerror = (error) => {
              console.error("WebSocket error:", error);
              setIsConnected(false);
              setConnectionError(t('wsError'));
              ws.close();
          };
          
      } catch (e) {
           console.error("Failed to instantiate WebSocket:", e);
           setConnectionError(t('wsError'));
      }
  }, [isPaused, viewMode, processNewLog, t]);

  // --- 4. 主效果钩子：认证、初始加载和连接设置 ---
  useEffect(() => {
    if (!isAuthReady) return;
    
    // 初始化时加载数据
    if (viewMode === 'STREAM') {
       // 加载初始实时流缓冲区数据。这将覆盖初始的 demo logs。
       fetchHistoricalLogs(0, PAGE_SIZE, getInitialFilters());
    } else {
       // 如果一开始就在 HISTORY 模式，则加载第一页
       fetchHistoricalLogs((page - 1) * PAGE_SIZE, PAGE_SIZE, filters);
    }
    
    setupWebSocket();

    // 清理函数：组件卸载时关闭 WebSocket
    return () => {
      if (wsRef.current) {
          wsRef.current.onclose = null; // 避免在卸载时触发重连
          wsRef.current.close();
      }
    };
  }, [isAuthReady, viewMode, setupWebSocket, fetchHistoricalLogs]); 

  // --- 5. 过滤器变化时通知 WebSocket 服务器 (仅 STREAM 模式) ---
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && viewMode === 'STREAM') {
      const currentFilters = { 
          levels: LOG_LEVELS.filter(l => filters.levels[l]),
          modules: LOG_MODULES.filter(m => filters.modules[m]),
          searchText: filters.searchText 
      };
      // 将当前活动过滤器发送到后端进行服务器端流过滤
      wsRef.current.send(JSON.stringify(currentFilters));
    }
  }, [filters, viewMode]);


  // --- 6. 历史查询和分页处理 ---
  const applyHistoryFilters = () => {
    if (viewMode === 'STREAM') {
      setLogs([]); // 清空流缓冲区
    }
    setViewMode('HISTORY');
    setPage(1); // 重新搜索时重置到第 1 页
    fetchHistoricalLogs(0, PAGE_SIZE, filters);
  }

  const goToStreamMode = () => {
    setViewMode('STREAM');
    setLogs(generateDemoLogs()); // 切换回 Stream 模式时，重新加载 demo logs，直到真实的流数据到达
    setTotalLogsCount(generateDemoLogs().length);
    setFilters(getInitialFilters()); // 重置过滤器
    // 重新连接并加载初始流数据
    fetchHistoricalLogs(0, PAGE_SIZE, getInitialFilters());
  }

  const handlePageChange = (newPage: number) => {
    const max = Math.ceil(totalLogsCount / PAGE_SIZE);
    if (newPage < 1 || newPage > max || isLoadingHistory) return;
    setPage(newPage);
    fetchHistoricalLogs((newPage - 1) * PAGE_SIZE, PAGE_SIZE, filters);
  }


  // --- 7. 客户端日志过滤 (仅 STREAM 模式用于本地缓冲区) ---
  const filteredLogs = useMemo(() => {
    if (viewMode === 'HISTORY') {
      // 历史模式下的日志已由后端过滤
      return logs;
    }
    
    // 实时流模式下，应用客户端过滤器到本地缓冲区
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


  // --- 8. 统计数据计算 ---
  const calculatedStats: CalculatedStats = useMemo(() => {
    const totalCount = filteredLogs.length;
    const levelCounts: Record<string, number> = {};
    const moduleCounts: Record<string, number> = {};

    filteredLogs.forEach(log => {
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      moduleCounts[log.module] = (moduleCounts[log.module] || 0) + 1;
    });

    const calculateDistribution = (counts: Record<string, number>, keys: string[]): DistributionItem[] => {
      return keys
        .map(key => {
          const count = counts[key] || 0;
          const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
          return {
            key,
            count,
            percentage,
            colorClass: getColorClass(key)
          };
        })
        .filter(item => item.count > 0); 
    };

    return {
      totalCount,
      levelDistribution: calculateDistribution(levelCounts, LOG_LEVELS),
      moduleDistribution: calculateDistribution(moduleCounts, LOG_MODULES),
    };
  }, [filteredLogs]);


  const timeHistogramData = useMemo(() => {
    if (viewMode === 'HISTORY') return { bins: [], maxCount: 0 };
    
    const intervalMs = 60 * 1000;
    const now = Date.now();
    const startTime = now - intervalMs;
    const numBins = 30; // 30 bin = 2 seconds per bin

    const binSizeMs = intervalMs / numBins;
    
    const bins: TimeBin[] = Array(numBins).fill(0).map((_, i) => ({
      timestamp: startTime + i * binSizeMs,
      count: 0,
    }));

    let maxCount = 0;
    
    logs.forEach(log => {
      let logTime: number;
      try {
        logTime = new Date(log.timestamp).getTime(); 
      } catch {
        return;
      }

      if (logTime >= startTime) {
        const binIndex = Math.floor((logTime - startTime) / binSizeMs);
        if (binIndex >= 0 && binIndex < numBins) {
          bins[binIndex].count++;
          maxCount = Math.max(maxCount, bins[binIndex].count);
        }
      }
    });

    return { bins, maxCount };
  }, [logs, viewMode]);


  const logCounts = useMemo(() => {
    // 用于过滤器侧边栏的计数，基于当前显示的 (已过滤的) 日志
    const counts: Record<string, number> = LOG_LEVELS.concat(LOG_MODULES).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    
    filteredLogs.forEach(log => {
      counts[log.level] = (counts[log.level] || 0) + 1;
      counts[log.module] = (counts[log.module] || 0) + 1;
    });
    return counts;
  }, [filteredLogs]);


  // --- 9. 自动滚动逻辑 ---
  useEffect(() => {
    if (logListRef.current && !isPaused && viewMode === 'STREAM') {
      // 保持滚动条在顶部 (最新日志)
      logListRef.current.scrollTop = 0;
    }
  }, [filteredLogs.length, isPaused, viewMode]);

  // --- 10. 事件处理器 ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchText: e.target.value });
  };
  
  const handleLogSelect = (log: LogEntry) => {
    setSelectedLog(prev => prev?.id === log.id ? null : log);
  }
  
  const togglePause = () => {
    setIsPaused(p => !p);
  };
  
  const toggleLanguage = () => {
    setLanguage(lang => {
      if (lang === 'zh') return 'en';
      if (lang === 'en') return 'ja';
      return 'zh';
    });
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

  const maxPage = Math.ceil(totalLogsCount / PAGE_SIZE);

  // --- 渲染 (Render) ---

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header Bar */}
      <header className="flex items-center justify-between p-4 bg-white shadow-md z-10 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <LogOut size={24} className="text-indigo-600 mr-3 transform rotate-90" />
          {t('appTitle')}
        </h1>

        {/* Search and Controls */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="py-2 px-4 w-64 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
              value={filters.searchText}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* View Mode Switcher */}
          {viewMode === 'HISTORY' ? (
            <button
              onClick={goToStreamMode}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center"
              title={t('switchToStream')}
            >
              <List size={16} className="mr-2" />
              {t('streamMode')}
            </button>
          ) : (
             <button
              onClick={applyHistoryFilters}
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

          {/* Toggle Stats Panel Button */}
          <button
            onClick={() => setIsStatsVisible(p => !p)}
            className={`p-2 rounded-full shadow-md transition-all ${isStatsVisible ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            title={isStatsVisible ? t('hideStats') : t('showStats')}
          >
            <BarChart3 size={20} />
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

          {/* Connection Status Indicator (Only in Stream Mode) */}
          <span className={`flex items-center text-sm font-medium p-2 rounded-lg ${isConnected && viewMode === 'STREAM' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ${viewMode === 'HISTORY' ? 'opacity-50' : ''}`}>
            <Wifi size={16} className={`mr-1 ${isConnected && viewMode === 'STREAM' ? 'animate-pulse' : ''}`} />
            {isConnected ? t('live') : t('disconnected')}
          </span>
          
        </div>
      </header>

      {/* Connection/Error Message Bar */}
      {(isLoadingHistory || connectionError) && (
          <div className={`p-3 text-sm flex items-center shrink-0 ${connectionError ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'}`}>
              <AlertTriangle size={18} className="mr-2" />
              {isLoadingHistory ? (viewMode === 'HISTORY' ? t('loadingHistory') : t('loadingInitial')) : connectionError}
          </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Filters */}
        <FilterSidebar 
          filters={filters} 
          setFilters={setFilters} 
          logCounts={logCounts} 
          viewMode={viewMode}
          onHistorySearch={applyHistoryFilters}
          t={t}
        />

        {/* Main Log Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Statistics Panel */}
          {isStatsVisible && (
            <StatsPanel stats={calculatedStats} onClose={() => setIsStatsVisible(false)} t={t} />
          )}

          {/* Time Histogram (Only in Stream Mode) */}
          {viewMode === 'STREAM' && (
            <TimeHistogram data={timeHistogramData.bins} maxCount={timeHistogramData.maxCount} t={t} />
          )}

          {/* Log List Header / Pagination */}
          <div className="py-2 px-4 bg-gray-200 border-b flex justify-between items-center text-sm font-semibold text-gray-700 shadow-inner shrink-0">
            {viewMode === 'STREAM' ? (
                <span>
                  {t('showing')} {filteredLogs.length} {t('logsUnit')} ({t('filtered')}) / {t('totalStreamBuffer')} {logs.length} ({t('maxStorage')}: {MAX_LOG_COUNT})
                </span>
            ) : (
                <div className="flex items-center space-x-4">
                    <span>
                      {t('historyResults')} 
                      <span className="font-extrabold text-indigo-600 ml-1">{totalLogsCount}</span> {t('unit')}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1 || isLoadingHistory}
                          className="p-1 rounded bg-white hover:bg-gray-100 disabled:opacity-50 border"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-gray-800">
                          {t('pageOf')} {page} {t('pageOf')} {maxPage} {t('perPage')} {PAGE_SIZE} {t('unit')})
                        </span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= maxPage || isLoadingHistory}
                          className="p-1 rounded bg-white hover:bg-gray-100 disabled:opacity-50 border"
                        >
                          <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
            
          </div>
          
          {/* Native Scroll Log List */}
          <div className="flex-1 flex overflow-hidden">
            <div 
              ref={logListRef} 
              className="w-full h-full overflow-y-scroll"
            >
              {filteredLogs.map(log => (
                <LogItem
                  key={log.id} 
                  log={log}
                  onSelect={handleLogSelect}
                  isSelected={selectedLog?.id === log.id}
                  t={t}
                />
              ))}
              {/* Fallback Warning */}
              {filteredLogs.length === 0 && !isLoadingHistory && (
                  <div className="p-8 text-center text-gray-500">
                      <List size={32} className="mx-auto mb-2" />
                      {viewMode === 'STREAM' ? t('streamEmptyMessage') : t('historyEmptyMessage')}
                  </div>
              )}
            </div>
            
            {/* Log Detail Panel */}
            {selectedLog && (
              <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} t={t} />
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="p-2 text-xs text-gray-500 text-center bg-white border-t shrink-0">
        {t('appStatus')} {viewMode} {t('modeActive')} {BACKEND_URL}。
        <span className="ml-4 text-red-500">
          {t('warningBackend')}
        </span>
      </footer>
    </div>
  );
};

export default App;
```


## The Philosophy: Separation of Concerns

The core goal is to break down the monolithic file into logical units:
- Components: Reusable UI pieces.
- State Management: A central place to manage application state, avoiding prop-drilling. We'll use Zustand for its simplicity and power.
- Services: Logic for interacting with external APIs (REST and WebSocket).
- Hooks: Reusable component logic.
- Constants & Types: Centralized definitions for constants and TypeScript types.
- Utilities: Generic helper functions.
- Internationalization (i18n): A dedicated structure for managing translations.

## Code Structure

```Bash
sovd-dashboard/
├── public/
├── src/
│   ├── api/
│   │   ├── logService.ts        # Handles REST API calls for logs
│   │   └── webSocketService.ts  # Manages the WebSocket connection
│   │
│   ├── assets/                  # (For images, svgs, etc. if any)
│   │
│   ├── components/
│   │   ├── common/              # Small, truly generic components (e.g., Button, Spinner)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── PageWrapper.tsx
│   │   ├── dashboard/
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── LogDetailPanel.tsx
│   │   │   ├── LogItem.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   └── TimeHistogram.tsx
│   │
│   ├── constants/
│   │   ├── index.ts             # Exports all constants
│   │   └── logConstants.ts      # LOG_LEVELS, LOG_MODULES, etc.
│   │
│   ├── hooks/
│   │   ├── useLogStream.ts      # Custom hook to manage data flow
│   │   └── useTranslation.ts    # Custom hook for i18n
│   │
│   ├── i18n/
│   │   ├── I18nProvider.tsx     # Context provider for language
│   │   └── translations.ts      # The translations object
│   │
│   ├── pages/
│   │   └── DashboardPage.tsx    # The main page component
│   │
│   ├── store/
│   │   └── logStore.ts          # Zustand store for global state
│   │
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces and types
│   │
│   ├── utils/
│   │   ├── colorUtils.ts        # getColorClass function
│   │   └── logUtils.ts          # generateDemoLogs function
│   │
│   ├── App.tsx                  # Main app component (handles routing, providers)
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles (including Tailwind directives)
│
├── .env.local                   # Environment variables
├── package.json
├── tsconfig.json
└── vite.config.js
```