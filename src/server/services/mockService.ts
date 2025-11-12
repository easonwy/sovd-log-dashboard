import { v4 as uuidv4 } from 'uuid';
import { LogEntry } from '@/types';

const LOG_LEVELS: LogEntry['level'][] = ['ERROR', 'WARN', 'INFO', 'SUCCESS'];
const LOG_MODULES = ['VEHICLE_OWNER', 'DIAGNOSIS_PLATFORM', 'SOVD_CLIENT', 'HMI', 'AUTH_SERVER', 'CDA', 'PRIVATE_SERVER', 'SOVD_GATEWAY'];

/**
 * Generate a single mock log entry
 */
export function generateMockLog(): LogEntry {
  const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
  const module = LOG_MODULES[Math.floor(Math.random() * LOG_MODULES.length)] as LogEntry['module'];
  const traceId = Math.random().toString(36).substring(2, 9).toUpperCase();

  let message = `Request processed successfully in ${module}.`;
  let details: object | null = null;

  if (level === 'ERROR' || level === 'WARN') {
    message = level === 'ERROR' 
      ? `Error in ${module}: Operation failed with HTTP 500.`
      : `Warning: ${module} detected high load.`;
    details = {
      errorType: level === 'ERROR' ? 'ServiceError' : 'PerformanceWarning',
      endpoint: `/api/${module.toLowerCase()}/execute`,
      durationMs: Math.floor(Math.random() * 5000),
    };
    if (level === 'ERROR') {
      details = { ...details, stackTrace: 'Error stack trace...' };
    }
  } else if (level === 'INFO') {
    message = `User session started in ${module}.`;
  }

  const now = new Date();
  const randomOffset = Math.floor(Math.random() * 86400000); // Random time within 24h
  const timestamp = new Date(now.getTime() - randomOffset);

  return {
    id: `log-${uuidv4()}`,
    timestamp: timestamp.toISOString(),
    module,
    level,
    message,
    traceId,
    details,
  };
}

/**
 * Generate mock logs array for testing
 */
export function generateMockLogs(count: number = 1000): LogEntry[] {
  const logs: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    logs.push(generateMockLog());
  }
  // Sort by timestamp descending
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Calculate mock statistics from logs
 */
export function calculateMockStats(logs: LogEntry[]) {
  const totalLogs = logs.length;
  
  // Level distribution
  const levelDistribution = LOG_LEVELS.reduce((acc, level) => {
    const count = logs.filter(l => l.level === level).length;
    acc[level] = {
      count,
      percentage: totalLogs > 0 ? (count / totalLogs) * 100 : 0,
    };
    return acc;
  }, {} as Record<string, { count: number; percentage: number }>);

  // Module distribution
  const moduleDistribution = LOG_MODULES.reduce((acc, module) => {
    const count = logs.filter(l => l.module === module).length;
    acc[module] = {
      count,
      percentage: totalLogs > 0 ? (count / totalLogs) * 100 : 0,
    };
    return acc;
  }, {} as Record<string, { count: number; percentage: number }>);

  // Time series (group by hour)
  const timeSeries: Record<string, number> = {};
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
    timeSeries[hour] = (timeSeries[hour] || 0) + 1;
  });

  return {
    totalLogs,
    levelDistribution,
    moduleDistribution,
    timeSeries: Object.entries(timeSeries)
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  };
}
