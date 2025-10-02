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
  onPlayAgain: () => void;
  onClose: () => void;
  stockInfo?: StockInfo | null;
  dateRange?: DateRange | null;
  isClosing?: boolean;
  hasPlayedToday?: boolean;
  onLeaderboardClick?: () => void;
  onResultsClick?: () => void;
}

import { useState } from "react";
import Tooltip from "./Tooltip";

function GameModal({
  startingCash,
  startingStockPrice,
  targetValue,
  targetReturnPercentage,
  onStart,
  onPlayAgain,
  onClose,
  stockInfo,
  dateRange,
  isClosing = false,
  hasPlayedToday = false,
  onLeaderboardClick,
  onResultsClick,
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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing
          ? "animate-out fade-out duration-200"
          : "animate-in fade-in duration-300"
      }`}
    >
      {/* Modal */}
      <div
        className={`relative bg-[#f2f2f2] dark:bg-slate-900 border-1 border-gray-200 dark:border-gray-700 shadow-sm rounded-3xl p-4 sm:p-8 max-w-sm sm:max-w-md w-full max-h-full overflow-y-auto my-4 transition-all duration-300 ${
          isClosing
            ? "animate-out zoom-out-95 slide-out-to-bottom-4 duration-200"
            : "animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="game-title text-3xl font-black text-slate-700 dark:text-slate-300 mb-2">
            Day
            <span className="game-title text-green-600 dark:text-green-400">
              Tradle
            </span>
          </h1>

          {/* Icons for returning players */}
          {hasPlayedToday && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {/* Leaderboard */}
              <button
                onClick={onLeaderboardClick}
                className="p-2 rounded-lg hover:bg-[#e6e6e6] dark:hover:bg-slate-700 transition-colors duration-200 group"
                title="Leaderboard"
              >
                <svg
                  className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>

              {/* Results/Share */}
              <button
                onClick={onResultsClick}
                className="p-2 rounded-lg hover:bg-[#e6e6e6] dark:hover:bg-slate-700 transition-colors duration-200 group"
                title="Results & Share"
              >
                <svg
                  className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="space-y-8 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-3">
              Today's Challenge
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold">
                    Cash
                  </p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                    {formatCurrency(startingCash)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold">
                    Stock Price
                  </p>
                  <p className="text-lg font-black text-green-600 dark:text-green-400">
                    ${startingStockPrice}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold">
                    Shares
                  </p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                    0
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-slate-500 dark:text-slate-400 font-semibold">
                  Stock Category
                </p>
                <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                  {stockInfo?.sector || "Mystery"}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-slate-500 dark:text-slate-400 font-semibold">
                  Time Period
                </p>
                <p className="text-lg font-black text-slate-700 dark:text-slate-300">
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

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              🎯 Target Portfolio Value
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              Grow your total portfolio value to:
            </p>
            <p className="text-3xl font-black text-green-600 dark:text-green-400">
              {formatCurrency(targetValue)}
            </p>
            {targetReturnPercentage && (
              <p className="text-sm text-green-700 dark:text-green-300 font-semibold mt-2">
                Target Return: +{targetReturnPercentage.toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
          <button
            onClick={() => setRulesExpanded(!rulesExpanded)}
            className="w-full px-6 py-4 text-left hover:bg-[#e6e6e6] dark:hover:bg-slate-700 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg
                  className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-400 ${
                    rulesExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
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
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <span>
                    You have <strong>60 seconds</strong> to trade shares of a
                    real stock
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <span>The stock price changes five times every second</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <span>
                    Reach the target portfolio value to win and climb the
                    leaderboard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></span>
                  <span>
                    Try to beat the par{" "}
                    <Tooltip content="Average Buy Price">ABP</Tooltip> and par{" "}
                    <Tooltip content="Price Per Trade">PPT</Tooltip> for extra
                    points
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {hasPlayedToday ? (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={onClose}
              className="font-medium py-4 px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Close
            </button>
            <button
              onClick={onPlayAgain}
              className="font-medium py-4 px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-green-500 hover:bg-green-600 text-white"
            >
              Play again
            </button>
          </div>
        ) : (
          <button
            onClick={onStart}
            className="mt-8 w-full font-medium text-lg py-4 px-8 rounded-3xl floating-button bounce-click transition-all duration-200 bg-green-500 hover:bg-green-600 text-white"
          >
            Start Challenge
          </button>
        )}
      </div>
    </div>
  );
}

export default GameModal;
