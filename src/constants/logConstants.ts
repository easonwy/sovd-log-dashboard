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
 * Backend URL for API requests
 */
export const BACKEND_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  : 'http://localhost:3000';