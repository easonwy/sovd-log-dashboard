import { LogEntry } from '@/types';
import { generateMockLogs, calculateMockStats } from './mockService';
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
  private useMockDb: boolean;

  constructor(useMockDb: boolean = false) {
    this.useMockDb = useMockDb || process.env.MOCK_MODE === 'true';
  }

  /**
   * Fetch historical logs with filtering and pagination
   */
  async getHistoricalLogs(params: GetLogsParams): Promise<GetLogsResponse> {
    try {
      // First check if database is available and not forced to mock
      if (!this.useMockDb && (await isConnected())) {
        return this.getDatabaseHistoricalLogs(params);
      }

      // Fallback to mock data
      return this.getMockHistoricalLogs(params);
    } catch (error) {
      console.error('Error fetching historical logs:', error);
      // Fallback to mock data on any error
      return this.getMockHistoricalLogs(params);
    }
  }

  /**
   * Get aggregated statistics
   */
  async getStatistics(params: GetStatsParams): Promise<GetStatsResponse> {
    try {
      // First check if database is available and not forced to mock
      if (!this.useMockDb && (await isConnected())) {
        return this.getDatabaseStatistics(params);
      }

      // Fallback to mock data
      return this.getMockStatistics(params);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback to mock data on any error
      return this.getMockStatistics(params);
    }
  }

  /**
   * Get distinct modules from logs
   */
  async getDistinctModules(): Promise<string[]> {
    try {
      // First check if database is available and not forced to mock
      if (!this.useMockDb && (await isConnected())) {
        return this.getDatabaseDistinctModules();
      }

      // Fallback to mock data
      return this.getMockDistinctModules();
    } catch (error) {
      console.error('Error fetching distinct modules:', error);
      // Fallback to mock data on any error
      return this.getMockDistinctModules();
    }
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
   * Fetch distinct modules from real database
   */
  private async getDatabaseDistinctModules(): Promise<string[]> {
    const query = getDistinctModulesQuery();
    const results = await executeQuery<{ module: string }>(
      query.query,
      query.params
    );
    return (results || []).map(row => row.module);
  }

  /**
   * Get mock historical logs
   */
  private getMockHistoricalLogs(params: GetLogsParams): GetLogsResponse {
    const allLogs = generateMockLogs(5000);

    // Apply filters
    let filtered = allLogs;

    // Filter by levels
    if (params.levels.length > 0) {
      filtered = filtered.filter(log => params.levels.includes(log.level));
    }

    // Filter by modules
    if (params.modules.length > 0) {
      filtered = filtered.filter(log => params.modules.includes(log.module));
    }

    // Filter by search text
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(searchLower) ||
          log.eventId.toLowerCase().includes(searchLower)
      );
    }

    // Filter by time range
    if (params.startTime) {
      const startDate = new Date(params.startTime);
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }
    if (params.endTime) {
      const endDate = new Date(params.endTime);
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    // Paginate
    const total = filtered.length;
    const paginatedLogs = filtered.slice(
      params.offset,
      params.offset + params.limit
    );

    return {
      logs: paginatedLogs,
      total,
      offset: params.offset,
      limit: params.limit,
    };
  }

  /**
   * Get mock distinct modules
   */
  private getMockDistinctModules(): string[] {
    const allLogs = generateMockLogs(5000);
    const modules = new Set<string>();
    allLogs.forEach(log => {
      if (log.module) {
        modules.add(log.module);
      }
    });
    return Array.from(modules).sort();
  }

  /**
   * Get mock statistics
   */
  private getMockStatistics(params: GetStatsParams): GetStatsResponse {
    const allLogs = generateMockLogs(5000);

    // Filter by time range if provided
    let filtered = allLogs;
    if (params.startTime) {
      const startDate = new Date(params.startTime);
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }
    if (params.endTime) {
      const endDate = new Date(params.endTime);
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    return calculateMockStats(filtered);
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
