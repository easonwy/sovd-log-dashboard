import { BACKEND_URL, LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';
import { LogFilters, LogEntry } from '@/types';
import { generateDemoLogs } from './mockData'; // Import from our new mock file

export interface HistoryResponse {
  logs: LogEntry[];
  total: number;
}

// A flag to force mock mode via .env.local file (VITE_FORCE_MOCK_API=true)
const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK_API === 'true';

const getMockHistory = (offset: number, limit: number): HistoryResponse => {
    console.warn("Serving MOCK data for historical logs.");
    const allMockLogs = generateDemoLogs();
    const paginatedLogs = allMockLogs.slice(offset, offset + limit);
    return {
        logs: paginatedLogs,
        total: allMockLogs.length,
    };
}

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
  const activeLevels = LOG_LEVELS.filter(l => filters.levels[l]).join(',');
  if (activeLevels) queryParams.append('levels', activeLevels);
  
  const activeModules = LOG_MODULES.filter(m => filters.modules[m]).join(',');
  if (activeModules) queryParams.append('modules', activeModules);
  
  if (filters.searchText) queryParams.append('search', filters.searchText);
  
  queryParams.append('offset', offset.toString());
  queryParams.append('limit', limit.toString());

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/logs?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data: HistoryResponse = await response.json();
    return {
      logs: data.logs || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error("Real API fetch failed, falling back to mock data.", error);
    return getMockHistory(offset, limit);
  }
};