import React, { useEffect, useState } from "react";
import {
  trackHeaderLeaderboardClicked,
  trackHeaderResultsClicked,
  trackHeaderHelpClicked,
  trackHeaderThemeToggled,
} from "../services/analyticsService";

interface HeaderProps {
  onLeaderboardClick?: () => void;
  onResultsClick?: () => void;
  onHelpClick?: () => void;
  gameState?: "pre-game" | "countdown" | "active" | "ended";
  hasPlayedToday?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onLeaderboardClick,
  onResultsClick,
  onHelpClick,
  gameState,
  hasPlayedToday = false,
}) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("theme");
    if (stored) {
      return stored === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Apply theme to root element
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newTheme = !isDark ? "dark" : "light";
    setIsDark(!isDark);
    trackHeaderThemeToggled(newTheme);
  };
  return (
    <header className="w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left spacer - hidden on mobile, matches right side width on desktop */}
          <div className="hidden sm:flex sm:flex-1" />

          {/* Center - Game Title (left-aligned on mobile, centered on larger screens) */}
          <div className="flex-1 sm:flex-none">
            <h1 className="game-title text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
              Day
              <span className="game-title text-green-600 dark:text-green-400">
                Tradle
              </span>
            </h1>
          </div>

          {/* Right side - Icon buttons */}
          <div className="flex items-center gap-1 sm:gap-2 justify-end sm:flex-1">
            {/* Leaderboard */}
            <button
              onClick={() => {
                trackHeaderLeaderboardClicked();
                onLeaderboardClick?.();
              }}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              title="Leaderboard"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
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
                  ? () => {
                      trackHeaderResultsClicked(gameState, hasPlayedToday);
                      onResultsClick?.();
                    }
                  : undefined
              }
              className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 group ${
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
                className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
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
              onClick={() => {
                trackHeaderHelpClicked();
                onHelpClick?.();
              }}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              title="Help"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
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

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                // Sun icon for light mode
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
