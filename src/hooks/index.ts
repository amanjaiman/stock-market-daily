// Export all hooks for easy importing
export { useTopStocks, useDailyStock } from "./useTopStocks";
export { useDateRange, useDailyDateRange } from "./useDateRange";
export { useStockPriceData, clearPriceDataCache } from "./useStockPriceData";
export {
  useCondensedPriceData,
  addMarketRealism,
  clearCondensedDataCache,
} from "./useCondensedPriceData";
export { 
  useDailyChallenge, 
  useChallengeByDay,
  type DailyChallenge 
} from "./useDailyChallenge";

// Export types
export type {
  StockSymbol,
  DateRange,
  RawStockPrice,
  CondensedDataPoint,
  StockDataState,
  UseTopStocksResult,
  UseDateRangeResult,
  UseStockPriceDataResult,
  UseCondensedPriceDataResult,
  TiingoConfig,
} from "./types";

export { STORAGE_KEYS } from "./types";
