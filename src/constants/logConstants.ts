import { LogEntry } from '@/types';

/**
 * The maximum number of log entries to keep in the client-side buffer for stream mode.
 * This helps manage memory usage and maintain performance.
 */
export const MAX_LOG_COUNT = 5000;

/**
 * The number of log entries to fetch per page when in history query mode.
 */
export const PAGE_SIZE = 500;

/**
 * A predefined list of all possible log levels.
 * This is used for creating filters and statistical charts.
 * The type `LogEntry['level'][]` ensures that these values are consistent with the LogEntry interface.
 */
export const LOG_LEVELS: LogEntry['level'][] = ['ERROR', 'WARN', 'INFO', 'SUCCESS'];

/**
 * A predefined list of all SOVD-related modules that can generate logs.
 * This is used for creating filters and statistical charts.
 */
export const LOG_MODULES: LogEntry['module'][] = [
  'VEHICLE_OWNER',
  'DIAGNOSIS_PLATFORM',
  'SOVD_CLIENT',
  'HMI',
  'AUTH_SERVER',
  'CDA',
  'PRIVATE_SERVER',
  'SOVD_GATEWAY',
];

/**
 * Backend URL for API requests
 */
export const BACKEND_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  : 'http://localhost:3000';