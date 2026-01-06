import { LogFilters, LogEntry } from '@/types';

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

export const fetchHistoricalLogs = async (
  offset: number,
  limit: number,
  filters: LogFilters
): Promise<HistoryResponse> => {
  const queryParams = new URLSearchParams();

  // Build query parameters for active filters
  const activeLevels = Object.entries(filters.levels)
    .filter(([, isActive]) => isActive)
    .map(([level]) => level)
    .join(',');
  if (activeLevels) queryParams.append('levels', activeLevels);

  const activeModules = Object.entries(filters.modules)
    .filter(([, isActive]) => isActive)
    .map(([module]) => module)
    .join(',');
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
    console.error('Failed to fetch historical logs:', error);
    throw error;
  }
};