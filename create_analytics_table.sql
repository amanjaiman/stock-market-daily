-- Analytics tracking system for stock-market-daily
-- Run this in your Supabase SQL Editor

-- Drop existing objects if they exist (for clean re-runs)
DROP MATERIALIZED VIEW IF EXISTS daily_analytics;
DROP INDEX IF EXISTS idx_analytics_event_type;
DROP INDEX IF EXISTS idx_analytics_user_uuid;
DROP INDEX IF EXISTS idx_analytics_created_at;
DROP INDEX IF EXISTS idx_analytics_day;
DROP TABLE IF EXISTS analytics_events;

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'page_view', 'game_started', 'game_completed'
  user_uuid TEXT NOT NULL, -- Client-generated UUID from localStorage
  day INTEGER, -- Daily challenge day number (for game events)
  session_id TEXT, -- Optional: track sessions
  metadata JSONB, -- Flexible field for extra data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user_uuid ON analytics_events(user_uuid);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_day ON analytics_events(day);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (so users can track events)
CREATE POLICY "Allow anonymous inserts" ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated reads (for admin dashboard)
CREATE POLICY "Allow authenticated reads" ON analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Materialized view for quick stats (refresh daily)
CREATE MATERIALIZED VIEW daily_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as unique_visitors,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as unique_players,
  COUNT(*) FILTER (WHERE event_type = 'game_started') as total_games_started,
  COUNT(*) FILTER (WHERE event_type = 'game_completed') as total_games_completed,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as unique_sessions
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Index on materialized view
CREATE UNIQUE INDEX idx_daily_analytics_date ON daily_analytics(date);

-- Grant access to anon role for materialized view
GRANT SELECT ON daily_analytics TO anon;

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('analytics_events', 'daily_analytics')
ORDER BY tablename;

-- Show sample data structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_events'
ORDER BY ordinal_position;

