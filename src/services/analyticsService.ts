/**
 * Analytics service for tracking user events
 * Tracks page views, game starts, and game completions
 */

import { supabase } from '../lib/supabase';

export type EventType = 
  | 'page_view' 
  | 'game_started' 
  | 'game_completed' 
  | 'leaderboard_viewed' 
  | 'name_entered' 
  | 'results_copied' 
  | 'leaderboard_clicked' 
  | 'play_again_clicked'
  | 'header_leaderboard_clicked'
  | 'header_results_clicked'
  | 'header_help_clicked'
  | 'header_theme_toggled'
  | 'modal_close_clicked'
  | 'modal_start_clicked'
  | 'modal_play_again_clicked'
  | 'modal_rules_toggled'
  | 'modal_leaderboard_clicked'
  | 'modal_results_clicked';

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

/**
 * Track leaderboard viewed
 */
export const trackLeaderboardViewed = (day?: number): void => {
  trackEvent('leaderboard_viewed', day);
};

/**
 * Track user entering their name for leaderboard
 */
export const trackNameEntered = (day?: number, nameLength?: number): void => {
  trackEvent('name_entered', day, { 
    name_length: nameLength 
  });
};

/**
 * Track results copied to clipboard (sharing)
 */
export const trackResultsCopied = (day: number, won: boolean, finalValue?: number): void => {
  trackEvent('results_copied', day, { 
    won,
    final_value: finalValue 
  });
};

/**
 * Track leaderboard button clicked from end game modal
 */
export const trackLeaderboardClicked = (day: number, won: boolean): void => {
  trackEvent('leaderboard_clicked', day, { 
    won 
  });
};

/**
 * Track play again button clicked from end game modal
 */
export const trackPlayAgainClicked = (day: number, won: boolean): void => {
  trackEvent('play_again_clicked', day, { 
    won 
  });
};

// ============================================================================
// Header Analytics
// ============================================================================

/**
 * Track leaderboard button clicked in header
 */
export const trackHeaderLeaderboardClicked = (): void => {
  trackEvent('header_leaderboard_clicked');
};

/**
 * Track results/share button clicked in header
 */
export const trackHeaderResultsClicked = (gameState?: string, hasPlayedToday?: boolean): void => {
  trackEvent('header_results_clicked', undefined, { 
    game_state: gameState,
    has_played_today: hasPlayedToday
  });
};

/**
 * Track help button clicked in header
 */
export const trackHeaderHelpClicked = (): void => {
  trackEvent('header_help_clicked');
};

/**
 * Track theme toggle in header
 */
export const trackHeaderThemeToggled = (newTheme: 'light' | 'dark'): void => {
  trackEvent('header_theme_toggled', undefined, { 
    new_theme: newTheme
  });
};

// ============================================================================
// GameModal Analytics
// ============================================================================

/**
 * Track close button clicked in game modal
 */
export const trackModalCloseClicked = (gameState?: string, hasPlayedToday?: boolean): void => {
  trackEvent('modal_close_clicked', undefined, { 
    game_state: gameState,
    has_played_today: hasPlayedToday
  });
};

/**
 * Track start challenge button clicked in game modal
 */
export const trackModalStartClicked = (day?: number): void => {
  trackEvent('modal_start_clicked', day);
};

/**
 * Track play again button clicked in game modal
 */
export const trackModalPlayAgainClicked = (hasPlayedToday?: boolean): void => {
  trackEvent('modal_play_again_clicked', undefined, { 
    has_played_today: hasPlayedToday
  });
};

/**
 * Track rules accordion toggled in game modal
 */
export const trackModalRulesToggled = (expanded: boolean, gameState?: string): void => {
  trackEvent('modal_rules_toggled', undefined, { 
    expanded,
    game_state: gameState
  });
};

/**
 * Track leaderboard button clicked in game modal
 */
export const trackModalLeaderboardClicked = (hasPlayedToday?: boolean): void => {
  trackEvent('modal_leaderboard_clicked', undefined, { 
    has_played_today: hasPlayedToday
  });
};

/**
 * Track results button clicked in game modal
 */
export const trackModalResultsClicked = (hasPlayedToday?: boolean): void => {
  trackEvent('modal_results_clicked', undefined, { 
    has_played_today: hasPlayedToday
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

