export type Language = 'zh' | 'en' | 'ja';
export type TFunction = (key: string) => string;

export interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'SUCCESS' | string;
  message: string;
  traceId: string;
  details: object | null;
}

export interface LogFilters {
  levels: Record<string, boolean>;
  modules: Record<string, boolean>;
  searchText: string;
}

export interface DistributionItem {
  key: string;
  count: number;
  percentage: number;
  colorClass: string;
}

export interface CalculatedStats {
  totalCount: number;
  levelDistribution: DistributionItem[];
  moduleDistribution: DistributionItem[];
}

export interface TimeBin {
  timestamp: number;
  count: number;
  formattedTime?: string;
}