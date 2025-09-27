import { useState, useCallback } from "react";
import type { RawStockPrice, UseStockPriceDataResult } from "./types";
import { STORAGE_KEYS } from "./types";

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = "9RRJYXF3O5UPN70O";
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

// Rate limiting
const RATE_LIMIT_DELAY = 12000; // 12 seconds between requests (5 requests per minute)

interface AlphaVantageResponse {
  "Meta Data": {
    "1. Information": string;
    "2. Symbol": string;
    "3. Last Refreshed": string;
    "4. Output Size": string;
    "5. Time Zone": string;
  };
  "Time Series (Daily)": {
    [date: string]: {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    };
  };
}

export const useStockPriceData = (): UseStockPriceDataResult => {
  const [rawPrices, setRawPrices] = useState<RawStockPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceData = useCallback(
    async (
      symbol: string,
      startDate: string,
      endDate: string
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `${symbol}_${startDate}_${endDate}`;
        const cached = localStorage.getItem(
          `${STORAGE_KEYS.RAW_PRICES}_${cacheKey}`
        );

        if (cached) {
          const cachedData = JSON.parse(cached);
          const now = Date.now();

          // Cache valid for 1 day
          if (
            cachedData.timestamp &&
            now - cachedData.timestamp < 24 * 60 * 60 * 1000
          ) {
            setRawPrices(cachedData.prices);
            setIsLoading(false);
            return;
          }
        }

        // Check rate limiting
        const lastRequest = localStorage.getItem("last_api_request");
        if (lastRequest) {
          const timeSinceLastRequest = Date.now() - parseInt(lastRequest);
          if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
            // Use fallback data if we're rate limited
            const fallbackData = generateFallbackData(
              symbol,
              startDate,
              endDate
            );
            setRawPrices(fallbackData);
            setError("Using simulated data due to API rate limiting");
            setIsLoading(false);
            return;
          }
        }

        // Make API request
        const url = new URL(ALPHA_VANTAGE_BASE_URL);
        url.searchParams.set("function", "TIME_SERIES_DAILY");
        url.searchParams.set("symbol", symbol);
        url.searchParams.set("apikey", ALPHA_VANTAGE_API_KEY);
        url.searchParams.set("outputsize", "full"); // Get full history

        localStorage.setItem("last_api_request", Date.now().toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AlphaVantageResponse = await response.json();

        // Check for API errors
        if (!data["Time Series (Daily)"]) {
          throw new Error("Invalid API response or symbol not found");
        }

        // Parse and filter data by date range
        const timeSeries = data["Time Series (Daily)"];
        const prices: RawStockPrice[] = [];

        const startDateTime = new Date(startDate).getTime();
        const endDateTime = new Date(endDate).getTime();

        Object.entries(timeSeries).forEach(([date, values]) => {
          const dateTime = new Date(date).getTime();

          if (dateTime >= startDateTime && dateTime <= endDateTime) {
            prices.push({
              date,
              open: parseFloat(values["1. open"]),
              high: parseFloat(values["2. high"]),
              low: parseFloat(values["3. low"]),
              close: parseFloat(values["4. close"]),
              volume: parseInt(values["5. volume"]),
            });
          }
        });

        // Sort by date (oldest first)
        prices.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Validate we have sufficient data
        if (prices.length < 50) {
          throw new Error("Insufficient price data received");
        }

        // Cache the result
        const cacheData = {
          prices,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          `${STORAGE_KEYS.RAW_PRICES}_${cacheKey}`,
          JSON.stringify(cacheData)
        );

        setRawPrices(prices);
      } catch (err) {
        console.error("Error fetching price data:", err);

        // Use fallback data on error
        const fallbackData = generateFallbackData(symbol, startDate, endDate);
        setRawPrices(fallbackData);
        setError(`API Error: Using simulated data for ${symbol}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    rawPrices,
    fetchPriceData,
    isLoading,
    error,
  };
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

// Utility function to clear price data cache
export const clearPriceDataCache = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_KEYS.RAW_PRICES)) {
      localStorage.removeItem(key);
    }
  });
};
