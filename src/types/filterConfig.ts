export interface FilterConfig {
  symbol?: string;
  option?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;  
  maxQuantity?: number;  
  timeRange?: 'all' | '1h' | '4h' | '24h';
  optionType?: 'all' | 'call' | 'put';
  strikeRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
    preset?: 'all' | '1h' | '4h' | '24h' | '7d' | '30d' | 'custom';
  };
}