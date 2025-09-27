import type { DateRange } from "../hooks";

// Generate random date range between 2012 and 2025, 1-5 years duration
export const generateRandomDateRange = (seed?: number): DateRange => {
  // Use seed for daily consistency or random for testing
  let seedValue = seed || Math.random() * 10000;
  const random = () => {
    if (seed) {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    }
    return Math.random();
  };

  // Random start year between 2012 and 2020 (to ensure we can go 5 years forward)
  const startYear = 2012 + Math.floor(random() * 9); // 2012-2020

  // Random start month and day
  const startMonth = Math.floor(random() * 12) + 1; // 1-12
  const startDay = Math.floor(random() * 28) + 1; // 1-28 to avoid month boundary issues

  // Random duration between 1-5 years
  const durationYears = 1 + Math.floor(random() * 5); // 1-5 years

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(startYear + durationYears, startMonth - 1, startDay);

  // Ensure we don't go past 2025
  const maxEndDate = new Date(2025, 11, 31);
  if (endDate > maxEndDate) {
    endDate.setTime(maxEndDate.getTime());
  }

  // Calculate trading days (rough estimate: ~252 trading days per year)
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const tradingDays = Math.floor(daysDiff * (252 / 365)); // Approximate trading days

  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
    days: tradingDays,
  };
};

// Format date for API calls (YYYY-MM-DD)
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Parse API date string back to Date object
export const parseAPIDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Simple seeded random number generator
export const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Get number of trading days between two dates
export const getTradingDaysBetween = (
  startDate: string,
  endDate: string
): number => {
  const start = parseAPIDate(startDate);
  const end = parseAPIDate(endDate);

  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // Approximate: Remove weekends and holidays (~70% of days are trading days)
  return Math.floor(daysDiff * 0.7);
};

// Check if date range has sufficient trading days (minimum 250 days for good data)
export const isValidDateRange = (dateRange: DateRange): boolean => {
  return dateRange.days >= 250;
};

// Generate seed based on current date for daily consistency
export const getDailySeed = (): number => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  return year * 10000 + month * 100 + day;
};
