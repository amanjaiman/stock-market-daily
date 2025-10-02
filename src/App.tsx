import { useState, useEffect, useRef } from "react";
import "./App.css";
import GameModal from "./components/GameModal";
import CountdownOverlay from "./components/CountdownOverlay";
import EndGameModal from "./components/EndGameModal";
import LeaderboardModal from "./components/LeaderboardModal";
import Header from "./components/Header";
import { useDailyChallenge } from "./hooks";
import type { CondensedDataPoint } from "./hooks/types";
import {
  type GameParameters,
  type ParPerformance,
} from "./utils/gameCalculations";
import {
  formatDateRangeForDisplay,
  formatDateRangeForBlurred,
} from "./utils/dateUtils";
import {
  saveLeaderboardEntry,
  getEntryForDay,
} from "./utils/leaderboardStorage";

interface StockData {
  price: number;
  change: number;
  percentChange: number;
}

type GameState = "pre-game" | "countdown" | "active" | "ended";

function App() {
  // Hook for daily challenge data from Supabase
  const {
    challenge,
    isLoading: challengeLoading,
    error: challengeError,
  } = useDailyChallenge();

  // Real stock data state
  const [currentStock, setCurrentStock] = useState<{
    symbol: string;
    name: string;
    sector?: string;
  } | null>(null);
  const [gameData, setGameData] = useState<CondensedDataPoint[]>([]);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [isDataReady, setIsDataReady] = useState(false);

  const [gameParameters, setGameParameters] = useState<GameParameters>({
    startingCash: 5000,
    startingShares: 0,
    targetValue: 6500,
    initialStockPrice: 300,
    targetReturnPercentage: 30,
  });
  const [parPerformance, setParPerformance] = useState<ParPerformance | null>(
    null
  );
  const [cash, setCash] = useState(gameParameters.startingCash);
  const [shares, setShares] = useState(gameParameters.startingShares);
  const [stockData, setStockData] = useState<StockData>({
    price: gameParameters.initialStockPrice,
    change: 0,
    percentChange: 0,
  });
  const [priceHistory, setPriceHistory] = useState<number[]>([
    gameParameters.initialStockPrice,
  ]);
  const [averageBuyPrice, setAverageBuyPrice] = useState(0); // Lifetime average
  const [totalSharesBought, setTotalSharesBought] = useState(0); // Lifetime total
  const [currentHoldingsAvgPrice, setCurrentHoldingsAvgPrice] = useState(0); // Current holdings average
  const previousPrice = useRef(gameParameters.initialStockPrice);
  const hasGameEndedSaved = useRef(false); // Track if we've saved results for current game

  // Game State Management
  const [gameState, setGameState] = useState<GameState>("pre-game");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [countdownValue, setCountdownValue] = useState(5);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showGameModal, setShowGameModal] = useState(true); // Will be updated based on hasPlayedToday
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  // Initialize game data from daily challenge
  useEffect(() => {
    if (!challenge) return;

    try {
      // Set stock information
      setCurrentStock({
        symbol: challenge.tickerSymbol,
        name: challenge.companyName,
        sector: challenge.sector || undefined,
      });

      // Set game data from challenge
      setGameData([...challenge.priceData]);
      setCurrentDataIndex(0);

      // Set game parameters from challenge
      const gameParams: GameParameters = {
        startingCash: challenge.startingCash,
        startingShares: challenge.startingShares,
        targetValue: challenge.targetValue,
        initialStockPrice: challenge.initialStockPrice,
        targetReturnPercentage: challenge.targetReturnPercentage,
      };
      setGameParameters(gameParams);

      // Set par performance from challenge
      const parPerf: ParPerformance = {
        parAverageBuyPrice: challenge.parAverageBuyPrice,
        parTotalSharesBought: challenge.parTotalSharesBought,
        parProfitPerTrade: challenge.parProfitPerTrade,
        parFinalValue: challenge.parFinalValue,
        parCashRemaining: challenge.parCashRemaining,
        strategy: "balanced",
        efficiency: challenge.parEfficiency,
      };
      setParPerformance(parPerf);

      // Reset game state with new parameters
      setCash(challenge.startingCash);
      setShares(challenge.startingShares);
      setAverageBuyPrice(0);
      setTotalSharesBought(0);
      setCurrentHoldingsAvgPrice(0);

      // Set initial stock price from the first data point
      if (challenge.priceData.length > 0) {
        setStockData({
          price: challenge.priceData[0].price,
          change: 0,
          percentChange: 0,
        });
        setPriceHistory([challenge.priceData[0].price]);
        previousPrice.current = challenge.priceData[0].price;
      }

      setIsDataReady(true);
      console.log("Game data initialized from daily challenge:", {
        stock: challenge.tickerSymbol,
        company: challenge.companyName,
        priceDataPoints: challenge.priceData.length,
        startingCash: challenge.startingCash,
        targetValue: challenge.targetValue,
      });

      // Check if user has already played today
      const todayEntry = getEntryForDay(challenge.day);
      const playedToday = todayEntry !== null;
      setHasPlayedToday(playedToday);

      // Only show game modal by default if user hasn't played today
      setShowGameModal(!playedToday);
    } catch (error) {
      console.error("Error initializing game data from challenge:", error);
    }
  }, [challenge]);

  // Debug log to use currentDataIndex for linter
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("Current data index:", currentDataIndex);
    }
  }, [currentDataIndex]);

  // Update stock price 5 times per second using condensed data
  useEffect(() => {
    if (gameState !== "active" || !isDataReady || gameData.length === 0) return;

    const updateStockPrice = () => {
      setCurrentDataIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        // Check if we've reached the end of the data
        if (nextIndex >= gameData.length) {
          return prevIndex; // Stay at the last index
        }

        const currentPoint = gameData[nextIndex];
        const previousPoint = gameData[prevIndex];

        if (currentPoint) {
          const dollarChange = currentPoint.price - previousPoint.price;
          const percentChange =
            previousPoint.price !== 0
              ? ((currentPoint.price - previousPoint.price) /
                  previousPoint.price) *
                100
              : 0;

          setStockData({
            price: currentPoint.price,
            change: dollarChange,
            percentChange: percentChange,
          });

          // Update price history (keep last 100 points for trend analysis)
          setPriceHistory((prev) => [...prev.slice(-99), currentPoint.price]);
        }

        return nextIndex;
      });
    };

    const interval = setInterval(updateStockPrice, 200); // 200ms = 5 times per second
    return () => clearInterval(interval);
  }, [gameState, isDataReady, gameData]);

  // Update previous price reference when price changes
  useEffect(() => {
    const timer = setTimeout(() => {
      previousPrice.current = stockData.price;
    }, 1000); // Reset the reference price every second for change calculation

    return () => clearTimeout(timer);
  }, [stockData.price]);

  // Game timer countdown
  useEffect(() => {
    if (gameState === "active" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setGameState("ended");
            setShowEndGameModal(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, timeRemaining]);

  // Countdown sequence (3-2-1)
  useEffect(() => {
    if (gameState === "countdown") {
      if (countdownValue > 0) {
        const timer = setTimeout(() => {
          setCountdownValue((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Start the game
        setGameState("active");
        setCountdownValue(5); // Reset for next time
      }
    }
  }, [gameState, countdownValue]);

  // Save game results when game state changes to "ended"
  useEffect(() => {
    if (gameState === "ended" && challenge && !hasGameEndedSaved.current) {
      hasGameEndedSaved.current = true;

      // Calculate final values with current state
      const finalValue = cash + shares * stockData.price;
      const percentageChange =
        ((finalValue - gameParameters.startingCash) /
          gameParameters.startingCash) *
        100;
      const playerProfitPerTrade =
        totalSharesBought > 0
          ? (finalValue - gameParameters.startingCash) / totalSharesBought
          : 0;

      console.log("Game ended - saving results:", {
        day: challenge.day,
        finalValue,
        cash,
        shares,
        stockPrice: stockData.price,
        totalSharesBought,
        averageBuyPrice,
        percentageChange,
        playerProfitPerTrade,
      });

      // Save to localStorage and Supabase
      saveLeaderboardEntry(
        challenge.day,
        finalValue,
        percentageChange,
        averageBuyPrice,
        playerProfitPerTrade
      ).catch((error) => {
        console.error("Error saving leaderboard entry:", error);
      });
    }
  }, [
    gameState,
    challenge,
    cash,
    shares,
    stockData.price,
    gameParameters.startingCash,
    totalSharesBought,
    averageBuyPrice,
  ]);

  const startGame = () => {
    if (!isDataReady || !challenge || gameData.length === 0) {
      console.warn("Cannot start game: data not ready");
      return;
    }

    // Reset the save flag for new game
    hasGameEndedSaved.current = false;

    // Start modal closing animation
    setIsModalClosing(true);

    // After animation completes, start the game and hide the modal
    setTimeout(() => {
      setCurrentDataIndex(0);
      setTimeRemaining(60); // 60 seconds as per game rules
      setGameState("countdown");
      setShowGameModal(false); // Actually hide the modal
      setIsModalClosing(false);
    }, 200); // Match the fade-out duration
  };

  const playAgain = () => {
    // Reset all game state
    setCash(gameParameters.startingCash);
    setShares(gameParameters.startingShares);
    setAverageBuyPrice(0);
    setTotalSharesBought(0);
    setCurrentHoldingsAvgPrice(0);
    setPriceHistory([gameParameters.initialStockPrice]);
    setStockData({
      price: gameParameters.initialStockPrice,
      change: 0,
      percentChange: 0,
    });
    previousPrice.current = gameParameters.initialStockPrice;

    // Close the modal and start the game
    setShowGameModal(false);
    setShowEndGameModal(false);

    // Start the game after a brief delay
    setTimeout(() => {
      startGame();
    }, 100);
  };

  // Show error state when challenge fails to load
  useEffect(() => {
    if (challengeError) {
      console.error("Failed to load daily challenge:", challengeError);
    }
  }, [challengeError]);

  const buyStock = (quantity: number = 1) => {
    const totalCost = stockData.price * quantity;
    if (gameState === "active" && cash >= totalCost && quantity > 0) {
      setCash((prev) => prev - totalCost);
      setShares((prev) => prev + quantity);

      // Update lifetime average buy price
      const newTotalCost = averageBuyPrice * totalSharesBought + totalCost;
      const newTotalShares = totalSharesBought + quantity;
      setAverageBuyPrice(newTotalCost / newTotalShares);
      setTotalSharesBought(newTotalShares);

      // Update current holdings average buy price
      const newCurrentHoldingsCost =
        currentHoldingsAvgPrice * shares + totalCost;
      const newCurrentHoldingsShares = shares + quantity;
      setCurrentHoldingsAvgPrice(
        newCurrentHoldingsCost / newCurrentHoldingsShares
      );
    }
  };

  const sellStock = (quantity: number = 1) => {
    const actualQuantity = Math.min(quantity, shares);
    if (gameState === "active" && shares > 0 && actualQuantity > 0) {
      const totalRevenue = stockData.price * actualQuantity;
      setCash((prev) => prev + totalRevenue);
      setShares((prev) => {
        const newShares = prev - actualQuantity;
        // If selling all shares, reset current holdings average
        if (newShares === 0) {
          setCurrentHoldingsAvgPrice(0);
        }
        return newShares;
      });
    }
  };

  const portfolioValue = shares * stockData.price;
  const totalValue = cash + portfolioValue;

  // Determine if we should blur stock details (only during active gameplay)
  const shouldBlurStockDetails = gameState === "active";

  // Calculate price range for last 50 updates (10 seconds)
  const recentPrices = priceHistory.slice(-50);
  const priceRange = {
    min: Math.min(...recentPrices),
    max: Math.max(...recentPrices),
  };

  // Chart layout and styling helpers
  const plotLeft = 64;
  const plotRight = 8;
  const plotTop = 8;
  const plotHeight = 240; // total SVG height 256 with 8 padding top/bottom
  const plotWidth = 800 - plotLeft - plotRight;
  const bottomY = 256 - plotTop; // 248
  const axisX = plotLeft - 8; // y-axis outside the grid

  const numRecent = recentPrices.length;
  const lastTenChange =
    numRecent > 1 ? recentPrices[numRecent - 1] - recentPrices[0] : 0;
  const lastTenPercentChange =
    numRecent > 1 && recentPrices[0] !== 0
      ? lastTenChange / recentPrices[0]
      : 0;
  const isLastTenUp = lastTenChange >= 0;
  const neutralThresholdPct = 0.02; // 2%
  const isNeutral = Math.abs(lastTenPercentChange) <= neutralThresholdPct;
  const trendColor = isNeutral
    ? "#9ca3af"
    : isLastTenUp
    ? "#10b981"
    : "#f97316";

  const yFor = (price: number) =>
    256 -
    ((price - priceRange.min) / (priceRange.max - priceRange.min || 1)) *
      plotHeight -
    plotTop;
  const xFor = (index: number) =>
    plotLeft + (index / Math.max(1, numRecent - 1)) * plotWidth;

  const linePoints = recentPrices
    .map((price, index) => `${xFor(index)},${yFor(price)}`)
    .join(" ");

  const coords = recentPrices.map((price, index) => [xFor(index), yFor(price)]);
  const areaPathD =
    coords.length > 1
      ? `M ${coords[0][0]},${coords[0][1]} ${coords
          .slice(1)
          .map((c) => `L ${c[0]},${c[1]}`)
          .join(" ")} L ${
          coords[coords.length - 1][0]
        },${bottomY} L ${plotLeft},${bottomY} Z`
      : undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatChange = (change: number, isPercent: boolean = false) => {
    const formatted = isPercent
      ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
      : `${change >= 0 ? "+" : ""}${formatCurrency(change)}`;

    return formatted;
  };

  // Header button handlers
  const handleLeaderboardClick = () => {
    console.log("Leaderboard clicked");
    setShowLeaderboardModal(true);
  };

  const handleResultsClick = () => {
    console.log("Results/Share clicked");
    if (gameState === "ended" || hasPlayedToday) {
      setShowEndGameModal(true);
    }
  };

  const handleLeaderboardModalClick = () => {
    setShowEndGameModal(false);
    setShowLeaderboardModal(true);
  };

  const handleHelpClick = () => {
    setShowGameModal(true);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-slate-900">
      {/* Global Header */}
      <Header
        onLeaderboardClick={handleLeaderboardClick}
        onResultsClick={handleResultsClick}
        onHelpClick={handleHelpClick}
        gameState={gameState}
        hasPlayedToday={hasPlayedToday}
      />

      {/* Single Vertical Panel */}
      <div className="max-w-4xl mx-auto p-3 sm:p-7">
        {/* Chart Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-8 mb-4 sm:mb-8 game-tile">
          <div className="mb-3 sm:mb-6">
            {gameState !== "ended" && (
              <h3 className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
                Category: {currentStock?.sector || "Mystery"}
              </h3>
            )}
            {gameState === "ended" && (
              <h3 className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
                {currentStock?.name} ({currentStock?.symbol})
              </h3>
            )}
            {challenge && (
              <p className="text-sm sm:text-lg text-slate-500 font-medium dark:text-slate-400">
                {shouldBlurStockDetails
                  ? formatDateRangeForBlurred(
                      challenge.startDate,
                      challenge.endDate
                    )
                  : formatDateRangeForDisplay(
                      challenge.startDate,
                      challenge.endDate
                    )}
              </p>
            )}
          </div>

          {/* Price Display - Full Width */}
          <div className="mb-4 sm:mb-8">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div>
                <div className="mb-2 sm:mb-3">
                  <span className="text-3xl sm:text-5xl font-black text-slate-700 dark:text-slate-300">
                    {formatCurrency(stockData.price)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div
                      className={`${
                        stockData.change >= 0
                          ? "text-green-500 dark:text-green-400"
                          : "text-orange-500 dark:text-orange-400"
                      }`}
                    >
                      {stockData.change >= 0 ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            fillRule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-lg font-bold w-16 text-left ${
                        stockData.change >= 0
                          ? "text-green-500 dark:text-green-400"
                          : "text-orange-500 dark:text-orange-400"
                      }`}
                    >
                      {formatChange(stockData.percentChange, true)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {/* Timer Display */}
                {(gameState === "active" || gameState === "ended") && (
                  <div className="flex items-center justify-end gap-2">
                    <svg
                      className={`w-6 h-6 ${
                        timeRemaining > 30
                          ? "text-green-500 dark:text-green-400"
                          : timeRemaining > 10
                          ? "text-yellow-500 dark:text-yellow-400"
                          : "text-red-500 dark:text-red-400 animate-pulse"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span
                      className={`text-xl sm:text-2xl font-black ${
                        timeRemaining > 30
                          ? "text-green-500 dark:text-green-400"
                          : timeRemaining > 10
                          ? "text-yellow-500 dark:text-yellow-400"
                          : "text-red-500 dark:text-red-400 animate-pulse"
                      }`}
                    >
                      {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-[#f2f2f2] dark:bg-slate-900 rounded-2xl p-3 sm:p-6 relative">
            {/* Countdown Overlay - Only over the chart */}
            {(gameState === "countdown" ||
              (gameState === "pre-game" && !showGameModal)) && (
              <CountdownOverlay
                countdownValue={countdownValue}
                showStartButton={gameState === "pre-game" && !showGameModal}
                onStartClick={playAgain}
              />
            )}
            <div className="relative h-64 overflow-hidden">
              <svg
                className="w-full h-full"
                viewBox="0 0 800 256"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                <defs>
                  <pattern
                    id="grid"
                    width="40"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 32"
                      fill="none"
                      stroke="var(--chart-grid)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={trendColor}
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor={trendColor}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <rect
                  x={plotLeft}
                  y={plotTop}
                  width={plotWidth}
                  height={plotHeight}
                  fill="url(#grid)"
                />

                {/* Y Axis */}
                <line
                  x1={axisX}
                  y1={plotTop}
                  x2={axisX}
                  y2={plotTop + plotHeight}
                  stroke="var(--chart-axis)"
                  strokeWidth="1"
                />
                {/* Max tick and label */}
                <line
                  x1={axisX}
                  y1={yFor(priceRange.max)}
                  x2={axisX + 4}
                  y2={yFor(priceRange.max)}
                  stroke="var(--chart-axis)"
                  strokeWidth="1"
                />
                <text
                  x={axisX - 6}
                  y={yFor(priceRange.max) + 4}
                  textAnchor="end"
                  fontSize="14"
                  fill="var(--chart-text)"
                >
                  {formatCurrency(priceRange.max)}
                </text>
                {/* Min tick and label */}
                <line
                  x1={axisX}
                  y1={yFor(priceRange.min)}
                  x2={axisX + 4}
                  y2={yFor(priceRange.min)}
                  stroke="var(--chart-axis)"
                  strokeWidth="1"
                />
                <text
                  x={axisX - 6}
                  y={yFor(priceRange.min) + 4}
                  textAnchor="end"
                  fontSize="14"
                  fill="var(--chart-text)"
                >
                  {formatCurrency(priceRange.min)}
                </text>

                {/* Removed avg buy indicators on axis when out of range */}

                {/* Price line */}
                {coords.length > 1 && areaPathD && (
                  <path d={areaPathD} fill="url(#areaGradient)" />
                )}
                {recentPrices.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={trendColor}
                    strokeWidth="6"
                    points={linePoints}
                  />
                )}

                {/* Average buy price line for current holdings */}
                {shares > 0 &&
                  currentHoldingsAvgPrice >= priceRange.min &&
                  currentHoldingsAvgPrice <= priceRange.max && (
                    <line
                      x1={plotLeft}
                      y1={
                        256 -
                        ((currentHoldingsAvgPrice - priceRange.min) /
                          (priceRange.max - priceRange.min || 1)) *
                          plotHeight -
                        plotTop
                      }
                      x2={plotLeft + plotWidth}
                      y2={
                        256 -
                        ((currentHoldingsAvgPrice - priceRange.min) /
                          (priceRange.max - priceRange.min || 1)) *
                          plotHeight -
                        plotTop
                      }
                      stroke="#fbbf24"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                    />
                  )}

                {/* Current price dot */}
                {recentPrices.length > 0 && (
                  <circle
                    cx={xFor(numRecent - 1)}
                    cy={
                      256 -
                      ((stockData.price - priceRange.min) /
                        (priceRange.max - priceRange.min || 1)) *
                        plotHeight -
                      plotTop
                    }
                    r="6"
                    fill={trendColor}
                    className="animate-pulse"
                  />
                )}
              </svg>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 text-xs sm:text-base text-slate-500 font-semibold mt-3 sm:mt-6">
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-bold">10s Range:</span>{" "}
                <span className="font-semibold">
                  {formatCurrency(priceRange.min)} -{" "}
                  {formatCurrency(priceRange.max)}
                </span>
              </span>
              <div className="flex gap-3 sm:gap-6 flex-wrap">
                {shares > 0 && (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-yellow-400 dark:bg-yellow-400 rounded-full"></div>
                    Avg Buy: {formatCurrency(currentHoldingsAvgPrice)}
                  </span>
                )}
                <span className="font-bold" style={{ color: "#3b82f6" }}>
                  Current: {formatCurrency(stockData.price)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buy/Sell Button Groups */}
        <div className="grid grid-cols-3 sm:flex sm:gap-6 gap-2 mb-4 sm:mb-8">
          {/* Buy Buttons */}
          <div className="contents sm:flex sm:gap-2 sm:flex-1">
            <button
              onClick={() => buyStock(1)}
              disabled={
                gameState === "pre-game" ||
                gameState === "countdown" ||
                gameState === "ended" ||
                cash < stockData.price
              }
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl floating-button bounce-click sm:flex-1 transition-all duration-200 ${
                gameState === "active" && cash >= stockData.price
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              }`}
            >
              <span className="text-lg sm:text-xl font-black">+</span>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-black">BUY 1</div>
                <div className="text-xs sm:text-sm opacity-90">
                  {formatCurrency(stockData.price)}
                </div>
              </div>
            </button>

            <button
              onClick={() => buyStock(5)}
              disabled={
                gameState === "pre-game" ||
                gameState === "countdown" ||
                gameState === "ended" ||
                cash < stockData.price * 5
              }
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl floating-button bounce-click sm:flex-1 transition-all duration-200 ${
                gameState === "active" && cash >= stockData.price * 5
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              }`}
            >
              <span className="text-lg sm:text-xl font-black">+</span>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-black">BUY 5</div>
                <div className="text-xs sm:text-sm opacity-90">
                  {formatCurrency(stockData.price * 5)}
                </div>
              </div>
            </button>

            <button
              onClick={() => buyStock(Math.floor(cash / stockData.price))}
              disabled={
                gameState === "pre-game" ||
                gameState === "countdown" ||
                gameState === "ended" ||
                cash < stockData.price ||
                Math.floor(cash / stockData.price) === 0
              }
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl floating-button bounce-click sm:flex-1 transition-all duration-200 ${
                gameState === "active" &&
                cash >= stockData.price &&
                Math.floor(cash / stockData.price) > 0
                  ? "bg-green-700 hover:bg-green-800 text-white"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              }`}
            >
              <span className="text-lg sm:text-xl font-black">+</span>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-black">MAX</div>
                <div className="text-xs sm:text-sm opacity-90">
                  {Math.floor(cash / stockData.price)} shares
                </div>
              </div>
            </button>
          </div>

          {/* Sell Buttons */}
          <div className="contents sm:flex sm:gap-2 sm:flex-1">
            <button
              onClick={() => sellStock(1)}
              disabled={
                gameState === "pre-game" ||
                gameState === "countdown" ||
                gameState === "ended" ||
                shares === 0
              }
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl floating-button bounce-click sm:flex-1 transition-all duration-200 ${
                gameState === "active" && shares > 0
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              }`}
            >
              <span className="text-lg sm:text-xl font-black">−</span>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-black">SELL 1</div>
                <div className="text-xs sm:text-sm opacity-90">
                  {formatCurrency(stockData.price)}
                </div>
              </div>
            </button>

            <button
              onClick={() => sellStock(5)}
              disabled={
                gameState === "pre-game" ||
                gameState === "countdown" ||
                gameState === "ended" ||
                shares < 5
              }
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl floating-button bounce-click sm:flex-1 transition-all duration-200 ${
                gameState === "active" && shares >= 5
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              }`}
            >
              <span className="text-lg sm:text-xl font-black">−</span>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-black">SELL 5</div>
                <div className="text-xs sm:text-sm opacity-90">
                  {formatCurrency(stockData.price * 5)}
                </div>
              </div>
            </button>

            <button
              onClick={() => sellStock(shares)}
              disabled={
                gameState === "pre-game" ||
                gameState === "countdown" ||
                gameState === "ended" ||
                shares === 0
              }
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl floating-button bounce-click sm:flex-1 transition-all duration-200 ${
                gameState === "active" && shares > 0
                  ? "bg-orange-700 hover:bg-orange-800 text-white"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              }`}
            >
              <span className="text-lg sm:text-xl font-black">−</span>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-black">ALL</div>
                <div className="text-xs sm:text-sm opacity-90">
                  {shares} shares
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Game State Information Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-8 mb-4 sm:mb-8 game-tile">
          {/* Game Status */}
          <div className="mb-4 sm:mb-6">
            {/* Full Width Portfolio Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Need:{" "}
                  {formatCurrency(
                    Math.max(0, gameParameters.targetValue - totalValue)
                  )}
                </span>
                <span>
                  {Math.min(
                    (totalValue / gameParameters.targetValue) * 100,
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (totalValue / gameParameters.targetValue) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Game Target Information */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Current Value
              </p>
              <p
                className={`text-lg sm:text-2xl font-black ${
                  totalValue >= gameParameters.targetValue
                    ? "text-green-600 dark:text-green-400"
                    : totalValue >= gameParameters.startingCash
                    ? "text-blue-600 dark:text-sky-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              >
                {formatCurrency(totalValue)}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Target Value
              </p>
              <p className="text-lg sm:text-2xl font-black text-green-600 dark:text-green-400">
                {formatCurrency(gameParameters.targetValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Information Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-8 game-tile">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
              Portfolio Summary
            </h3>
          </div>

          {totalSharesBought === 0 && (
            <div className="bg-amber-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                No shares bought
              </p>
            </div>
          )}

          {totalSharesBought > 0 && (
            <div className="bg-amber-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Lifetime Average Buy Price
                  </p>
                  <p className="text-lg sm:text-2xl font-black text-slate-700 dark:text-slate-300">
                    {formatCurrency(averageBuyPrice)}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Lifetime Shares Bought
                  </p>
                  <p className="text-lg sm:text-2xl font-black text-slate-700 dark:text-slate-300">
                    {totalSharesBought}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Spinner - Show while data is loading */}
      {gameState === "pre-game" &&
        (challengeLoading || !isDataReady || !challenge) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900 opacity-70">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
              <p className="text-white font-semibold">
                {challengeLoading
                  ? "Loading daily challenge..."
                  : !isDataReady
                  ? "Preparing game data..."
                  : challengeError
                  ? "Failed to load challenge"
                  : "Getting ready..."}
              </p>
            </div>
          </div>
        )}

      {/* Game Modal - Only show when data is fully loaded */}
      {showGameModal && !challengeLoading && isDataReady && challenge && (
        <GameModal
          startingCash={gameParameters.startingCash}
          startingStockPrice={gameParameters.initialStockPrice}
          targetValue={gameParameters.targetValue}
          targetReturnPercentage={gameParameters.targetReturnPercentage}
          onStart={startGame}
          onPlayAgain={playAgain}
          onClose={() => setShowGameModal(false)}
          stockInfo={currentStock}
          dateRange={{
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            days: challenge.tradingDays,
          }}
          isClosing={isModalClosing}
          hasPlayedToday={hasPlayedToday}
          onLeaderboardClick={handleLeaderboardClick}
          onResultsClick={handleResultsClick}
        />
      )}

      {/* End Game Modal */}
      {showEndGameModal && currentStock && challenge && parPerformance && (
        <EndGameModal
          isWinner={totalValue >= gameParameters.targetValue}
          stockInfo={currentStock}
          dateRange={{
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            days: challenge.tradingDays,
          }}
          gameParameters={gameParameters}
          parPerformance={parPerformance}
          playerStats={{
            finalValue: totalValue,
            averageBuyPrice,
            totalSharesBought,
            cash,
            shares,
            currentStockPrice: stockData.price,
          }}
          day={challenge.day}
          onClose={() => {
            setShowEndGameModal(false);
            // Keep game in ended state so user can see final results
          }}
          onLeaderboardClick={handleLeaderboardModalClick}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal
          onClose={() => {
            setShowLeaderboardModal(false);
          }}
        />
      )}

      {/* Blur overlay when modal is visible */}
      <div
        className={`fixed inset-0 transition-all duration-300 pointer-events-none ${
          showGameModal ? "backdrop-blur-sm" : ""
        }`}
      />
    </div>
  );
}

export default App;
