import type { CondensedDataPoint } from "../hooks";

export interface GameParameters {
  startingCash: number;
  startingShares: number; // Will be 0 for 100% cash start
  targetValue: number;
  initialStockPrice: number;
  targetReturnPercentage: number;
}

export interface ParPerformance {
  parAverageBuyPrice: number;
  parTotalSharesBought: number;
  parFinalValue: number;
  parCashRemaining: number;
  strategy: "balanced";
  efficiency: number; // 0-1 score representing how well they used trading opportunities
}

/**
 * Calculate dynamic game parameters based on stock price data
 * Goal: Make the game feel consistent regardless of stock price level
 */
export const calculateGameParameters = (
  condensedData: CondensedDataPoint[]
): GameParameters => {
  if (condensedData.length === 0) {
    // Fallback to reasonable defaults
    return {
      startingCash: 5000,
      startingShares: 0,
      targetValue: 6000, // 20% above starting cash
      initialStockPrice: 100,
      targetReturnPercentage: 20,
    };
  }

  const initialPrice = condensedData[0].price;

  // Calculate starting cash to allow for meaningful trading
  // Aim for ability to buy ~20 shares initially (good round number for trading)
  const targetInitialShares = 20;
  const startingCash =
    Math.round((initialPrice * targetInitialShares) / 100) * 100; // Round to nearest $100

  // Create temporary game parameters to calculate par performance
  const tempGameParams: GameParameters = {
    startingCash,
    startingShares: 0,
    targetValue: 0, // Will be calculated below
    initialStockPrice: initialPrice,
    targetReturnPercentage: 0, // Will be calculated below
  };

  // Calculate what our momentum strategy achieves
  const parPerf = calculateParPerformance(condensedData, tempGameParams);

  // Set target value to 20% above par performance, rounded to nearest $100
  const targetValue = Math.round((parPerf.parFinalValue * 1.2) / 100) * 100;

  // Calculate the target return percentage for display
  const targetReturnPercentage = Math.round(
    ((targetValue - startingCash) / startingCash) * 100
  );

  return {
    startingCash,
    startingShares: 0,
    targetValue,
    initialStockPrice: initialPrice,
    targetReturnPercentage,
  };
};

/**
 * Calculate par performance using a momentum trading strategy
 * This represents what an "average" player should achieve
 */
