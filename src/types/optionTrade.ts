import{Stock} from '../types/stock'
export interface OptionTrade {
  Id: string;
  Timestamp: string;
  StockId: number;
  Symbol: string;
  Option: string;
  Price: number;
  Quantity: number;
  Type: string;
  Strike: number;
  Expiration: string;
  IV: number;
  Delta: number;
  Gamma: number;
  Theta: number;
  Vega: number;
  Rho: number;
  Stock?: Stock; // Optional Stock type, not string
}