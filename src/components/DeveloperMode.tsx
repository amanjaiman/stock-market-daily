import { useState } from "react";
import { useTopStocks, useDailyStock } from "../hooks/useTopStocks";
import { useDateRange, useDailyDateRange } from "../hooks/useDateRange";
import { useStockPriceData } from "../hooks/useStockPriceData";
import { useCondensedPriceData } from "../hooks/useCondensedPriceData";
import type { StockSymbol, DateRange } from "../hooks";

interface DeveloperModeProps {
  isOpen: boolean;
  onClose: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

function DeveloperMode({
  isOpen,
  onClose,
  isPaused,
  onTogglePause,
}: DeveloperModeProps) {
  const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(
    null
  );
  const [currentStep, setCurrentStep] = useState<
    "stock" | "dateRange" | "priceData" | "condensed" | "complete"
  >("stock");

  // Hook instances
  const {
    stocks,
    getRandomStock,
    isLoading: stocksLoading,
    error: stocksError,
  } = useTopStocks();
  const { dailyStock, refreshDailyStock } = useDailyStock();
  const { generateRandomRange, isLoading: dateRangeLoading } = useDateRange();
  const { dailyDateRange, refreshDailyDateRange } = useDailyDateRange();
  const {
    rawPrices,
    fetchPriceData,
    isLoading: priceDataLoading,
    error: priceDataError,
  } = useStockPriceData();
  const {
    condensedData,
    condenseData,
    isLoading: condensedDataLoading,
  } = useCondensedPriceData();

  const handleGetRandomStock = () => {
    const stock = getRandomStock();
    if (stock) {
      setSelectedStock(stock);
      setCurrentStep("dateRange");
    }
  };

  const handleGenerateDateRange = () => {
    const range = generateRandomRange();
    setSelectedDateRange(range);
    setCurrentStep("priceData");
  };

  const handleFetchPriceData = async () => {
    if (selectedStock && selectedDateRange) {
      setCurrentStep("priceData");
      await fetchPriceData(
        selectedStock.symbol,
        selectedDateRange.startDate,
        selectedDateRange.endDate
      );
      setCurrentStep("condensed");
    }
  };

  const handleCondenseData = () => {
    if (rawPrices.length > 0) {
      condenseData(rawPrices);
      setCurrentStep("complete");
    }
  };

  const handleUseDailyData = () => {
    const stock = refreshDailyStock();
    const range = refreshDailyDateRange();

    if (stock && range) {
      setSelectedStock(stock);
      setSelectedDateRange(range);
      setCurrentStep("priceData");
    }
  };

  const resetFlow = () => {
    setSelectedStock(null);
    setSelectedDateRange(null);
    setCurrentStep("stock");
  };

  const getStepStatus = (step: typeof currentStep) => {
    if (step === currentStep) return "current";
    if (
      (step === "stock" && selectedStock) ||
      (step === "dateRange" && selectedDateRange) ||
      (step === "priceData" && rawPrices.length > 0) ||
      (step === "condensed" && condensedData.length > 0) ||
      (step === "complete" && condensedData.length > 0)
    ) {
      return "complete";
    }
    return "pending";
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
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
            <span className="text-sm font-bold">Developer Mode</span>
          </div>
          <button
            onClick={onClose}
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

        {/* Market Controls */}
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h3 className="text-xs font-bold mb-2">Market Controls</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePause}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                isPaused
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {isPaused ? (
                <>
                  <svg
                    className="w-3 h-3"
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
                    className="w-3 h-3"
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

        {/* Data Pipeline Testing */}
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h3 className="text-xs font-bold mb-2">Data Pipeline Testing</h3>

          {/* Progress Steps */}
          <div className="mb-3 space-y-1">
            {[
              { key: "stock", label: "Random Stock" },
              { key: "dateRange", label: "Date Range" },
              { key: "priceData", label: "Price Data" },
              { key: "condensed", label: "Condensed Data" },
              { key: "complete", label: "Complete" },
            ].map(({ key, label }) => {
              const status = getStepStatus(key as typeof currentStep);
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === "complete"
                        ? "bg-emerald-500"
                        : status === "current"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <span
                    className={
                      status === "current"
                        ? "text-yellow-400 font-medium"
                        : "text-gray-300"
                    }
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Control Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleUseDailyData}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
            >
              Use Today's Daily Data
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGetRandomStock}
                disabled={stocksLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs py-1 px-2 rounded-md transition-colors"
              >
                {stocksLoading ? "Loading..." : "Random Stock"}
              </button>

              <button
                onClick={handleGenerateDateRange}
                disabled={dateRangeLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs py-1 px-2 rounded-md transition-colors"
              >
                {dateRangeLoading ? "Loading..." : "Date Range"}
              </button>
            </div>

            <button
              onClick={handleFetchPriceData}
              disabled={
                priceDataLoading || !selectedStock || !selectedDateRange
              }
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
            >
              {priceDataLoading ? "Fetching..." : "Fetch Price Data"}
            </button>

            <button
              onClick={handleCondenseData}
              disabled={condensedDataLoading || rawPrices.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
            >
              {condensedDataLoading ? "Processing..." : "Condense Data"}
            </button>

            <button
              onClick={resetFlow}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs py-1 px-3 rounded-md transition-colors"
            >
              Reset Flow
            </button>
          </div>
        </div>

        {/* Current Data Status */}
        <div className="space-y-2 text-xs">
          {/* Stock Info */}
          {selectedStock && (
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-400">Selected Stock:</div>
              <div className="font-medium text-emerald-400">
                {selectedStock.symbol}
              </div>
              <div className="text-gray-300">{selectedStock.name}</div>
            </div>
          )}

          {/* Date Range Info */}
          {selectedDateRange && (
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-400">Date Range:</div>
              <div className="text-white">
                {selectedDateRange.startDate} to {selectedDateRange.endDate}
              </div>
              <div className="text-gray-300">
                {selectedDateRange.days} trading days
              </div>
            </div>
          )}

          {/* Price Data Info */}
          {rawPrices.length > 0 && (
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-400">Raw Price Data:</div>
              <div className="text-white">{rawPrices.length} data points</div>
              <div className="text-gray-300">
                ${rawPrices[0]?.close.toFixed(2)} → $
                {rawPrices[rawPrices.length - 1]?.close.toFixed(2)}
              </div>
            </div>
          )}

          {/* Condensed Data Info */}
          {condensedData.length > 0 && (
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-400">Condensed Data:</div>
              <div className="text-white">
                {condensedData.length} game points
              </div>
              <div className="text-gray-300">Ready for 60s game!</div>
            </div>
          )}

          {/* Daily Stock Info */}
          {dailyStock && (
            <div className="p-2 bg-blue-900 rounded">
              <div className="text-blue-300">Today's Stock:</div>
              <div className="font-medium text-blue-100">
                {dailyStock.symbol}
              </div>
            </div>
          )}

          {/* Daily Date Range Info */}
          {dailyDateRange && (
            <div className="p-2 bg-blue-900 rounded">
              <div className="text-blue-300">Today's Range:</div>
              <div className="text-blue-100">
                {dailyDateRange.startDate} to {dailyDateRange.endDate}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {stocksError && (
            <div className="p-2 bg-red-900 rounded text-red-100 text-xs">
              Stock Error: {stocksError}
            </div>
          )}

          {priceDataError && (
            <div className="p-2 bg-red-900 rounded text-red-100 text-xs">
              Price Data Error: {priceDataError}
            </div>
          )}

          {/* Stock Count */}
          <div className="p-2 bg-gray-700 rounded">
            <div className="text-gray-400">Available Stocks:</div>
            <div className="text-white">{stocks.length} stocks loaded</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeveloperMode;
