import React from "react";

interface HeaderProps {
  onLeaderboardClick?: () => void;
  onResultsClick?: () => void;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
  gameState?: "pre-game" | "countdown" | "active" | "ended";
  hasPlayedToday?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onLeaderboardClick,
  onResultsClick,
  onHelpClick,
  onSettingsClick,
  gameState,
  hasPlayedToday = false,
}) => {
  return (
    <header className="w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Empty */}
          <div className="w-32"></div>

          {/* Center - Game Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="game-title text-3xl font-black text-slate-800 dark:text-slate-100">
              Day
              <span className="game-title text-green-600 dark:text-green-400">
                Tradle
              </span>
            </h1>
          </div>

          {/* Right side - Icon buttons */}
          <div className="flex items-center gap-2 w-32 justify-end">
            {/* Leaderboard */}
            <button
              onClick={onLeaderboardClick}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              title="Leaderboard"
            >
              <svg
                className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
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
              onClick={
                gameState === "ended" || hasPlayedToday
                  ? onResultsClick
                  : undefined
              }
              className={`p-2 rounded-lg transition-colors duration-200 group ${
                gameState === "ended" || hasPlayedToday
                  ? "hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
              title={
                gameState === "ended" || hasPlayedToday
                  ? "Results & Share"
                  : "Complete today's challenge to view results"
              }
              disabled={!(gameState === "ended" || hasPlayedToday)}
            >
              <svg
                className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
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

            {/* Help */}
            <button
              onClick={onHelpClick}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              title="Help"
            >
              <svg
                className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              title="Settings"
            >
              <svg
                className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
