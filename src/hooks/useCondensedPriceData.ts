import { useState, useCallback } from "react";
import type {
  RawStockPrice,
  CondensedDataPoint,
  UseCondensedPriceDataResult,
} from "./types";
import { STORAGE_KEYS } from "./types";

// Game configuration
const GAME_DURATION_SECONDS = 60;
const UPDATES_PER_SECOND = 5;
const TOTAL_DATA_POINTS = GAME_DURATION_SECONDS * UPDATES_PER_SECOND; // 300 points

export const useCondensedPriceData = (): UseCondensedPriceDataResult => {
  const [condensedData, setCondensedData] = useState<CondensedDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const condenseData = useCallback(
    (rawPrices: RawStockPrice[]): CondensedDataPoint[] => {
      if (rawPrices.length === 0) {
        return [];
      }

      setIsLoading(true);

      try {
        // Cache key for this specific data set
        const cacheKey = `condensed_${rawPrices.length}_${rawPrices[0]?.date}_${
          rawPrices[rawPrices.length - 1]?.date
        }`;
        const cached = localStorage.getItem(
          `${STORAGE_KEYS.CONDENSED_DATA}_${cacheKey}`
        );

        if (cached) {
          const cachedData = JSON.parse(cached);
          setCondensedData(cachedData);
          setIsLoading(false);
          return cachedData;
        }

        const condensed: CondensedDataPoint[] = [];

        if (rawPrices.length <= TOTAL_DATA_POINTS) {
          // If we have fewer data points than needed, use interpolation
          condensed.push(...interpolateData(rawPrices, TOTAL_DATA_POINTS));
        } else {
          // If we have more data points than needed, sample strategically
          condensed.push(...sampleData(rawPrices, TOTAL_DATA_POINTS));
        }

        // Ensure we have exactly the right number of points
        while (condensed.length < TOTAL_DATA_POINTS) {
          const lastPoint = condensed[condensed.length - 1];
          condensed.push({
            timestamp: condensed.length,
            price: lastPoint.price,
            volume: lastPoint.volume,
          });
        }

        // Trim to exact count if we somehow have too many
        const finalCondensed = condensed.slice(0, TOTAL_DATA_POINTS);

        // Cache the result
        localStorage.setItem(
          `${STORAGE_KEYS.CONDENSED_DATA}_${cacheKey}`,
          JSON.stringify(finalCondensed)
        );

        setCondensedData(finalCondensed);
        setIsLoading(false);
        return finalCondensed;
      } catch (error) {
        console.error("Error condensing data:", error);

        // Fallback: create simple interpolated data
        const fallbackData = createFallbackData(rawPrices);
        setCondensedData(fallbackData);
        setIsLoading(false);
        return fallbackData;
      }
    },
    []
  );

  return {
    condensedData,
    condenseData,
    isLoading,
  };
};

// Interpolate data when we have fewer points than needed
const interpolateData = (
  rawPrices: RawStockPrice[],
  targetPoints: number
): CondensedDataPoint[] => {
  const condensed: CondensedDataPoint[] = [];
  const sourceLength = rawPrices.length;

  for (let i = 0; i < targetPoints; i++) {
    const sourceIndex = (i * (sourceLength - 1)) / (targetPoints - 1);
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.ceil(sourceIndex);

    if (lowerIndex === upperIndex) {
      // Exact match
      const price = rawPrices[lowerIndex];
      condensed.push({
        timestamp: i,
        price: price.close,
        volume: price.volume,
      });
    } else {
      // Interpolate between two points
      const lowerPrice = rawPrices[lowerIndex];
      const upperPrice = rawPrices[upperIndex];
      const fraction = sourceIndex - lowerIndex;

      const interpolatedPrice =
        lowerPrice.close + (upperPrice.close - lowerPrice.close) * fraction;
      const interpolatedVolume = Math.round(
        lowerPrice.volume + (upperPrice.volume - lowerPrice.volume) * fraction
      );

      condensed.push({
        timestamp: i,
        price: Number(interpolatedPrice.toFixed(2)),
        volume: interpolatedVolume,
      });
    }
  }

  return condensed;
};

