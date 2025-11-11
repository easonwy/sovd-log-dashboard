import { LogEntry } from '@/types';
import { LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';

/**
 * Generates a batch of realistic, static demo logs for initial loads or history mode.
 * @returns An array of LogEntry objects.
 */
export const generateDemoLogs = (): LogEntry[] => {
  const now = Date.now();
  const baseLogs: Partial<LogEntry>[] = [
    { level: 'ERROR', module: 'SOVD_GATEWAY', message: 'Connection to on-board SOVD Client lost, attempting reconnect.', details: { vehicle_id: 'V-001A', reason: 'Timeout' } },
    { level: 'INFO', module: 'VEHICLE_OWNER', message: 'Vehicle Owner initiated remote diagnosis request via App.', details: { user_id: 'U789', timestamp_ms: now - 30000 } },
    // ... (include all the other demo log objects from your original file)
    { level: 'SUCCESS', module: 'CDA', message: 'ECU data stream ingestion complete, took 120ms.', details: { data_type: 'ECU_STREAM', record_count: 5000 } },
    { level: 'WARN', module: 'SOVD_GATEWAY', message: 'High data reception latency from Private SOVD Server (3500ms).', details: { latency_ms: 3500, server_id: 'PS-EAST' } },
    { level: 'INFO', module: 'PRIVATE_SERVER', message: 'Received data query request from Diagnosis Platform.', details: { query_type: 'TELEMETRY_BATCH', vehicle_count: 1 } },
    { level: 'ERROR', module: 'SOVD_CLIENT', message: 'Failed to compress diagnosis log package, filesystem error.', details: { log_path: '/mnt/diag/logs.zip', error_code: 'FS_003' } },
  ];

  return Array.from({ length: 100 }, (_, i) => baseLogs[i % baseLogs.length])
    .map((log, index) => {
      const timeOffset = index * 3000 + Math.random() * 1000;
      const timestamp = new Date(now - timeOffset).toISOString();
      return {
        id: crypto.randomUUID(), // Use modern UUID generation
        timestamp: timestamp,
        traceId: `TRACE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        message: log.message || 'Demo log message',
        level: log.level || 'INFO',
        module: log.module || 'SYSTEM',
        details: log.details || null,
      } as LogEntry;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const mockMessages = [
    "Authentication successful for user_id: 12345",
    "Data packet received from CDA. Size: 2.5MB",
    "Vehicle telemetry data ingested into time-series DB.",
    "WARN: High CPU usage detected on SOVD_GATEWAY (92%).",
    "ERROR: Failed to connect to AUTH_SERVER. Reason: Connection refused.",
    "Diagnosis task 'D-789' initiated by remote platform.",
    "HMI notification displayed: 'Software Update Available'.",
    "Log cache flushed to persistent storage.",
];

/**
 * Generates a single, new, random log entry for the mock WebSocket stream.
 * @returns A new LogEntry object.
 */
export const generateMockStreamLog = (): LogEntry => {
    const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
    const module = LOG_MODULES[Math.floor(Math.random() * LOG_MODULES.length)];
    const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];

    return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level,
        module,
        message,
        traceId: `TRACE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        details: { mock: true, generatedAt: Date.now() },
    };
};