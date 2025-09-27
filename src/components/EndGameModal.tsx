import { useState } from "react";
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
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

function EndGameModal({
  isWinner,
  stockInfo,
  dateRange,
  gameParameters,
  parPerformance,
  playerStats,
  onClose,
  formatCurrency,
}: EndGameModalProps) {
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Calculate player's Profit Per Trade (PPT)
  const playerProfitPerTrade =
    playerStats.totalSharesBought > 0
      ? (playerStats.finalValue - gameParameters.startingCash) /
        playerStats.totalSharesBought
      : 0;

  // Debug PPT values
  console.log("EndGameModal PPT Debug:", {
    playerProfitPerTrade,
    parProfitPerTrade: parPerformance.parProfitPerTrade,
    playerStats: {
      finalValue: playerStats.finalValue,
      totalSharesBought: playerStats.totalSharesBought,
    },
    gameParameters: {
      startingCash: gameParameters.startingCash,
    },
  });

  const generateShareText = (): string => {
    // Generate date-based game number (days since epoch)
    const today = new Date();
    const epoch = new Date("2024-01-01");
    const daysSinceEpoch = Math.floor(
      (today.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24)
    );
    const gameNumber = daysSinceEpoch;

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
    const shareText = `Tradle #${gameNumber} ${performanceEmojis.join("")}
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

  const handleShare = async () => {
    const shareText = generateShareText();

    if (navigator.share) {
      // Use native share API if available (mobile)
      await navigator.share({
        title: "Tradle - Daily Stock Challenge",
        text: shareText,
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const returnPercent =
    ((playerStats.finalValue - gameParameters.startingCash) /
      gameParameters.startingCash) *
    100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm bg-opacity-20"></div>

      {/* Modal */}
      <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-4 sm:p-8 max-w-sm sm:max-w-md w-full max-h-full overflow-y-auto my-4">
        {/* Results Summary */}
        <div className="space-y-8 mb-8">
          {/* Stock Reveal - Main Focus */}
          <div className="bg-slate-100 dark:bg-slate-800 border-2 border-emerald-200 rounded-3xl p-8">
            <div className="text-center mb-4">
              <div
                className={`inline-flex items-center gap-1 px-4 py-2 rounded-full font-semibold text-sm ${
                  isWinner
                    ? "bg-emerald-500 dark:bg-emerald-600 text-gray-800 dark:text-gray-200"
                    : "bg-orange-500 dark:bg-orange-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                {isWinner ? "🎉 You broke the bank!" : "💸 Try again tomorrow"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-800 dark:text-gray-200 mb-2">
                {stockInfo.symbol}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400 font-semibold mb-2">
                {stockInfo.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stockInfo.sector} •{" "}
                {new Date(dateRange.startDate).getFullYear()}-
                {new Date(dateRange.endDate).getFullYear()}
              </div>
            </div>
          </div>

          {/* Share Section - Secondary Focus */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">
              Share Your Result
            </h2>

            {/* Performance Emojis Preview */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-lg mb-1">
                  {playerStats.totalSharesBought === 0
                    ? "⬛"
                    : playerStats.averageBuyPrice <=
                      parPerformance.parAverageBuyPrice
                    ? "🟩"
                    : "🟥"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  PPT
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg mb-1">
                  {playerStats.finalValue >= gameParameters.targetValue
                    ? "✅"
                    : "❌"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Target
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleShare}
                disabled={shareSuccess}
                className={`font-bold py-3 px-6 rounded-3xl floating-button bounce-click transition-all duration-200 ${
                  shareSuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {shareSuccess ? "Copied!" : "Share"}
              </button>

              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generateShareText());
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className={`font-bold py-3 px-6 rounded-3xl floating-button bounce-click transition-all duration-200 ${
                  copySuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-600 hover:bg-gray-700 text-white"
                }`}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Detailed Results - Collapseable */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="w-full px-6 py-4 text-left hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span
                    className={`text-slate-600 dark:text-slate-400 font-bold transition-transform duration-400 ${
                      detailsExpanded ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  Detailed Results
                </h3>
              </div>
            </button>
            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${
                detailsExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-8 pb-8 pt-1">
                <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      Final Value
                    </p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      {formatCurrency(playerStats.finalValue)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        returnPercent >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {returnPercent >= 0 ? "+" : ""}
                      {returnPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      Target
                    </p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      {formatCurrency(gameParameters.targetValue)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isWinner
                          ? "text-emerald-600 dark:text-emerald-400"
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
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                          Average Buy Price
                        </p>
                        <div className="space-y-1">
                          <p
                            className={`font-medium text-sm ${
                              playerStats.averageBuyPrice <=
                              parPerformance.parAverageBuyPrice
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {formatCurrency(playerStats.averageBuyPrice)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Par:{" "}
                            {formatCurrency(parPerformance.parAverageBuyPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                          Profit Per Trade
                        </p>
                        <div className="space-y-1">
                          <p
                            className={`font-medium text-sm ${
                              isNaN(parPerformance.parProfitPerTrade) ||
                              playerProfitPerTrade >=
                                parPerformance.parProfitPerTrade
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {formatCurrency(playerProfitPerTrade)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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

        {/* Close Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="font-bold py-4 px-8 rounded-3xl floating-button bounce-click transition-all duration-200 bg-gray-600 hover:bg-gray-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndGameModal;
