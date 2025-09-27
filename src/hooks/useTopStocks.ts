import { useState, useEffect, useCallback } from "react";
import type { StockSymbol, UseTopStocksResult } from "./types";
import { STORAGE_KEYS } from "./types";
import {
  TOP_STOCKS,
  getRandomStock,
  getRandomStockWithSeed,
  getDailySeed,
} from "../utils/stockData";

// Cache duration: 1 day (stocks list doesn't change often)
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useTopStocks = (): UseTopStocksResult => {
  const [stocks, setStocks] = useState<StockSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stocks from cache or use fallback list
  useEffect(() => {
    const loadStocks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to load from localStorage first
        const cachedData = localStorage.getItem(STORAGE_KEYS.TOP_STOCKS);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const now = Date.now();

          // Check if cache is still valid
          if (parsed.timestamp && now - parsed.timestamp < CACHE_DURATION) {
            setStocks(parsed.stocks);
            setIsLoading(false);
            return;
          }
        }

        // Use fallback stock list (our hardcoded TOP_STOCKS)
        setStocks(TOP_STOCKS);

        // Cache the stocks list
        const cacheData = {
          stocks: TOP_STOCKS,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          STORAGE_KEYS.TOP_STOCKS,
          JSON.stringify(cacheData)
        );

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading stocks:", err);
        setError("Failed to load stock list");

        // Fallback to hardcoded list even on error
        setStocks(TOP_STOCKS);
        setIsLoading(false);
      }
    };

    loadStocks();
  }, []);

  // Get a random stock from the list
  const getRandomStockCallback = useCallback((): StockSymbol | null => {
    if (stocks.length === 0) {
      return null;
    }

    const randomStock = getRandomStock();

    // Save the selected stock to localStorage for persistence
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_STOCK,
      JSON.stringify(randomStock)
    );

    return randomStock;
  }, [stocks.length]);

  return {
    stocks,
    getRandomStock: getRandomStockCallback,
    isLoading,
    error,
  };
};

// Hook for getting today's daily stock (deterministic based on date)
export const useDailyStock = (): {
  dailyStock: StockSymbol | null;
  refreshDailyStock: () => StockSymbol | null;
} => {
  const [dailyStock, setDailyStock] = useState<StockSymbol | null>(null);

  // Load or generate today's stock
  useEffect(() => {
    const loadDailyStock = () => {
      const today = new Date().toDateString();
      const cachedDaily = localStorage.getItem(STORAGE_KEYS.DAILY_SEED);

      if (cachedDaily) {
        const parsed = JSON.parse(cachedDaily);

        // Check if it's the same day
        if (parsed.date === today) {
          setDailyStock(parsed.stock);
          return;
        }
      }

      // Generate new daily stock
      const seed = getDailySeed();
      const stock = getRandomStockWithSeed(seed);

      // Cache it
      const dailyData = {
        date: today,
        stock,
        seed,
      };
      localStorage.setItem(STORAGE_KEYS.DAILY_SEED, JSON.stringify(dailyData));

      setDailyStock(stock);
    };

    loadDailyStock();
  }, []);

  const refreshDailyStock = useCallback((): StockSymbol | null => {
    const seed = getDailySeed();
    const stock = getRandomStockWithSeed(seed);

    const today = new Date().toDateString();
    const dailyData = {
      date: today,
      stock,
      seed,
    };
    localStorage.setItem(STORAGE_KEYS.DAILY_SEED, JSON.stringify(dailyData));

    setDailyStock(stock);
    return stock;
  }, []);

  return {
    dailyStock,
    refreshDailyStock,
  };
};
