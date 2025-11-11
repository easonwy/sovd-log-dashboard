import { BACKEND_URL, LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';
import { LogFilters, LogEntry } from '@/types';

/**
 * Defines the expected response structure from the history API endpoint.
 */
export interface HistoryResponse {
  logs: LogEntry[];
  total: number;
}

/**
 * Fetches a paginated and filtered list of historical logs from the backend.
 * Includes exponential backoff for retries on failure.
 *
 * @param offset - The number of logs to skip (for pagination).
 * @param limit - The maximum number of logs to return.
 * @param filters - An object containing filters for levels, modules, and search text.
 * @returns A promise that resolves to an object containing the logs and total count.
 * @throws An error if the fetch operation fails after all retries.
 */
export const fetchHistoricalLogs = async (
  offset: number,
  limit: number,
  filters: LogFilters
): Promise<HistoryResponse> => {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  // Append active level filters
  const activeLevels = LOG_LEVELS.filter(l => filters.levels[l]).join(',');
  if (activeLevels) {
    queryParams.append('levels', activeLevels);
  }

  // Append active module filters
  const activeModules = LOG_MODULES.filter(m => filters.modules[m]).join(',');
  if (activeModules) {
    queryParams.append('modules', activeModules);
  }

  // Append search text filter
  if (filters.searchText) {
    queryParams.append('search', filters.searchText);
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/logs?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      
      const data: HistoryResponse = await response.json();
      return {
        logs: data.logs || [],
        total: data.total || data.logs.length,
      }; // Success, exit the loop and return data
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries fail, throw the last captured error
  throw new Error(`Failed to fetch historical logs after ${maxRetries} attempts. Last error: ${lastError?.message}`);
};