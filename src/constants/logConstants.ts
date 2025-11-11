import { LogEntry } from '@/types';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const MAX_LOG_COUNT = 5000;
export const PAGE_SIZE = 500;

export const LOG_LEVELS: LogEntry['level'][] = ['ERROR', 'WARN', 'INFO', 'SUCCESS'];

export const LOG_MODULES: LogEntry['module'][] = [
  'VEHICLE_OWNER', 'DIAGNOSIS_PLATFORM', 'SOVD_CLIENT', 'HMI',
  'AUTH_SERVER', 'CDA', 'PRIVATE_SERVER', 'SOVD_GATEWAY',
];