/**
 * Service for managing leaderboard data in Supabase
 */

import { supabase } from '../lib/supabase';
import type { LeaderboardRow } from '../lib/supabase';

export interface LeaderboardEntry {
  id?: string;
  day: number;
  name: string;
  final_value: number;
  percentage_change_of_value: number;
  avg_buy: number;
  ppt: number;
  num_tries: number;
}

/**
 * Create a new leaderboard entry in Supabase
 */
export const createLeaderboardEntry = async (
  entry: LeaderboardEntry
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{
        day: entry.day,
        name: entry.name,
        final_value: entry.final_value,
        percentage_change_of_value: entry.percentage_change_of_value,
        avg_buy: entry.avg_buy,
        ppt: entry.ppt,
        num_tries: entry.num_tries,
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating leaderboard entry:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Exception creating leaderboard entry:', error);
    return null;
  }
};

/**
 * Update an existing leaderboard entry in Supabase
 */
export const updateLeaderboardEntry = async (
  id: string,
  updates: Partial<LeaderboardEntry>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('leaderboard')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating leaderboard entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating leaderboard entry:', error);
    return false;
  }
};

/**
 * Get a specific leaderboard entry by ID
 */
export const getLeaderboardEntryById = async (
  id: string
): Promise<LeaderboardRow | null> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching leaderboard entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching leaderboard entry:', error);
    return null;
  }
};

/**
 * Get leaderboard entries for a specific day, sorted by final_value descending
 */
export const getLeaderboardForDay = async (
  day: number,
  limit: number = 100
): Promise<LeaderboardRow[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('day', day)
      .order('final_value', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard for day:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching leaderboard for day:', error);
    return [];
  }
};

/**
 * Get user's rank for a specific day
 */
export const getUserRankForDay = async (
  userId: string,
  day: number
): Promise<number | null> => {
  try {
    // Get all entries for the day, sorted by final_value
    const entries = await getLeaderboardForDay(day, 10000);
    
    // Find the user's entry and return their rank (1-indexed)
    const userIndex = entries.findIndex(entry => entry.id === userId);
    
    if (userIndex === -1) {
      return null;
    }
    
    return userIndex + 1;
  } catch (error) {
    console.error('Exception getting user rank:', error);
    return null;
  }
};

/**
 * Get the top N entries across all days (optional: filter by day)
 */
export const getTopLeaderboardEntries = async (
  limit: number = 10,
  day?: number
): Promise<LeaderboardRow[]> => {
  try {
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('final_value', { ascending: false })
      .limit(limit);

    if (day !== undefined) {
      query = query.eq('day', day);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching top leaderboard entries:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching top leaderboard entries:', error);
    return [];
  }
};

