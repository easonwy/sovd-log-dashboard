import { LogFilters } from '@/types';

/**
 * Returns initial filter state with empty levels and modules.
 * Filters are now dynamically populated from the backend based on available data.
 */
export const getInitialFilters = (): LogFilters => ({
  levels: {},
  modules: {},
  searchText: '',
});