/**
 * Analytics service for tracking user events
 * Tracks page views, game starts, and game completions
 */

import { supabase } from '../lib/supabase';

export type EventType = 'page_view' | 'game_started' | 'game_completed';

export interface AnalyticsEvent {
  event_type: EventType;
  user_uuid: string;
  day?: number;
  session_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Get or create a persistent user UUID
 */
const getUserUUID = (): string => {
  const UUID_KEY = 'tradle_user_uuid';
  let userUUID = localStorage.getItem(UUID_KEY);
  
  if (!userUUID) {
    userUUID = crypto.randomUUID();
    localStorage.setItem(UUID_KEY, userUUID);
  }
  
  return userUUID;
};

/**
 * Get or create a session ID (expires after 30 minutes of inactivity)
 */
const getSessionId = (): string => {
  const SESSION_KEY = 'tradle_session_id';
  const SESSION_TIMESTAMP_KEY = 'tradle_session_timestamp';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  const lastTimestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
  
  // Create new session if none exists or if session expired
  if (!sessionId || !lastTimestamp || 
      Date.now() - parseInt(lastTimestamp) > SESSION_DURATION) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  
  // Update last activity timestamp
  sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  
  return sessionId;
};

/**
 * Track an analytics event
 * This is fire-and-forget - errors won't break the app
 */
export const trackEvent = async (
  eventType: EventType,
  day?: number,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const userUUID = getUserUUID();
    const sessionId = getSessionId();

    const event: AnalyticsEvent = {
      event_type: eventType,
      user_uuid: userUUID,
      session_id: sessionId,
      day,
      metadata,
    };

    // Fire and forget - don't await or block UI
    supabase
      .from('analytics_events')
      .insert([event])
      .then(({ error }) => {
        if (error) {
          console.error('Analytics tracking error:', error);
        }
      });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.error('Analytics tracking exception:', error);
  }
};

/**
 * Track page view (call once on app load)
 */
export const trackPageView = (): void => {
  trackEvent('page_view');
};

/**
 * Track game started
 */
export const trackGameStarted = (day: number): void => {
  trackEvent('game_started', day);
};

/**
 * Track game completed
 */
export const trackGameCompleted = (
  day: number, 
  finalValue: number, 
  won: boolean,
  numTries?: number
): void => {
  trackEvent('game_completed', day, { 
    final_value: finalValue, 
    won,
    num_tries: numTries 
  });
};

// ============================================================================
// Analytics Queries (for future dashboard/admin panel)
// ============================================================================

export interface AnalyticsSummary {
  date: string;
  unique_visitors: number;
  unique_players: number;
  total_games_started: number;
  total_games_completed: number;
  unique_sessions: number;
  conversion_rate: number; // players / visitors
  completion_rate: number; // completed / started
}

/**
 * Get daily analytics summary from materialized view
 * Useful for building an admin dashboard
 */
export const getAnalyticsSummary = async (
  days: number = 30
): Promise<AnalyticsSummary[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(days);

    if (error) throw error;

    return (data || []).map(row => ({
      date: row.date,
      unique_visitors: row.unique_visitors || 0,
      unique_players: row.unique_players || 0,
      total_games_started: row.total_games_started || 0,
      total_games_completed: row.total_games_completed || 0,
      unique_sessions: row.unique_sessions || 0,
      conversion_rate: row.unique_visitors > 0 
        ? (row.unique_players / row.unique_visitors) * 100 
        : 0,
      completion_rate: row.total_games_started > 0
        ? (row.total_games_completed / row.total_games_started) * 100
        : 0,
    }));
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return [];
  }
};

/**
 * Get real-time stats (not from materialized view)
 * More resource intensive but always current
 */
export const getRealTimeStats = async (
  dateFrom: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // default: last 7 days
): Promise<{
  uniqueVisitors: number;
  uniquePlayers: number;
  totalGamesStarted: number;
  totalGamesCompleted: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, user_uuid')
      .gte('created_at', dateFrom.toISOString());

    if (error) throw error;

    const events = data || [];
    const visitorsSet = new Set<string>();
    const playersSet = new Set<string>();
    let gamesStarted = 0;
    let gamesCompleted = 0;

    events.forEach(event => {
      if (event.event_type === 'page_view') {
        visitorsSet.add(event.user_uuid);
      } else if (event.event_type === 'game_started') {
        gamesStarted++;
      } else if (event.event_type === 'game_completed') {
        playersSet.add(event.user_uuid);
        gamesCompleted++;
      }
    });

    return {
      uniqueVisitors: visitorsSet.size,
      uniquePlayers: playersSet.size,
      totalGamesStarted: gamesStarted,
      totalGamesCompleted: gamesCompleted,
    };
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    return {
      uniqueVisitors: 0,
      uniquePlayers: 0,
      totalGamesStarted: 0,
      totalGamesCompleted: 0,
    };
  }
};