export const calculateParPerformance = (
  condensedData: CondensedDataPoint[],
  gameParams: GameParameters
): ParPerformance => {
  if (condensedData.length === 0) {
    return {
      parAverageBuyPrice: gameParams.initialStockPrice,
      parTotalSharesBought: 0,
      parFinalValue: gameParams.startingCash,
      parCashRemaining: gameParams.startingCash,
      strategy: "balanced",
      efficiency: 0,
    };
  }

  // Simulate momentum trading strategy
  let cash = gameParams.startingCash;
  let shares = 0;
  let totalSharesBought = 0;
  let totalCostBasis = 0;

  const prices = condensedData.map((d) => d.price);
  const initialPrice = prices[0];

  // Track consecutive price movements for momentum signals
  let consecutiveRising = 0;
  let consecutiveFalling = 0;

  for (let i = 3; i < condensedData.length - 1; i++) {
    const currentPrice = prices[i];
    const previousPrice = prices[i - 1];
    const prevPrevPrice = prices[i - 2];

    // Update consecutive counters
    if (currentPrice > previousPrice && previousPrice > prevPrevPrice) {
      consecutiveRising++;
      consecutiveFalling = 0;
    } else if (currentPrice < previousPrice && previousPrice < prevPrevPrice) {
      consecutiveFalling++;
      consecutiveRising = 0;
    } else {
      consecutiveRising = 0;
      consecutiveFalling = 0;
    }

    // Momentum Trading Rules:
    // 1. Buy when price is rising for 2+ consecutive periods
    // 2. Sell when price is falling for 2+ consecutive periods
    // 3. Use 30% of available cash per buy
    // 4. Don't buy if we already have a large position

    const cashPerTrade = cash * 0.3;
    const currentPositionValue = shares * currentPrice;
    const maxPositionValue = gameParams.startingCash * 0.7; // Don't go above 70% of starting cash in stocks

    // Buy signal: 2+ consecutive rising periods
    if (
      consecutiveRising >= 2 &&
      cash > cashPerTrade &&
      currentPositionValue < maxPositionValue
    ) {
      const sharesToBuy = Math.floor(cashPerTrade / currentPrice);

      if (sharesToBuy > 0 && sharesToBuy * currentPrice <= cash) {
        const cost = sharesToBuy * currentPrice;
        cash -= cost;
        shares += sharesToBuy;
        totalSharesBought += sharesToBuy;
        totalCostBasis += cost;
      }
    }

    // Sell signal: 2+ consecutive falling periods (and we have shares)
    else if (shares > 0 && consecutiveFalling >= 2) {
      // Sell 40% of holdings on momentum reversal
      const sharesToSell = Math.floor(shares * 0.4);

      if (sharesToSell > 0) {
        const revenue = sharesToSell * currentPrice;
        cash += revenue;
        shares -= sharesToSell;
      }
    }
  }

  // Sell remaining shares at final price
  const finalPrice = prices[prices.length - 1];
  if (shares > 0) {
    cash += shares * finalPrice;
    shares = 0;
  }

  const parFinalValue = cash;
  const parAverageBuyPrice =
    totalSharesBought > 0 ? totalCostBasis / totalSharesBought : initialPrice;

  // Calculate efficiency score (how well did we do compared to just holding?)
  const buyAndHoldShares = Math.floor(gameParams.startingCash / initialPrice);
  const buyAndHoldFinalValue =
    buyAndHoldShares * finalPrice +
    (gameParams.startingCash - buyAndHoldShares * initialPrice);
  const efficiency = Math.max(
    0,
    Math.min(
      1,
      (parFinalValue - buyAndHoldFinalValue) / gameParams.startingCash + 0.5
    )
  );

  return {
    parAverageBuyPrice,
    parTotalSharesBought: totalSharesBought,
    parFinalValue,
    parCashRemaining: cash,
    strategy: "balanced",
    efficiency,
  };
};

/**
 * Analyze the trading opportunity quality of a stock chart
 * Returns a score from 0-1 indicating how much trading opportunity exists
 */
export const analyzeChartTradability = (
  condensedData: CondensedDataPoint[]
): number => {
  if (condensedData.length < 20) return 0;

  const prices = condensedData.map((d) => d.price);
  const initialPrice = prices[0];
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  // Volatility score - more volatility = more trading opportunities
  const volatilityScore = (maxPrice - minPrice) / initialPrice;

  // Trend changes - count significant direction changes
  let trendChanges = 0;
  let currentTrend: "up" | "down" | "neutral" = "neutral";

  for (let i = 10; i < prices.length - 10; i++) {
    const recentAvg =
      prices.slice(i - 5, i + 1).reduce((sum, p) => sum + p, 0) / 6;
    const futureAvg = prices.slice(i, i + 6).reduce((sum, p) => sum + p, 0) / 6;

    const changePercent = (futureAvg - recentAvg) / recentAvg;

    let newTrend: "up" | "down" | "neutral" = "neutral";
    if (changePercent > 0.02) newTrend = "up";
    else if (changePercent < -0.02) newTrend = "down";

    if (newTrend !== "neutral" && newTrend !== currentTrend) {
      trendChanges++;
      currentTrend = newTrend;
    }
  }

  // Normalize trend changes (more changes = more opportunities)
  const trendScore = Math.min(1, trendChanges / 10);

  // Combined score with caps to avoid extreme values
  return Math.min(1, volatilityScore * 0.7 + trendScore * 0.3);
};
