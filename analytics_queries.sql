-- ============================================================================
-- ANALYTICS QUERIES FOR STOCK-MARKET-DAILY
-- Copy and paste these into your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- DAILY STATS (Quick Overview)
-- ============================================================================

-- Today's stats
SELECT 
  CURRENT_DATE as date,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as unique_visitors,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as unique_players,
  COUNT(*) FILTER (WHERE event_type = 'game_started') as games_started,
  COUNT(*) FILTER (WHERE event_type = 'game_completed') as games_completed,
  ROUND((COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed')::numeric / 
         NULLIF(COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view'), 0)) * 100, 2) as conversion_rate_pct
FROM analytics_events
WHERE created_at >= CURRENT_DATE;


-- ============================================================================
-- WEEKLY TRENDS (Last 7 Days)
-- ============================================================================

-- Week over week comparison
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as visitors,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as players,
  COUNT(*) FILTER (WHERE event_type = 'game_started') as started,
  COUNT(*) FILTER (WHERE event_type = 'game_completed') as completed,
  ROUND((COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed')::numeric / 
         NULLIF(COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view'), 0)) * 100, 1) as conversion_pct
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;


-- ============================================================================
-- MONTHLY SUMMARY (Using Materialized View)
-- ============================================================================

-- Last 30 days from materialized view (fast query)
SELECT 
  date,
  unique_visitors,
  unique_players,
  total_games_started,
  total_games_completed,
  unique_sessions,
  ROUND((unique_players::numeric / NULLIF(unique_visitors, 0)) * 100, 1) as conversion_pct,
  ROUND((total_games_completed::numeric / NULLIF(total_games_started, 0)) * 100, 1) as completion_pct
FROM daily_analytics
ORDER BY date DESC
LIMIT 30;


-- ============================================================================
-- PLAYER ENGAGEMENT
-- ============================================================================

-- Average attempts per player
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_uuid) as unique_players,
  COUNT(*) as total_attempts,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_uuid), 0), 2) as avg_attempts_per_player
FROM analytics_events
WHERE event_type = 'game_completed'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Players by number of attempts (last 7 days)
WITH player_attempts AS (
  SELECT 
    user_uuid,
    COUNT(*) as num_attempts
  FROM analytics_events
  WHERE event_type = 'game_completed'
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY user_uuid
)
SELECT 
  num_attempts,
  COUNT(*) as num_players,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 1) as percentage
FROM player_attempts
GROUP BY num_attempts
ORDER BY num_attempts;


-- ============================================================================
-- WIN/LOSS ANALYSIS
-- ============================================================================

-- Win rate by day
SELECT 
  day,
  COUNT(*) as total_completions,
  COUNT(*) FILTER (WHERE (metadata->>'won')::boolean = true) as wins,
  COUNT(*) FILTER (WHERE (metadata->>'won')::boolean = false) as losses,
  ROUND((COUNT(*) FILTER (WHERE (metadata->>'won')::boolean = true)::numeric / 
         NULLIF(COUNT(*), 0)) * 100, 1) as win_rate_pct,
  ROUND(AVG((metadata->>'final_value')::numeric), 2) as avg_final_value
FROM analytics_events
WHERE event_type = 'game_completed'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;


-- ============================================================================
-- SESSION ANALYSIS
-- ============================================================================

-- Session duration and engagement
SELECT 
  DATE(MIN(created_at)) as session_date,
  COUNT(DISTINCT session_id) as total_sessions,
  ROUND(AVG(session_duration_minutes), 1) as avg_duration_minutes,
  ROUND(AVG(events_per_session), 1) as avg_events_per_session
FROM (
  SELECT 
    session_id,
    COUNT(*) as events_per_session,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as session_duration_minutes
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY session_id
  HAVING COUNT(*) > 1
) session_stats
GROUP BY DATE(MIN(created_at))
ORDER BY session_date DESC;


-- ============================================================================
-- RETENTION & RETURNING USERS
-- ============================================================================

-- User retention (users who return multiple days)
WITH user_visit_days AS (
  SELECT 
    user_uuid,
    COUNT(DISTINCT DATE(created_at)) as days_visited
  FROM analytics_events
  WHERE event_type = 'page_view'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_uuid
)
SELECT 
  CASE 
    WHEN days_visited = 1 THEN '1 day (new)'
    WHEN days_visited BETWEEN 2 AND 3 THEN '2-3 days'
    WHEN days_visited BETWEEN 4 AND 7 THEN '4-7 days'
    ELSE '8+ days (highly engaged)'
  END as engagement_level,
  COUNT(*) as num_users,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 1) as percentage