// Sample data when we have more points than needed
const sampleData = (
  rawPrices: RawStockPrice[],
  targetPoints: number
): CondensedDataPoint[] => {
  const condensed: CondensedDataPoint[] = [];
  const sourceLength = rawPrices.length;

  // Use a combination of strategies to preserve important price movements

  // 1. Always include first and last points
  condensed.push({
    timestamp: 0,
    price: rawPrices[0].close,
    volume: rawPrices[0].volume,
  });

  // 2. Sample the rest with strategic selection
  for (let i = 1; i < targetPoints - 1; i++) {
    const progress = i / (targetPoints - 1);
    const sourceIndex = Math.round(progress * (sourceLength - 1));

    // Add some randomness to avoid perfectly uniform sampling
    const jitter = Math.floor((Math.random() - 0.5) * 4);
    const adjustedIndex = Math.max(
      0,
      Math.min(sourceLength - 1, sourceIndex + jitter)
    );

    const price = rawPrices[adjustedIndex];
    condensed.push({
      timestamp: i,
      price: price.close,
      volume: price.volume,
    });
  }

  // 3. Always include the last point
  condensed.push({
    timestamp: targetPoints - 1,
    price: rawPrices[sourceLength - 1].close,
    volume: rawPrices[sourceLength - 1].volume,
  });

  return condensed;
};

// Create fallback data when condensing fails
const createFallbackData = (
  rawPrices: RawStockPrice[]
): CondensedDataPoint[] => {
  const condensed: CondensedDataPoint[] = [];

  if (rawPrices.length === 0) {
    // Create completely synthetic data
    let price = 100;
    for (let i = 0; i < TOTAL_DATA_POINTS; i++) {
      const change = (Math.random() - 0.5) * 2; // Random walk
      price = Math.max(50, price + change);

      condensed.push({
        timestamp: i,
        price: Number(price.toFixed(2)),
        volume: Math.floor(1000000 + Math.random() * 5000000),
      });
    }
  } else {
    // Use simple linear interpolation as fallback
    const startPrice = rawPrices[0].close;
    const endPrice = rawPrices[rawPrices.length - 1].close;
    const priceRange = endPrice - startPrice;

    for (let i = 0; i < TOTAL_DATA_POINTS; i++) {
      const progress = i / (TOTAL_DATA_POINTS - 1);
      const basePrice = startPrice + priceRange * progress;

      // Add some noise to make it interesting
      const noise = (Math.random() - 0.5) * (startPrice * 0.02);
      const finalPrice = Math.max(10, basePrice + noise);

      condensed.push({
        timestamp: i,
        price: Number(finalPrice.toFixed(2)),
        volume: Math.floor(1000000 + Math.random() * 5000000),
      });
    }
  }

  return condensed;
};

// Utility function to add realistic market movements to condensed data
export const addMarketRealism = (
  data: CondensedDataPoint[]
): CondensedDataPoint[] => {
  const enhanced = [...data];

  // Add trend persistence and volatility clustering
  let trendDirection = 1;
  let trendStrength = 1;

  for (let i = 1; i < enhanced.length; i++) {
    const prev = enhanced[i - 1];
    const current = enhanced[i];

    // Calculate natural change
    const naturalChange = current.price - prev.price;

    // Add trend persistence (70% chance to continue trend)
    if (Math.random() < 0.7) {
      trendDirection = naturalChange >= 0 ? 1 : -1;
    } else {
      trendDirection *= -1;
      trendStrength = Math.max(0.5, trendStrength - 0.2);
    }

    // Add volatility clustering (higher volatility after big moves)
    const recentVolatility = Math.abs(naturalChange) / prev.price;
    const volatilityMultiplier = 1 + recentVolatility * 2;

    // Apply enhancements
    const trendAdjustment = trendDirection * trendStrength * 0.5;
    const volatilityAdjustment = (Math.random() - 0.5) * volatilityMultiplier;

    const adjustedPrice =
      current.price + trendAdjustment + volatilityAdjustment;
    enhanced[i] = {
      ...current,
      price: Number(Math.max(10, adjustedPrice).toFixed(2)),
    };

    // Evolve trend strength
    trendStrength = Math.min(3, trendStrength + 0.1);
  }

  return enhanced;
};

// Utility function to clear condensed data cache
export const clearCondensedDataCache = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_KEYS.CONDENSED_DATA)) {
      localStorage.removeItem(key);
    }
  });
};
