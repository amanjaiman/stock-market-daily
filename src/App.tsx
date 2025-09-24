import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

interface StockData {
  price: number;
  change: number;
  percentChange: number;
}

function App() {
  const [cash, setCash] = useState(10000); // Starting with $10,000
  const [shares, setShares] = useState(0);
  const [stockData, setStockData] = useState<StockData>({
    price: 500,
    change: 0,
    percentChange: 0,
  });
  const [priceHistory, setPriceHistory] = useState<number[]>([500]);
  const [averageBuyPrice, setAverageBuyPrice] = useState(0); // Lifetime average
  const [totalSharesBought, setTotalSharesBought] = useState(0); // Lifetime total
  const [currentHoldingsAvgPrice, setCurrentHoldingsAvgPrice] = useState(0); // Current holdings average
  const [isRising, setIsRising] = useState(true);
  const [momentum, setMomentum] = useState(1); // signed momentum [-10, 10]
  const previousPrice = useRef(500);

  // Developer Mode States
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const generatePriceChange = useCallback(() => {
    // Decide whether to continue current direction (70%) or flip
    const continueDirection = Math.random() < 0.7;

    let nextIsRising = isRising;
    if (!continueDirection) {
      nextIsRising = !isRising;
    }

    // Update signed momentum toward the chosen direction
    const dirSign = nextIsRising ? 1 : -1;
    const changedDirection = nextIsRising !== isRising;
    const maxMomentum = 5;
    const rampStep = 1;
    const changeBoostStep = 3; // larger delta when direction changes
    const step = changedDirection ? changeBoostStep : rampStep;
    const nextMomentum = Math.max(
      -maxMomentum,
      Math.min(maxMomentum, momentum + dirSign * step)
    );

    // Base move and randomness
    const baseUnit = 2.5;
    const volatility = 2.5;
    const randomChange = (Math.random() - 0.5) * volatility;

    // Resistance when momentum opposes the chosen direction; growth when aligned
    const trendMultiplier = Math.max(0, 1 + dirSign * nextMomentum * 0.1);

    const baseChangeSigned = dirSign * baseUnit;
    const finalChange = Math.max(
      -5,
      Math.min(5, baseChangeSigned * trendMultiplier + randomChange)
    );

    // Commit state for next tick
    setIsRising(nextIsRising);
    setMomentum(nextMomentum);

    return finalChange;
  }, [isRising, momentum]);

  // Update stock price 5 times per second
  useEffect(() => {
    if (isPaused) return; // Don't update when paused

    const updateStockPrice = () => {
      setStockData((prevData) => {
        const currentPrice = prevData.price;
        const change = generatePriceChange();
        const newPrice = Math.max(50, currentPrice + change); // Minimum price of $50

        const dollarChange = newPrice - previousPrice.current;
        const percentChange =
          ((newPrice - previousPrice.current) / previousPrice.current) * 100;

        // Update price history (keep last 100 points for trend analysis)
        setPriceHistory((prev) => [...prev.slice(-99), newPrice]);

        return {
          price: newPrice,
          change: dollarChange,
          percentChange: percentChange,
        };
      });
    };

    const interval = setInterval(updateStockPrice, 200); // 200ms = 5 times per second
    return () => clearInterval(interval);
  }, [generatePriceChange, isPaused]);

  // Update previous price reference when price changes
  useEffect(() => {
    const timer = setTimeout(() => {
      previousPrice.current = stockData.price;
    }, 1000); // Reset the reference price every second for change calculation

    return () => clearTimeout(timer);
  }, [stockData.price]);

  const buyStock = () => {
    if (cash >= stockData.price) {
      setCash((prev) => prev - stockData.price);
      setShares((prev) => prev + 1);

      // Update lifetime average buy price
      const newTotalCost =
        averageBuyPrice * totalSharesBought + stockData.price;
      const newTotalShares = totalSharesBought + 1;
      setAverageBuyPrice(newTotalCost / newTotalShares);
      setTotalSharesBought(newTotalShares);

      // Update current holdings average buy price
      const newCurrentHoldingsCost =
        currentHoldingsAvgPrice * shares + stockData.price;
      const newCurrentHoldingsShares = shares + 1;
      setCurrentHoldingsAvgPrice(
        newCurrentHoldingsCost / newCurrentHoldingsShares
      );
    }
  };

  const sellStock = () => {
    if (shares > 0) {
      setCash((prev) => prev + stockData.price);
      setShares((prev) => {
        const newShares = prev - 1;
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

  return (
    <div
      className="min-h-screen bg-[#fefefe]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20px 20px, #f3f4f6 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Single Vertical Panel */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Combined Market Price and Chart Section */}
        <div className="bg-white rounded-3xl card-shadow p-8 mb-8 game-tile">
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mr-4 card-shadow">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-700">
                Market Index
              </h2>
              <p className="text-base text-gray-500 font-semibold">
                Simulated Stock Market
              </p>
            </div>
          </div>

          {/* Price Display - Full Width */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="mb-3">
                  <span className="text-5xl font-black text-gray-700">
                    {formatCurrency(stockData.price)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div
                      className={`${
                        stockData.change >= 0
                          ? "text-emerald-500"
                          : "text-orange-500"
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
                          ? "text-emerald-500"
                          : "text-orange-500"
                      }`}
                    >
                      {formatChange(stockData.percentChange, true)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base text-gray-500">
                  <span className="font-bold">10s Range:</span>{" "}
                  <span className="font-semibold">
                    {formatCurrency(priceRange.min)} -{" "}
                    {formatCurrency(priceRange.max)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div
            className="bg-slate-50 rounded-2xl p-6 card-shadow"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10px 10px, #e2e8f0 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
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
                      stroke="#cbd5e1"
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
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                {/* Max tick and label */}
                <line
                  x1={axisX}
                  y1={yFor(priceRange.max)}
                  x2={axisX + 4}
                  y2={yFor(priceRange.max)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={axisX - 6}
                  y={yFor(priceRange.max) + 4}
                  textAnchor="end"
                  fontSize="14"
                  fill="#64748b"
                >
                  {formatCurrency(priceRange.max)}
                </text>
                {/* Min tick and label */}
                <line
                  x1={axisX}
                  y1={yFor(priceRange.min)}
                  x2={axisX + 4}
                  y2={yFor(priceRange.min)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={axisX - 6}
                  y={yFor(priceRange.min) + 4}
                  textAnchor="end"
                  fontSize="14"
                  fill="#64748b"
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
            <div className="flex justify-end text-base text-gray-500 font-semibold mt-6">
              <div className="flex gap-6">
                {shares > 0 && (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-yellow-400 rounded-full"></div>
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

        {/* Large Buy/Sell Buttons */}
        <div className="flex gap-6 mb-8">
          <button
            onClick={buyStock}
            disabled={cash < stockData.price}
            className="flex items-center justify-center gap-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-6 px-12 rounded-3xl floating-button bounce-click flex-1"
          >
            <span className="text-3xl font-black">+</span>
            <div className="text-left">
              <div className="text-2xl font-black">BUY</div>
              <div className="text-sm opacity-90">
                {cash < stockData.price
                  ? "Insufficient funds"
                  : `${formatCurrency(stockData.price)} per share`}
              </div>
            </div>
          </button>
          <button
            onClick={sellStock}
            disabled={shares === 0}
            className="flex items-center justify-center gap-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-bold py-6 px-12 rounded-3xl floating-button bounce-click flex-1"
          >
            <span className="text-3xl font-black">−</span>
            <div className="text-left">
              <div className="text-2xl font-black">SELL</div>
              <div className="text-sm opacity-90">
                {shares === 0 ? "No shares to sell" : `${shares} shares owned`}
              </div>
            </div>
          </button>
        </div>

        {/* Portfolio Information Card */}
        <div className="bg-white rounded-3xl card-shadow p-8 game-tile">
          <h3 className="text-2xl font-bold text-gray-700 mb-6">
            Portfolio Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-sm font-semibold text-gray-500 mb-2">
                Total Portfolio Value
              </p>
              <p className="text-3xl font-black text-gray-700">
                {formatCurrency(totalValue)}
              </p>
              <p
                className={`text-lg font-bold mt-2 ${
                  totalValue >= 10000 ? "text-emerald-500" : "text-orange-500"
                }`}
              >
                {formatChange(totalValue - 10000)} (
                {(((totalValue - 10000) / 10000) * 100).toFixed(2)}%)
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-sm font-semibold text-gray-500 mb-2">
                Available Cash
              </p>
              <p className="text-3xl font-black text-gray-700">
                {formatCurrency(cash)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Can buy {Math.floor(cash / stockData.price)} shares
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-sm font-semibold text-gray-500 mb-2">
                Stock Holdings
              </p>
              <p className="text-3xl font-black text-gray-700">
                {formatCurrency(portfolioValue)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {shares} shares owned
              </p>
            </div>
          </div>

          {totalSharesBought > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Lifetime Average Buy Price
                  </p>
                  <p className="text-2xl font-black text-gray-700">
                    {formatCurrency(averageBuyPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Lifetime Shares Bought
                  </p>
                  <p className="text-2xl font-black text-gray-700">
                    {totalSharesBought}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Developer Mode Toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isDevModeOpen ? (
          <button
            onClick={() => setIsDevModeOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            title="Developer Mode"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </button>
        ) : (
          <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4 min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <span className="text-sm font-bold">Dev Mode</span>
              </div>
              <button
                onClick={() => setIsDevModeOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isPaused
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
              >
                {isPaused ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    Pause
                  </>
                )}
              </button>

              <div className="text-xs text-gray-400">
                {isPaused ? "Market Paused" : "Market Live"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
