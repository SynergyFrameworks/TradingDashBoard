import { useState, useMemo } from 'react';
import{OptionTrade} from '../types/optionTrade'
import{SortConfig} from '../types/sortConfig'
import{FilterConfig} from '../types/filterConfig'

export function useSortFilter(trades: OptionTrade[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'Timestamp',
    direction: 'desc',
  });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    timeRange: 'all',
  });

  const filteredAndSortedTrades = useMemo(() => {
    let filtered = [...trades];

    // Apply filters
    if (filterConfig.symbol) {
      filtered = filtered.filter(trade => 
        trade.Symbol.toLowerCase().includes(filterConfig.symbol!.toLowerCase())
      );
    }

    if (filterConfig.option) {
      filtered = filtered.filter(trade => 
        trade.Option.toLowerCase().includes(filterConfig.option!.toLowerCase())
      );
    }

    if (filterConfig.minPrice) {
      filtered = filtered.filter(trade => trade.Price >= filterConfig.minPrice!);
    }

    if (filterConfig.maxPrice) {
      filtered = filtered.filter(trade => trade.Price <= filterConfig.maxPrice!);
    }

    if (filterConfig.minQuantity) {
      filtered = filtered.filter(trade => trade.Quantity >= filterConfig.minQuantity!);
    }

    if (filterConfig.maxQuantity) {
      filtered = filtered.filter(trade => trade.Quantity <= filterConfig.maxQuantity!);
    }

    if (filterConfig.timeRange && filterConfig.timeRange !== 'all') {
      const now = new Date();
      const hours = {
        '1h': 1,
        '4h': 4,
        '24h': 24,
      }[filterConfig.timeRange];
      
      filtered = filtered.filter(trade => {
        const tradeTime = new Date(trade.Timestamp);
        const hoursDiff = (now.getTime() - tradeTime.getTime()) / (1000 * 60 * 60);
        return hoursDiff <= hours;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [trades, sortConfig, filterConfig]);

  return {
    sortConfig,
    setSortConfig,
    filterConfig,
    setFilterConfig,
    filteredAndSortedTrades,
  };
}
