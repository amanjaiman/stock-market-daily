import { useState, useEffect } from "react";
import {
  getUserName,
  saveUserName,
  getUserUUID,
} from "../utils/leaderboardStorage";
import {
  getLeaderboardForDay,
  getUserRankForDay,
} from "../services/leaderboardService";
import type { LeaderboardRow } from "../lib/supabase";
import { useDailyChallenge } from "../hooks";

interface LeaderboardModalProps {
  onClose: () => void;
}

function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isEnteringName, setIsEnteringName] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { challenge } = useDailyChallenge();

  useEffect(() => {
    // Check if user already has a name stored
    const storedName = getUserName();
    if (storedName) {
      setUserName(storedName);
      setIsEnteringName(false);
    } else {
      setIsEnteringName(true);
    }
  }, []);

  // Fetch leaderboard data when user is set and we have challenge data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!userName || !challenge) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch leaderboard entries for current day
        const entries = await getLeaderboardForDay(challenge.day, 100);
        setLeaderboardData(entries);

        // Get user's rank
        const userUUID = getUserUUID();
        if (userUUID) {
          const rank = await getUserRankForDay(userUUID, challenge.day);
          setUserRank(rank);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isEnteringName) {
      fetchLeaderboardData();
    }
  }, [userName, challenge, isEnteringName]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();

    if (trimmedName.length < 4) {
      alert("Name must be at least 4 characters long");
      return;
    }

    if (trimmedName.length > 15) {
      alert("Name must be 15 characters or less");
      return;
    }

    saveUserName(trimmedName);
    setUserName(trimmedName);
    setIsEnteringName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-[#f2f2f2] dark:bg-slate-900 border-1 border-gray-200 dark:border-gray-700 shadow-sm rounded-3xl p-4 sm:p-8 max-w-lg sm:max-w-2xl w-full max-h-full overflow-y-auto my-4 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out">
        {/* Name Entry Form */}
        {isEnteringName && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                Leaderboard
              </h2>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6">
                <label
                  htmlFor="userName"
                  className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2"
                >
                  Display Name
                </label>
                <input
                  id="userName"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter a display name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl bg-[#f2f2f2] dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none font-medium"
                  autoFocus
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  4-15 characters
                </p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-slate-600 hover:bg-slate-700 text-white text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-3xl floating-button bounce-click transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Leaderboard View */}
        {!isEnteringName && userName && (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 text-center">
                Leaderboard
              </h2>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Playing As
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                    {userName}
                  </p>
                </div>

                {challenge && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Challenge Day
                    </p>
                    <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                      #{challenge.day}
                    </p>
                  </div>
                )}

                {userRank !== null && (
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Your Rank
                    </p>
                    <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                      #{userRank}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-500 dark:text-slate-400 mt-4">
                    Loading leaderboard...
                  </p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600"
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
                  </div>
                  <p className="font-semibold mb-2">No Entries Yet</p>
                  <p className="text-sm">
                    Be the first to complete today's challenge!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-950 border-b-2 border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-12 sm:w-16">
                          Rank
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          Value
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          Avg PPT
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-12 sm:w-16">
                          Tries
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {leaderboardData.slice(0, 50).map((entry, index) => {
                        const isCurrentUser = getUserUUID() === entry.id;
                        const metTarget =
                          challenge &&
                          entry.final_value >= challenge.targetValue;
                        return (
                          <tr
                            key={entry.id}
                            className={`${
                              isCurrentUser
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : "hover:bg-gray-100 dark:hover:bg-slate-800/80"
                            } transition-colors`}
                          >
                            <td className="px-2 sm:px-6 py-2 sm:py-2.5 font-medium text-slate-700 dark:text-slate-300">
                              {index === 0 && "🥇"}
                              {index === 1 && "🥈"}
                              {index === 2 && "🥉"}
                              {index > 2 && `#${index + 1}`}
                            </td>
                            <td className="px-2 sm:px-6 py-2 sm:py-2.5 font-medium text-slate-900 dark:text-slate-100">
                              {entry.name}
                              {isCurrentUser && (
                                <span className="ml-1 sm:ml-2 text-xs text-blue-600 dark:text-blue-400">
                                  (You)
                                </span>
                              )}
                            </td>
                            <td className="px-2 sm:px-6 py-2 sm:py-2.5 text-right whitespace-nowrap">
                              <div
                                className={`font-semibold ${
                                  metTarget
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-orange-600 dark:text-orange-400"
                                }`}
                              >
                                ${entry.final_value.toFixed(0)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {entry.percentage_change_of_value >= 0
                                  ? "+"
                                  : ""}
                                {entry.percentage_change_of_value.toFixed(1)}%
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-6 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              ${entry.ppt.toFixed(2)}
                            </td>
                            <td className="px-2 sm:px-6 py-2 sm:py-2.5 text-right text-slate-600 dark:text-slate-400">
                              {entry.num_tries}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="font-medium py-3 sm:py-4 px-6 sm:px-8 rounded-3xl floating-button bounce-click transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardModal;
