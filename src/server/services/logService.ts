import { LogEntry } from '@/types';
import { executeQuery, executeQueryOne, isConnected } from '@/server/db/client';
import {
  rowToLogEntry,
  type LogRow,
  getLogsQuery,
  getCountQuery,
  getLevelDistributionQuery,
  getModuleDistributionQuery,
  getTimeSeriesQuery,
  getTotalCountQuery,
  getDistinctLevelsQuery,
  getDistinctModulesQuery,
} from '@/server/db/queries';

interface GetLogsParams {
  offset: number;
  limit: number;
  levels: string[];
  modules: string[];
  search: string;
  startTime: string | null;
  endTime: string | null;
}

interface GetLogsResponse {
  logs: LogEntry[];
  total: number;
  offset: number;
  limit: number;
}

interface GetStatsParams {
  startTime: string | null;
  endTime: string | null;
  interval: string;
}

interface GetStatsResponse {
  totalLogs: number;
  levelDistribution: Record<string, { count: number; percentage: number }>;
  moduleDistribution: Record<string, { count: number; percentage: number }>;
  timeSeries: Array<{ timestamp: string; count: number }>;
}

/**
 * LogService handles all log-related operations.
 * It abstracts away whether we're using a database or mock data.
 */
class LogService {
  /**
   * LogService handles all log-related operations.
   * It requires a database connection; mock data has been removed.
   */
  constructor() {
    // Database connection is required
  }

  /**
   * Fetch historical logs with filtering and pagination
   */
  async getHistoricalLogs(params: GetLogsParams): Promise<GetLogsResponse> {
    if (!await isConnected()) {
      throw new Error('Database connection not available. Mock data has been removed.');
    }
    return this.getDatabaseHistoricalLogs(params);
  }

  /**
   * Get aggregated statistics
   */
  async getStatistics(params: GetStatsParams): Promise<GetStatsResponse> {
    if (!await isConnected()) {
      throw new Error('Database connection not available. Mock data has been removed.');
    }
    return this.getDatabaseStatistics(params);
  }

  /**
   * Fetch from real database
   */
  private async getDatabaseHistoricalLogs(
    params: GetLogsParams
  ): Promise<GetLogsResponse> {
    const logsQueryData = getLogsQuery(
      params.levels,
      params.modules,
      params.search,
      params.startTime,
      params.endTime,
      params.offset,
      params.limit
    );

    const countQueryData = getCountQuery(
      params.levels,
      params.modules,
      params.search,
      params.startTime,
      params.endTime
    );

    const [logs, totalResults] = await Promise.all([
      executeQuery<LogRow>(logsQueryData.query, logsQueryData.params),
      executeQueryOne<{ count: number }>(
        countQueryData.query,
        countQueryData.params
      ),
    ]);

    return {
      logs: logs.map(rowToLogEntry),
      total: totalResults?.count || 0,
      offset: params.offset,
      limit: params.limit,
    };
  }

  /**
   * Fetch statistics from real database
   */
  private async getDatabaseStatistics(
    params: GetStatsParams
  ): Promise<GetStatsResponse> {
    const totalCountQuery = getTotalCountQuery();
    const levelDistQuery = getLevelDistributionQuery(
      params.startTime,
      params.endTime
    );
    const moduleDistQuery = getModuleDistributionQuery(
      params.startTime,
      params.endTime
    );
    const timeSeriesQuery = getTimeSeriesQuery(
      params.interval,
      params.startTime,
      params.endTime
    );

    const [totalResult, levelDistResults, moduleDistResults, timeSeriesResults] =
      await Promise.all([
        executeQueryOne<{ count: number }>(
          totalCountQuery.query,
          totalCountQuery.params
        ),
        executeQuery<{ level: string; count: number }>(levelDistQuery.query, levelDistQuery.params),
        executeQuery<{ module: string; count: number }>(moduleDistQuery.query, moduleDistQuery.params),
        executeQuery<{ timestamp: string; count: number }>(timeSeriesQuery.query, timeSeriesQuery.params),
      ]);

    const totalLogs = totalResult?.count || 0;

    // Convert level distribution results
    const levelDistribution: Record<
      string,
      { count: number; percentage: number }
    > = {};
    (levelDistResults || []).forEach((row) => {
      levelDistribution[row.level] = {
        count: row.count,
        percentage: totalLogs > 0 ? (row.count / totalLogs) * 100 : 0,
      };
    });

    // Convert module distribution results
    const moduleDistribution: Record<
      string,
      { count: number; percentage: number }
    > = {};
    (moduleDistResults || []).forEach((row) => {
      moduleDistribution[row.module] = {
        count: row.count,
        percentage: totalLogs > 0 ? (row.count / totalLogs) * 100 : 0,
      };
    });

    // Convert time series results
    const timeSeries = (timeSeriesResults || []).map((row) => ({
      timestamp: row.timestamp,
      count: row.count,
    }));

    return {
      totalLogs,
      levelDistribution,
      moduleDistribution,
      timeSeries,
    };
  }

  /**
   * Get distinct modules from database
   */
  async getDistinctModules(): Promise<string[]> {
    if (!isConnected()) {
      console.error('[LogService] Database is not connected');
      throw new Error('Database connection not available. Mock data has been removed.');
    }

    const query = getDistinctModulesQuery();
    const results = await executeQuery<{ module: string }>(
      query.query,
      query.params
    );
    return (results || []).map(row => row.module);
  }

  /**
   * Get distinct log levels from database
   */
  async getDistinctLevels(): Promise<string[]> {
    if (!isConnected()) {
      console.error('[LogService] Database is not connected');
      throw new Error('Database connection not available. Mock data has been removed.');
    }

    const query = getDistinctLevelsQuery();
    const results = await executeQuery<{ level: string }>(
      query.query,
      query.params
    );
    return (results || []).map(row => row.level);
  }
}

// Singleton instance
let logServiceInstance: LogService | null = null;

/**
 * Get or create the LogService singleton
 */
export function getLogService(): LogService {
  if (!logServiceInstance) {
    logServiceInstance = new LogService();
  }
  return logServiceInstance;
}

export type { GetLogsParams, GetLogsResponse, GetStatsParams, GetStatsResponse };
