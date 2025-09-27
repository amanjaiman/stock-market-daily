import { useDailyChallenge } from "../hooks";

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
  const {
    challenge,
    isLoading: challengeLoading,
    error: challengeError,
    refreshChallenge,
  } = useDailyChallenge();

  const handleRefreshChallenge = () => {
    refreshChallenge();
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

        {/* Challenge Management */}
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h3 className="text-xs font-bold mb-2">Challenge Management</h3>

          <button
            onClick={handleRefreshChallenge}
            disabled={challengeLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded-md transition-colors"
          >
            {challengeLoading ? "Refreshing..." : "Refresh Daily Challenge"}
          </button>
        </div>

        {/* Current Challenge Status */}
        <div className="space-y-2 text-xs">
          {/* Challenge Info */}
          {challenge && (
            <>
              <div className="p-2 bg-blue-900 rounded">
                <div className="text-blue-300">
                  Today's Challenge (Day {challenge.day}):
                </div>
                <div className="font-medium text-blue-100">
                  {challenge.tickerSymbol} - {challenge.companyName}
                </div>
                <div className="text-blue-200">{challenge.sector}</div>
              </div>

              <div className="p-2 bg-gray-700 rounded">
                <div className="text-gray-400">Date Range:</div>
                <div className="text-white">
                  {challenge.startDate} to {challenge.endDate}
                </div>
                <div className="text-gray-300">
                  {challenge.tradingDays} trading days ({challenge.startYear}-
                  {challenge.endYear})
                </div>
              </div>

              <div className="p-2 bg-gray-700 rounded">
                <div className="text-gray-400">Game Data:</div>
                <div className="text-white">
                  {challenge.priceData.length} game points
                </div>
                <div className="text-gray-300">
                  ${challenge.initialStockPrice.toFixed(2)} starting price
                </div>
              </div>

              <div className="p-2 bg-gray-700 rounded">
                <div className="text-gray-400">Game Parameters:</div>
                <div className="text-white">
                  ${challenge.startingCash} → ${challenge.targetValue} target
                </div>
                <div className="text-gray-300">
                  {challenge.targetReturnPercentage.toFixed(1)}% target return
                </div>
              </div>
            </>
          )}

          {/* Error Messages */}
          {challengeError && (
            <div className="p-2 bg-red-900 rounded text-red-100 text-xs">
              Challenge Error: {challengeError}
            </div>
          )}

          {/* Loading State */}
          {challengeLoading && (
            <div className="p-2 bg-yellow-900 rounded text-yellow-100 text-xs">
              Loading daily challenge...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperMode;
