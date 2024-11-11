
import{OptionTrade} from '../types/optionTrade'


export interface SortConfig {
    field: keyof OptionTrade;
    direction: 'asc' | 'desc';
  }