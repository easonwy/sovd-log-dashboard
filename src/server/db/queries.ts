import { LogEntry } from '@/types';

/**
 * SQL Query Builders for Log Operations
 * 
 * This module provides reusable SQL query builders for common operations.
 * It helps keep queries organized and maintainable.
 */

export interface LogRow {
  id: string;
  timestamp: string;
  module: string;
  level: string;
  message: string;
  trace_id: string | null;
  details: string | null;
  create_time: string;
}

/**
 * Convert database row to LogEntry
 */
export function rowToLogEntry(row: LogRow): LogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    module: row.module as LogEntry['module'],
    level: row.level as LogEntry['level'],
    message: row.message,
    traceId: row.trace_id || '',
    details: row.details ? JSON.parse(row.details) : null,
  };
}

/**
 * Build WHERE clause for filtering logs
 */
export function buildWhereClause(
  levels: string[],
  modules: string[],
  search: string,
  startTime: string | null,
  endTime: string | null
): { clause: string; params: (string | number)[] } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  // Filter by levels
  if (levels.length > 0) {
    const placeholders = levels.map(() => '?').join(',');
    conditions.push(`level IN (${placeholders})`);
    params.push(...levels);
  }

  // Filter by modules
  if (modules.length > 0) {
    const placeholders = modules.map(() => '?').join(',');
    conditions.push(`module IN (${placeholders})`);
    params.push(...modules);
  }

  // Full-text search
  if (search) {
    conditions.push(`(message LIKE ? OR trace_id LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  // Time range
  if (startTime) {
    conditions.push(`timestamp >= ?`);
    params.push(startTime);
  }

  if (endTime) {
    conditions.push(`timestamp <= ?`);
    params.push(endTime);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

/**
 * Get count query
 */
export function getCountQuery(
  levels: string[],
  modules: string[],
  search: string,
  startTime: string | null,
  endTime: string | null
): { query: string; params: (string | number)[] } {
  const { clause, params } = buildWhereClause(levels, modules, search, startTime, endTime);
  
  const query = `SELECT COUNT(*) as total FROM infra_module_logs ${clause}`;
  
  return { query, params };
}

/**
 * Get paginated logs matching criteria
 */
/**
 * Get logs query with filters
 */
export function getLogsQuery(
  levels: string[],
  modules: string[],
  search: string,
  startTime: string | null,
  endTime: string | null,
  offset: number,
  limit: number
): { query: string; params: (string | number)[] } {
  const { clause, params } = buildWhereClause(levels, modules, search, startTime, endTime);
  
  // Sanitize limit and offset - ensure they're positive integers
  const safeLimit = Math.max(0, Math.floor(Number(limit) || 0));
  const safeOffset = Math.max(0, Math.floor(Number(offset) || 0));
  
  // Note: LIMIT and OFFSET are not parameterized in mysql2 prepared statements
  // They must be part of the query string itself
  const query = `
    SELECT id, timestamp, module, level, message, trace_id, details, create_time
    FROM infra_module_logs
    ${clause}
    ORDER BY timestamp DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `.trim();
  
  return {
    query,
    params,
  };
}

/**
 * Get logs grouped by level (for statistics)
 */
export function getLevelDistributionQuery(
  startTime: string | null,
  endTime: string | null
): { query: string; params: (string | number)[] } {
  const { clause, params } = buildWhereClause([], [], '', startTime, endTime);
  
  const query = `
    SELECT level, COUNT(*) as count
    FROM infra_module_logs
    ${clause}
    GROUP BY level
  `.trim();

  return {
    query,
    params,
  };
}

/**
 * Get logs grouped by module (for statistics)
 */
export function getModuleDistributionQuery(
  startTime: string | null,
  endTime: string | null
): { query: string; params: (string | number)[] } {
  const { clause, params } = buildWhereClause([], [], '', startTime, endTime);
  
  const query = `
    SELECT module, COUNT(*) as count
    FROM infra_module_logs
    ${clause}
    GROUP BY module
  `.trim();

  return {
    query,
    params,
  };
}

/**
 * Get logs grouped by time interval (for time series)
 */
export function getTimeSeriesQuery(
  interval: string,
  startTime: string | null,
  endTime: string | null
): { query: string; params: (string | number)[] } {
  // Convert interval string to MySQL DATE_FORMAT pattern
  let dateFormat: string;
  switch (interval) {
    case '5m':
      dateFormat = '%Y-%m-%d %H:%i:00'; // YYYY-MM-DD HH:MM:00
      break;
    case '15m':
      dateFormat = '%Y-%m-%d %H:%i:00'; // YYYY-MM-DD HH:MM:00
      break;
    case '1h':
      dateFormat = '%Y-%m-%d %H:00:00'; // YYYY-MM-DD HH:00:00
      break;
    case '1d':
    default:
      dateFormat = '%Y-%m-%d'; // YYYY-MM-DD
      break;
  }

  const { clause, params } = buildWhereClause([], [], '', startTime, endTime);
  
  const query = `
    SELECT DATE_FORMAT(timestamp, '${dateFormat}') as timestamp, COUNT(*) as count
    FROM infra_module_logs
    ${clause}
    GROUP BY DATE_FORMAT(timestamp, '${dateFormat}')
    ORDER BY timestamp ASC
  `.trim();

  return {
    query,
    params,
  };
}

/**
 * Insert a new log entry
 */
export function getInsertLogQuery(log: {
  id: string;
  timestamp: string;
  module: string;
  level: string;
  message: string;
  traceId: string;
  details: object | null;
}): { query: string; params: (string | number | null)[] } {
  const query = `
    INSERT INTO infra_module_logs (id, timestamp, module, level, message, trace_id, details, create_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `.trim();

  return {
    query,
    params: [
      log.id,
      log.timestamp,
      log.module,
      log.level,
      log.message,
      log.traceId,
      log.details ? JSON.stringify(log.details) : null,
    ],
  };
}

/**
 * Get total count of all logs
 */
export function getTotalCountQuery(): { query: string; params: (string | number)[] } {
  return {
    query: 'SELECT COUNT(*) as count FROM infra_module_logs',
    params: [],
  };
}
