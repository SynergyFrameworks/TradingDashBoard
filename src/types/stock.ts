export interface Stock {
    id: number;
    symbol: string;
    companyName: string;
    currentPrice: number;
    beta: number;
    marketCap: number;
    volume: number;
    dailyHigh: number;
    dailyLow: number;
    yearlyHigh: number;
    yearlyLow: number;
    pe_Ratio: number;
    dividend_Yield: number;
  }
  