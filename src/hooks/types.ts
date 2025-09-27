// Types for stock market data hooks

export interface StockSymbol {
  symbol: string;
  name: string;
  sector?: string;
}

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  days: number; // Number of trading days in range
}

export interface RawStockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CondensedDataPoint {
  timestamp: number; // Game timestamp (0-300 for 60 seconds @ 5fps)
  price: number;
  volume?: number;
}

export interface StockDataState {
  symbol: StockSymbol | null;
  dateRange: DateRange | null;
  rawPrices: RawStockPrice[];
  condensedData: CondensedDataPoint[];
  isLoading: boolean;
  error: string | null;
}

export interface UseTopStocksResult {
  stocks: StockSymbol[];
  getRandomStock: () => StockSymbol | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseDateRangeResult {
  dateRange: DateRange | null;
  generateRandomRange: () => DateRange;
  isLoading: boolean;
}

export interface UseStockPriceDataResult {
  rawPrices: RawStockPrice[];
  fetchPriceData: (
    symbol: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseCondensedPriceDataResult {
  condensedData: CondensedDataPoint[];
  condenseData: (rawPrices: RawStockPrice[]) => CondensedDataPoint[];
  isLoading: boolean;
}

// API Configuration
export interface AlphaVantageConfig {
  apiKey: string;
  baseUrl: string;
  requestsPerMinute: number;
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOP_STOCKS: "tradle_top_stocks",
  CURRENT_STOCK: "tradle_current_stock",
  DATE_RANGE: "tradle_date_range",
  RAW_PRICES: "tradle_raw_prices",
  CONDENSED_DATA: "tradle_condensed_data",
  DAILY_SEED: "tradle_daily_seed",
} as const;
