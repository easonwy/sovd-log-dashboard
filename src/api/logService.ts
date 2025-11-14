import { LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';
import { LogFilters, LogEntry } from '@/types';
import { generateDemoLogs } from './mockData';

export interface HistoryResponse {
  logs: LogEntry[];
  total: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: string;
  } | null;
}

// Get backend URL from environment or default to current host
const BACKEND_URL = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_BACKEND_URL || `${window.location.origin}`
  : process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Unified mock mode flag (client-side)
const FORCE_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

const getMockHistory = (offset: number, limit: number): HistoryResponse => {
  console.warn('Serving MOCK data for historical logs.');
  const allMockLogs = generateDemoLogs();
  const paginatedLogs = allMockLogs.slice(offset, offset + limit);
  return {
    logs: paginatedLogs,
    total: allMockLogs.length,
  };
};

export const fetchHistoricalLogs = async (
  offset: number,
  limit: number,
  filters: LogFilters
): Promise<HistoryResponse> => {
  if (FORCE_MOCK) {
    return getMockHistory(offset, limit);
  }

  const queryParams = new URLSearchParams();

  // Build query parameters properly
  const activeLevels = LOG_LEVELS.filter((l) => filters.levels[l]).join(',');
  if (activeLevels) queryParams.append('levels', activeLevels);

  const activeModules = LOG_MODULES.filter((m) => filters.modules[m]).join(',');
  if (activeModules) queryParams.append('modules', activeModules);

  if (filters.searchText) queryParams.append('search', filters.searchText);

  // Add time range parameters if specified
  if (filters.startTime) queryParams.append('startTime', filters.startTime);
  if (filters.endTime) queryParams.append('endTime', filters.endTime);

  queryParams.append('offset', offset.toString());
  queryParams.append('limit', limit.toString());

  const url = `${BACKEND_URL}/api/v1/logs?${queryParams.toString()}`;
  console.log('[API] Fetching logs from:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const apiData: ApiResponse<HistoryResponse> = await response.json();
    console.log('[API] Response received:', apiData);

    if (!apiData.success) {
      throw new Error(apiData.error?.message || 'API returned error');
    }

    const result = {
      logs: apiData.data?.logs || [],
      total: apiData.data?.total || 0,
    };
    console.log('[API] Returning:', { logsCount: result.logs.length, total: result.total });
    return result;
  } catch (error) {
    console.error('Real API fetch failed, falling back to mock data.', error);
    return getMockHistory(offset, limit);
  }
};