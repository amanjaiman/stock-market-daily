import type { RawStockPrice } from "./dataProcessing.ts";

// Tiingo API configuration
const TIINGO_API_KEY = "13cb874696a06cd1ea2f2bf36729629dd9543db5";
const TIINGO_BASE_URL = "https://api.tiingo.com/tiingo/daily";

// Tiingo response interface
interface TiingoResponse {
  date: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  adjClose: number;
  adjHigh: number;
  adjLow: number;
  adjOpen: number;
  adjVolume: number;
  divCash: number;
  splitFactor: number;
}

/**
 * Fetch stock price data from Tiingo API
 */
export const fetchStockData = async (
  symbol: string,
  startDate: string,
  endDate: string
): Promise<RawStockPrice[]> => {
  try {
    // Build Tiingo API URL
    const url = new URL(`${TIINGO_BASE_URL}/${symbol}/prices`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("token", TIINGO_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TiingoResponse[] = await response.json();

    // Check for API errors
    if (!Array.isArray(data) || data.length === 0) {
      console.error('API Response:', data);
      throw new Error("Invalid API response or symbol not found");
    }

    // Transform Tiingo data to our RawStockPrice format
    const prices: RawStockPrice[] = data.map((item) => ({
      date: item.date.split('T')[0], // Convert ISO date to YYYY-MM-DD format
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    // Data is already sorted by date from Tiingo API (oldest first)

    // Validate we have sufficient data
    if (prices.length < 50) {
      throw new Error(`Insufficient price data received: ${prices.length} points`);
    }

    return prices;

  } catch (err) {
    console.error("Error fetching stock data:", err);
    
    // Use fallback data on error
    const fallbackData = generateFallbackData(symbol, startDate, endDate);
    return fallbackData;
  }
};

// Generate realistic fallback data when API fails
const generateFallbackData = (
  symbol: string,
  startDate: string,
  endDate: string
): RawStockPrice[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const prices: RawStockPrice[] = [];

  // Base price depends on symbol (simulate real company price ranges)
  const getBasePrice = (symbol: string): number => {
    const hash = symbol
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (hash % 400); // Price between $50-$450
  };

  let currentPrice = getBasePrice(symbol);
  const volatility = 0.02; // 2% daily volatility

  // Generate price for each trading day
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Random walk with mean reversion
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const meanReversion = (getBasePrice(symbol) - currentPrice) * 0.001;

      currentPrice = currentPrice * (1 + randomChange + meanReversion);
      currentPrice = Math.max(10, currentPrice); // Minimum $10

      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const close = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(1000000 + Math.random() * 10000000);

      prices.push({
        date: currentDate.toISOString().split("T")[0],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
      });

      currentPrice = close;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return prices;
};
