interface StockInfo {
  symbol: string;
  name: string;
  sector?: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
  days: number;
}

interface GameModalProps {
  startingCash: number;
  startingStockPrice: number;
  targetValue: number;
  targetReturnPercentage?: number;
  onStart: () => void;
  isLoading?: boolean;
  loadingText?: string;
  error?: string | null;
  stockInfo?: StockInfo | null;
  dateRange?: DateRange | null;
}

import { useState } from "react";
import Tooltip from "./Tooltip";

function GameModal({
  startingCash,
  startingStockPrice,
  targetValue,
  targetReturnPercentage,
  onStart,
  isLoading = false,
  loadingText,
  stockInfo,
  dateRange,
}: GameModalProps) {
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm bg-opacity-20"></div>

      {/* Modal */}
      <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-4 sm:p-8 max-w-sm sm:max-w-md w-full max-h-full overflow-y-auto my-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-700 dark:text-gray-300 mb-2">
            DayTradle
          </h1>
        </div>

        {/* Rules */}
        <div className="space-y-8 mb-8">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
              Today's Challenge
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-semibold">
                    Cash
                  </p>
                  <p className="text-lg font-black text-gray-700 dark:text-gray-300">
                    {formatCurrency(startingCash)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-semibold">
                    Stock Price
                  </p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ${startingStockPrice}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-semibold">
                    Shares
                  </p>
                  <p className="text-lg font-black text-gray-700 dark:text-gray-300">
                    0
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 dark:text-gray-400 font-semibold">
                  Stock Category
                </p>
                <p className="text-lg font-black text-gray-700 dark:text-gray-300">
                  {stockInfo?.sector || "Mystery"}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 dark:text-gray-400 font-semibold">
                  Time Period
                </p>
                <p className="text-lg font-black text-gray-700 dark:text-gray-300">
                  {dateRange
                    ? `${new Date(
                        dateRange.startDate
                      ).getFullYear()} - ${new Date(
                        dateRange.endDate
                      ).getFullYear()}`
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-gray-800 rounded-3xl p-8 border-2 border-emerald-200 dark:border-emerald-700">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              🎯 Target Goal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Grow your total portfolio value to:
            </p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(targetValue)}
            </p>
            {targetReturnPercentage && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold mt-2">
                Target Return: +{targetReturnPercentage.toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden">
          <button
            onClick={() => setRulesExpanded(!rulesExpanded)}
            className="w-full px-6 py-4 text-left hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span
                  className={`text-slate-600 dark:text-slate-400 font-bold transition-transform duration-400 ${
                    rulesExpanded ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Game Rules
              </h3>
            </div>
          </button>
          <div
            className={`overflow-hidden transition-all duration-400 ease-in-out ${
              rulesExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-8 pb-8 pt-1">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></span>
                  <span>
                    You have <strong>60 seconds</strong> to trade shares of a
                    real stock
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></span>
                  <span>The stock price changes five times every second</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></span>
                  <span>
                    Reach the target portfolio value to win and climb the
                    leaderboard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></span>
                  <span>
                    Be below the par{" "}
                    <Tooltip content="Average Buy Price">ABP</Tooltip> and par{" "}
                    <Tooltip content="Price Per Trade">PPT</Tooltip> for extra
                    points
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={isLoading}
          className={`mt-8 w-full font-medium text-lg py-4 px-8 rounded-3xl floating-button bounce-click transition-all duration-200 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed text-gray-600"
              : "bg-emerald-500 hover:bg-emerald-600 text-white"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              {loadingText || "Loading..."}
            </div>
          ) : (
            "Start Challenge"
          )}
        </button>
      </div>
    </div>
  );
}

export default GameModal;
