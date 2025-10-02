/**
 * Utility functions for managing leaderboard data in localStorage and Supabase
 */

import {
  createLeaderboardEntry,
  updateLeaderboardEntry,
} from '../services/leaderboardService';

export interface LeaderboardEntry {
  day: number;
  name: string;
  final_value: number;
  percentage_change_of_value: number;
  avg_buy: number;
  ppt: number;
  num_tries: number;
}

const LEADERBOARD_KEY = "tradle_leaderboard";
const USER_NAME_KEY = "tradle_user_name";
const USER_UUID_KEY = "tradle_user_uuid";

/**
 * Get the user's stored UUID from localStorage
 */
export const getUserUUID = (): string | null => {
  return localStorage.getItem(USER_UUID_KEY);
};

/**
 * Save the user's UUID to localStorage
 */
export const saveUserUUID = (uuid: string): void => {
  localStorage.setItem(USER_UUID_KEY, uuid);
};

/**
 * Get the user's stored name from localStorage
 */
export const getUserName = (): string | null => {
  return localStorage.getItem(USER_NAME_KEY);
};

/**
 * Save the user's name to localStorage and update all existing Anonymous entries
 */
export const saveUserName = (name: string): void => {
  const trimmedName = name.trim();
  localStorage.setItem(USER_NAME_KEY, trimmedName);
  
  // Update all existing Anonymous entries with the new name
  const entries = getLeaderboardEntries();
  let updated = false;
  
  entries.forEach((entry) => {
    if (entry.name === "Anonymous") {
      entry.name = trimmedName;
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  }
};

/**
 * Get all leaderboard entries from localStorage
 */
export const getLeaderboardEntries = (): LeaderboardEntry[] => {
  const data = localStorage.getItem(LEADERBOARD_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data) as LeaderboardEntry[];
  } catch (error) {
    console.error("Error parsing leaderboard data:", error);
    return [];
  }
};

/**
 * Get leaderboard entry for a specific day
 */
export const getEntryForDay = (day: number): LeaderboardEntry | null => {
  const entries = getLeaderboardEntries();
  return entries.find((entry) => entry.day === day) || null;
};

/**
 * Save or update a leaderboard entry
 * Updates the entry if the new final_value is better than the existing one
 * Automatically cleans up entries from previous days
 * Also syncs with Supabase
 */
export const saveLeaderboardEntry = async (
  day: number,
  finalValue: number,
  percentageChange: number,
  avgBuy: number,
  ppt: number
): Promise<void> => {
  const userName = getUserName() || "Anonymous";
  const userUUID = getUserUUID();

  const entries = getLeaderboardEntries();
  
  // Remove entries from different days (only keep current day)
  const currentDayEntries = entries.filter((entry) => entry.day === day);

  const existingEntryIndex = currentDayEntries.findIndex((entry) => entry.day === day);

  let updatedEntries: LeaderboardEntry[];
  let shouldUpdateSupabase = false;
  let isNewEntry = false;

  if (existingEntryIndex >= 0) {
    // Update existing entry for today
    const existingEntry = currentDayEntries[existingEntryIndex];
    
    // Check if this is a better score (higher final value)
    if (finalValue > existingEntry.final_value) {
      currentDayEntries[existingEntryIndex] = {
        day,
        name: userName,
        final_value: finalValue,
        percentage_change_of_value: percentageChange,
        avg_buy: avgBuy,
        ppt: ppt,
        num_tries: existingEntry.num_tries + 1,
      };
      shouldUpdateSupabase = true;
    } else {
      // Increment num_tries even if score didn't improve
      currentDayEntries[existingEntryIndex].num_tries += 1;
      shouldUpdateSupabase = true; // Always update to sync num_tries
    }
    updatedEntries = currentDayEntries;
  } else {
    // Create new entry for today
    updatedEntries = [{
      day,
      name: userName,
      final_value: finalValue,
      percentage_change_of_value: percentageChange,
      avg_buy: avgBuy,
      ppt: ppt,
      num_tries: 1,
    }];
    isNewEntry = true;
    shouldUpdateSupabase = true;
  }

  // Save to localStorage
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedEntries));

  // Sync with Supabase
  try {
    if (isNewEntry) {
      // Create new entry in Supabase
      const newUUID = await createLeaderboardEntry({
        day,
        name: userName,
        final_value: finalValue,
        percentage_change_of_value: percentageChange,
        avg_buy: avgBuy,
        ppt: ppt,
        num_tries: 1,
      });

      if (newUUID) {
        saveUserUUID(newUUID);
      }
    } else if (shouldUpdateSupabase && userUUID) {
      // Update existing entry in Supabase
      const currentEntry = updatedEntries[existingEntryIndex];
      await updateLeaderboardEntry(userUUID, {
        name: userName,
        final_value: currentEntry.final_value,
        percentage_change_of_value: currentEntry.percentage_change_of_value,
        avg_buy: currentEntry.avg_buy,
        ppt: currentEntry.ppt,
        num_tries: currentEntry.num_tries,
      });
    } else if (shouldUpdateSupabase && !userUUID) {
      // We have a local entry but no UUID - check if we can find it in Supabase
      // or create a new one
      const currentEntry = updatedEntries[existingEntryIndex];
      const newUUID = await createLeaderboardEntry({
        day: currentEntry.day,
        name: currentEntry.name,
        final_value: currentEntry.final_value,
        percentage_change_of_value: currentEntry.percentage_change_of_value,
        avg_buy: currentEntry.avg_buy,
        ppt: currentEntry.ppt,
        num_tries: currentEntry.num_tries,
      });

      if (newUUID) {
        saveUserUUID(newUUID);
      }
    }
  } catch (error) {
    console.error("Error syncing with Supabase:", error);
    // Continue anyway - local storage is saved
  }
};

/**
 * Clear all leaderboard data (for testing/debugging)
 */
export const clearLeaderboardData = (): void => {
  localStorage.removeItem(LEADERBOARD_KEY);
};

/**
 * Clear user name (for testing/debugging)
 */
export const clearUserName = (): void => {
  localStorage.removeItem(USER_NAME_KEY);
};

/**
 * Clear user UUID (for testing/debugging)
 */
export const clearUserUUID = (): void => {
  localStorage.removeItem(USER_UUID_KEY);
};

