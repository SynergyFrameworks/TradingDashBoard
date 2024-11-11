
import{GreekStats} from '../types/GeekStates'

export interface TradeStatistics {
    totalVolume: number;
    averagePrice: number;
    totalValue: number;
    ivSpread: number;
    weightedGreeks: GreekStats;
  }