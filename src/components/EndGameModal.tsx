import { useState, useEffect } from "react";
import type { StockSymbol, DateRange } from "../hooks";
import type { GameParameters, ParPerformance } from "../utils/gameCalculations";

interface EndGameModalProps {
  isWinner: boolean;
  stockInfo: StockSymbol;
  dateRange: DateRange;
  gameParameters: GameParameters;
  parPerformance: ParPerformance;
  playerStats: {
    finalValue: number;
    averageBuyPrice: number;
    totalSharesBought: number;
    cash: number;
    shares: number;
    currentStockPrice: number;
  };
  day: number;
  onClose: () => void;
  onLeaderboardClick: () => void;
  formatCurrency: (amount: number) => string;
}

function EndGameModal({
  isWinner,
  stockInfo,
  dateRange,
  gameParameters,
  parPerformance,
  playerStats,
  day,
  onClose,
  onLeaderboardClick,
  formatCurrency,
}: EndGameModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Calculate player's Profit Per Trade (PPT)
  const playerProfitPerTrade =
    playerStats.totalSharesBought > 0
      ? (playerStats.finalValue - gameParameters.startingCash) /
        playerStats.totalSharesBought
      : 0;

  const generateShareText = (): string => {
    // Compare player performance to par and generate emoji indicators
    const performanceEmojis: string[] = [];

    // 1. Average Buy Price Performance (lower is better)
    if (playerStats.totalSharesBought === 0) {
      performanceEmojis.push("⬛"); // Didn't trade
    } else if (
      playerStats.averageBuyPrice <= parPerformance.parAverageBuyPrice
    ) {
      performanceEmojis.push("🟩"); // Better than par
    } else {
      performanceEmojis.push("🟥"); // Worse than par
    }

    // 2. Profit Per Trade vs Par (higher PPT is better)
    if (playerStats.totalSharesBought === 0) {
      performanceEmojis.push("⬛"); // Didn't trade
    } else if (
      isNaN(parPerformance.parProfitPerTrade) ||
      playerProfitPerTrade >= parPerformance.parProfitPerTrade
    ) {
      performanceEmojis.push("🟩"); // Better or equal PPT (or par is invalid)
    } else {
      performanceEmojis.push("🟥"); // Worse PPT than par
    }

    // 3. Target Achievement
    if (playerStats.finalValue >= gameParameters.targetValue) {
      performanceEmojis.push("✅"); // Hit target
    } else {
      performanceEmojis.push("❌"); // Missed target
    }

    // Calculate return percentage
    const returnPercent =
      ((playerStats.finalValue - gameParameters.startingCash) /
        gameParameters.startingCash) *
      100;

    // Build share text
    const shareText = `Tradle #${day} ${performanceEmojis.join("")}
Final Value: ${formatCurrency(playerStats.finalValue)} (${
      returnPercent >= 0 ? "+" : ""
    }${returnPercent.toFixed(1)}%)${
      playerStats.totalSharesBought > 0
        ? `\nPPT: ${formatCurrency(playerProfitPerTrade)}`
        : ""
    }

Play at tradle.game`;

    return shareText;
  };

  const returnPercent =
    ((playerStats.finalValue - gameParameters.startingCash) /
      gameParameters.startingCash) *
    100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className="relative bg-[#f2f2f2] dark:bg-slate-900 border-1 border-gray-200 dark:border-gray-700 shadow-sm rounded-3xl p-4 sm:p-8 max-w-sm sm:max-w-md w-full max-h-full overflow-y-auto my-4 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Results Summary */}
        <div className="space-y-4 sm:space-y-8 mb-6 sm:mb-8">
          {/* Stock Reveal - Main Focus */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-200 mb-2">
                {stockInfo.symbol}
              </div>
              <div className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-semibold">
                {stockInfo.name}
              </div>
              <div className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                {stockInfo.sector} •{" "}
                {new Date(dateRange.startDate).getFullYear()}-
                {new Date(dateRange.endDate).getFullYear()}
              </div>
            </div>
          </div>

          {/* Share Section - Secondary Focus */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-3 sm:mb-4 text-center">
              Share Your Result
            </h2>

            {/* Performance Emojis Preview */}
            <div className="flex justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="text-center">
                <div className="text-lg mb-1">
                  {playerStats.totalSharesBought === 0
                    ? "⬛"
                    : playerStats.averageBuyPrice <=
                      parPerformance.parAverageBuyPrice
                    ? "🟩"
                    : "🟥"}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  Buy Price
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg mb-1">
                  {playerStats.totalSharesBought === 0
                    ? "⬛"
                    : isNaN(parPerformance.parProfitPerTrade) ||
                      playerProfitPerTrade >= parPerformance.parProfitPerTrade
                    ? "🟩"
                    : "🟥"}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  PPT
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg mb-1">
                  {playerStats.finalValue >= gameParameters.targetValue
                    ? "✅"
                    : "❌"}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  Target
                </div>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 justify-center">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generateShareText());
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className={`font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-3xl floating-button bounce-click transition-all duration-200 text-sm sm:text-base ${
                  copySuccess
                    ? "bg-green-500 text-white"
                    : "bg-slate-600 hover:bg-slate-700 text-white"
                }`}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>

              <button
                onClick={onLeaderboardClick}
                className="font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base"
              >
                Leaderboard
              </button>
            </div>
          </div>

          {/* Detailed Results - Collapseable */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-[#e6e6e6] dark:hover:bg-slate-700 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-400 ${
                      detailsExpanded ? "rotate-90" : ""
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
                <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                  Detailed Results
                </h3>
              </div>
            </button>
            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${
                detailsExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 sm:px-8 pb-4 sm:pb-8 pt-1">
                <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-semibold">
                      Final Value
                    </p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(playerStats.finalValue)}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        returnPercent >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {returnPercent >= 0 ? "+" : ""}
                      {returnPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-semibold">
                      Target
                    </p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(gameParameters.targetValue)}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        isWinner
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {isWinner ? "Hit" : "Missed"}
                    </p>
                  </div>
                </div>
                {playerStats.totalSharesBought > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-semibold">
                          Average Buy Price
                        </p>
                        <div className="space-y-1">
                          <p
                            className={`font-medium text-sm ${
                              playerStats.averageBuyPrice <=
                              parPerformance.parAverageBuyPrice
                                ? "text-green-600 dark:text-green-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {formatCurrency(playerStats.averageBuyPrice)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Par:{" "}
                            {formatCurrency(parPerformance.parAverageBuyPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-semibold">
                          Profit Per Trade
                        </p>
                        <div className="space-y-1">
                          <p
                            className={`font-medium text-sm ${
                              isNaN(parPerformance.parProfitPerTrade) ||
                              playerProfitPerTrade >=
                                parPerformance.parProfitPerTrade
                                ? "text-green-600 dark:text-green-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {formatCurrency(playerProfitPerTrade)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Par:{" "}
                            {isNaN(parPerformance.parProfitPerTrade)
                              ? "$0.00"
                              : formatCurrency(
                                  parPerformance.parProfitPerTrade
                                )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-slate-600 hover:bg-slate-700 text-white text-sm sm:text-base"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndGameModal;
