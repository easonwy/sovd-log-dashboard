import { LogFilters, LogEntry } from '@/types';
import { LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';

export const getInitialFilters = (): LogFilters => ({
  levels: LOG_LEVELS.reduce((acc, level) => ({ ...acc, [level]: true }), {} as Record<string, boolean>),
  modules: LOG_MODULES.reduce((acc, module) => ({ ...acc, [module]: true }), {} as Record<string, boolean>),
  searchText: '',
});

export const generateDemoLogs = (): LogEntry[] => {
    // ... (copy the entire generateDemoLogs function from the original file here)
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
        eventId: `EVENT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        message: log.message || 'Demo log message',
        level: log.level || 'INFO',
        module: log.module || 'SYSTEM',
        details: log.details || null,
      } as LogEntry;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};