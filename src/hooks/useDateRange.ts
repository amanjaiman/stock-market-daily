import { useState, useEffect, useCallback } from "react";
import type { DateRange, UseDateRangeResult } from "./types";
import { STORAGE_KEYS } from "./types";
import {
  generateRandomDateRange,
  getDailySeed,
  isValidDateRange,
} from "../utils/dateUtils";

export const useDateRange = (): UseDateRangeResult => {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing date range from localStorage on mount
  useEffect(() => {
    const loadDateRange = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.DATE_RANGE);
        if (cached) {
          const parsed = JSON.parse(cached);

          // Validate the cached range
          if (isValidDateRange(parsed)) {
            setDateRange(parsed);
          }
        }
      } catch (err) {
        console.error("Error loading cached date range:", err);
      }
    };

    loadDateRange();
  }, []);

  // Generate a new random date range
  const generateRandomRange = useCallback((): DateRange => {
    setIsLoading(true);

    let newRange: DateRange;
    let attempts = 0;
    const maxAttempts = 10;

    // Keep generating until we get a valid range or hit max attempts
    do {
      newRange = generateRandomDateRange();
      attempts++;
    } while (!isValidDateRange(newRange) && attempts < maxAttempts);

    // If we still don't have a valid range, create a fallback
    if (!isValidDateRange(newRange)) {
      // Fallback: 2-year range ending in 2023
      const endDate = new Date(2023, 11, 31); // Dec 31, 2023
      const startDate = new Date(2021, 11, 31); // Dec 31, 2021

      newRange = {
        startDate: `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
        endDate: `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
        days: 504, // Approximately 2 years of trading days
      };
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.DATE_RANGE, JSON.stringify(newRange));

    setDateRange(newRange);
    setIsLoading(false);

    return newRange;
  }, []);

  return {
    dateRange,
    generateRandomRange,
    isLoading,
  };
};

// Hook for getting today's daily date range (deterministic based on date)
export const useDailyDateRange = (): {
  dailyDateRange: DateRange | null;
  refreshDailyDateRange: () => DateRange | null;
} => {
  const [dailyDateRange, setDailyDateRange] = useState<DateRange | null>(null);

  // Load or generate today's date range
  useEffect(() => {
    const loadDailyDateRange = () => {
      const today = new Date().toDateString();
      const cachedDaily = localStorage.getItem(STORAGE_KEYS.DAILY_SEED);

      if (cachedDaily) {
        const parsed = JSON.parse(cachedDaily);

        // Check if it's the same day and if we have a date range
        if (parsed.date === today && parsed.dateRange) {
          setDailyDateRange(parsed.dateRange);
          return;
        }
      }

      // Generate new daily date range
      const seed = getDailySeed();
      let dateRange: DateRange;
      let attempts = 0;
      const maxAttempts = 10;

      // Keep generating until we get a valid range
      do {
        dateRange = generateRandomDateRange(seed + attempts);
        attempts++;
      } while (!isValidDateRange(dateRange) && attempts < maxAttempts);

      // Fallback if no valid range found
      if (!isValidDateRange(dateRange)) {
        const endDate = new Date(2023, 5, 30); // June 30, 2023
        const startDate = new Date(2021, 5, 30); // June 30, 2021

        dateRange = {
          startDate: `${startDate.getFullYear()}-${String(
            startDate.getMonth() + 1
          ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
          endDate: `${endDate.getFullYear()}-${String(
            endDate.getMonth() + 1
          ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
          days: 504,
        };
      }

      // Cache it with the daily data
      const existingDaily = cachedDaily ? JSON.parse(cachedDaily) : {};
      const dailyData = {
        ...existingDaily,
        date: today,
        dateRange,
      };
      localStorage.setItem(STORAGE_KEYS.DAILY_SEED, JSON.stringify(dailyData));

      setDailyDateRange(dateRange);
    };

    loadDailyDateRange();
  }, []);

  const refreshDailyDateRange = useCallback((): DateRange | null => {
    const seed = getDailySeed();
    let dateRange: DateRange;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      dateRange = generateRandomDateRange(seed + attempts);
      attempts++;
    } while (!isValidDateRange(dateRange) && attempts < maxAttempts);

    if (!isValidDateRange(dateRange)) {
      const endDate = new Date(2023, 5, 30);
      const startDate = new Date(2021, 5, 30);

      dateRange = {
        startDate: `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
        endDate: `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
        days: 504,
      };
    }

    const today = new Date().toDateString();
    const cachedDaily = localStorage.getItem(STORAGE_KEYS.DAILY_SEED);
    const existingDaily = cachedDaily ? JSON.parse(cachedDaily) : {};

    const dailyData = {
      ...existingDaily,
      date: today,
      dateRange,
    };
    localStorage.setItem(STORAGE_KEYS.DAILY_SEED, JSON.stringify(dailyData));

    setDailyDateRange(dateRange);
    return dateRange;
  }, []);

  return {
    dailyDateRange,
    refreshDailyDateRange,
  };
};