FROM user_visit_days
GROUP BY 
  CASE 
    WHEN days_visited = 1 THEN '1 day (new)'
    WHEN days_visited BETWEEN 2 AND 3 THEN '2-3 days'
    WHEN days_visited BETWEEN 4 AND 7 THEN '4-7 days'
    ELSE '8+ days (highly engaged)'
  END
ORDER BY MIN(days_visited);


-- ============================================================================
-- FUNNEL ANALYSIS
-- ============================================================================

-- Complete funnel from page view to game completion
WITH funnel AS (
  SELECT 
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as step1_visited,
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_started') as step2_started,
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as step3_completed
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT 
  'Visited Site' as step,
  step1_visited as users,
  100.0 as percentage,
  NULL::numeric as drop_off_pct
FROM funnel
UNION ALL
SELECT 
  'Started Game' as step,
  step2_started as users,
  ROUND((step2_started::numeric / NULLIF(step1_visited, 0)) * 100, 1) as percentage,
  ROUND(((step1_visited - step2_started)::numeric / NULLIF(step1_visited, 0)) * 100, 1) as drop_off_pct
FROM funnel
UNION ALL
SELECT 
  'Completed Game' as step,
  step3_completed as users,
  ROUND((step3_completed::numeric / NULLIF(step1_visited, 0)) * 100, 1) as percentage,
  ROUND(((step2_started - step3_completed)::numeric / NULLIF(step2_started, 0)) * 100, 1) as drop_off_pct
FROM funnel;


-- ============================================================================
-- PEAK USAGE TIMES
-- ============================================================================

-- Traffic by hour of day (UTC)
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_utc,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as visitors,
  COUNT(*) FILTER (WHERE event_type = 'game_started') as games_started,
  COUNT(*) FILTER (WHERE event_type = 'game_completed') as games_completed
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_utc;

-- Traffic by day of week
SELECT 
  TO_CHAR(created_at, 'Day') as day_of_week,
  EXTRACT(DOW FROM created_at) as day_num,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as avg_daily_visitors,
  COUNT(*) FILTER (WHERE event_type = 'game_completed') as avg_daily_completions
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY day_num;


-- ============================================================================
-- GROWTH METRICS
-- ============================================================================

-- Week over week growth
WITH weekly_stats AS (
  SELECT 
    DATE_TRUNC('week', created_at)::date as week_start,
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as visitors,
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as players
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '8 weeks'
  GROUP BY DATE_TRUNC('week', created_at)::date
)
SELECT 
  week_start,
  visitors,
  players,
  LAG(visitors) OVER (ORDER BY week_start) as prev_week_visitors,
  ROUND(((visitors - LAG(visitors) OVER (ORDER BY week_start))::numeric / 
         NULLIF(LAG(visitors) OVER (ORDER BY week_start), 0)) * 100, 1) as visitor_growth_pct,
  ROUND(((players - LAG(players) OVER (ORDER BY week_start))::numeric / 
         NULLIF(LAG(players) OVER (ORDER BY week_start), 0)) * 100, 1) as player_growth_pct
FROM weekly_stats
ORDER BY week_start DESC;


-- ============================================================================
-- MAINTENANCE & MONITORING
-- ============================================================================

-- Table size and row count
SELECT 
  pg_size_pretty(pg_total_relation_size('analytics_events')) as table_size,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as rows_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as rows_last_30_days,
  MIN(created_at) as oldest_event,
  MAX(created_at) as newest_event
FROM analytics_events;

-- Event type distribution
SELECT 
  event_type,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_uuid) as unique_users,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 1) as percentage
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total_events DESC;

-- Recent events (for debugging)
SELECT 
  event_type,
  day,
  metadata,
  created_at
FROM analytics_events
ORDER BY created_at DESC
LIMIT 20;


-- ============================================================================
-- REFRESH MATERIALIZED VIEW
-- ============================================================================

-- Run this daily to update the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;

-- Check last refresh time
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_stat_user_tables
WHERE relname = 'daily_analytics';

