# Analytics Tracking Guide

This guide explains the analytics tracking system for stock-market-daily.

## Overview

The analytics system tracks three key events:

- **Page Views**: When users visit the site
- **Game Started**: When users start playing a challenge
- **Game Completed**: When users complete a game (regardless of win/loss)

## Setup Instructions

### 1. Create the Database Tables

Run the SQL migration in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and run the contents of: create_analytics_table.sql
```

This creates:

- `analytics_events` table - stores all raw events
- `daily_analytics` materialized view - pre-aggregated daily stats

### 2. Set Up RLS Policies

The migration automatically sets up Row Level Security:

- **Anonymous users** can INSERT events (for tracking)
- **Authenticated users** can SELECT events (for admin dashboard)

### 3. Refresh Materialized View

Set up a daily refresh of the `daily_analytics` view using Supabase Edge Functions or pg_cron:

```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;

-- Set up automatic daily refresh at 1 AM UTC (requires pg_cron extension)
SELECT cron.schedule(
  'refresh-daily-analytics',
  '0 1 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics$$
);
```

## How It Works

### Client-Side Tracking

The app automatically tracks events:

```typescript
// Page view - tracked once on app load
trackPageView();

// Game started - tracked when countdown ends
trackGameStarted(dayNumber);

// Game completed - tracked when game ends
trackGameCompleted(dayNumber, finalValue, won, numTries);
```

### User Identification

- **User UUID**: Persistent UUID stored in `localStorage`

  - Generated on first visit
  - Tracks unique visitors and players across sessions
  - Privacy-friendly (no PII)

- **Session ID**: Temporary UUID stored in `sessionStorage`
  - Expires after 30 minutes of inactivity
  - Tracks user engagement per session

## Querying Analytics

### Quick Stats (Today)

```sql
-- Unique visitors today
SELECT COUNT(DISTINCT user_uuid) as unique_visitors
FROM analytics_events
WHERE event_type = 'page_view'
  AND created_at >= CURRENT_DATE;

-- Unique players today
SELECT COUNT(DISTINCT user_uuid) as unique_players
FROM analytics_events
WHERE event_type = 'game_completed'
  AND created_at >= CURRENT_DATE;

-- Conversion rate today (players / visitors)
WITH stats AS (
  SELECT
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as visitors,
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as players
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE
)
SELECT
  visitors,
  players,
  ROUND((players::numeric / NULLIF(visitors, 0)) * 100, 2) as conversion_rate_pct
FROM stats;
```

### Daily Summary (Last 30 Days)

```sql
-- Using the materialized view for fast queries
SELECT
  date,
  unique_visitors,
  unique_players,
  total_games_started,
  total_games_completed,
  ROUND((unique_players::numeric / NULLIF(unique_visitors, 0)) * 100, 2) as conversion_rate,
  ROUND((total_games_completed::numeric / NULLIF(total_games_started, 0)) * 100, 2) as completion_rate
FROM daily_analytics
ORDER BY date DESC
LIMIT 30;
```

### Advanced Queries

```sql
-- Top performing days (by engagement)
SELECT
  date,
  unique_players,
  total_games_completed,
  ROUND(total_games_completed::numeric / NULLIF(unique_players, 0), 2) as avg_games_per_player
FROM daily_analytics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY unique_players DESC
LIMIT 10;

-- Game completion analysis
SELECT
  day,
  COUNT(*) as total_completions,
  COUNT(*) FILTER (WHERE (metadata->>'won')::boolean = true) as wins,
  COUNT(*) FILTER (WHERE (metadata->>'won')::boolean = false) as losses,
  ROUND(AVG((metadata->>'final_value')::numeric), 2) as avg_final_value
FROM analytics_events
WHERE event_type = 'game_completed'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;

-- Session engagement
SELECT
  session_id,
  COUNT(*) as events,
  MIN(created_at) as session_start,
  MAX(created_at) as session_end,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as session_duration_minutes
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY session_duration_minutes DESC
LIMIT 20;

-- Retention: returning visitors
WITH user_visits AS (
  SELECT
    user_uuid,
    DATE(created_at) as visit_date
  FROM analytics_events
  WHERE event_type = 'page_view'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_uuid, DATE(created_at)
)
SELECT
  COUNT(DISTINCT user_uuid) as total_users,
  COUNT(DISTINCT user_uuid) FILTER (WHERE visit_count > 1) as returning_users,
  ROUND((COUNT(DISTINCT user_uuid) FILTER (WHERE visit_count > 1)::numeric /
         NULLIF(COUNT(DISTINCT user_uuid), 0)) * 100, 2) as retention_rate_pct
FROM (
  SELECT user_uuid, COUNT(*) as visit_count
  FROM user_visits
  GROUP BY user_uuid
) user_stats;
```

## Using the Analytics Service

### In Your Components

```typescript
import {
  trackPageView,
  trackGameStarted,
  trackGameCompleted,
  getAnalyticsSummary,
  getRealTimeStats,
} from "@/services/analyticsService";

// Track events (already integrated in App.tsx)
useEffect(() => {
  trackPageView();
}, []);

// Get analytics data (for admin dashboard)
const stats = await getAnalyticsSummary(30); // Last 30 days
const realTime = await getRealTimeStats(); // Last 7 days
```

### Building an Admin Dashboard

Create a simple admin page to view stats:

```typescript
import { useState, useEffect } from "react";
import { getAnalyticsSummary } from "@/services/analyticsService";

function AnalyticsDashboard() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getAnalyticsSummary(30).then(setStats);
  }, []);

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Visitors</th>
            <th>Players</th>
            <th>Conversion %</th>
            <th>Games Started</th>
            <th>Games Completed</th>
            <th>Completion %</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.unique_visitors}</td>
              <td>{day.unique_players}</td>
              <td>{day.conversion_rate.toFixed(1)}%</td>
              <td>{day.total_games_started}</td>
              <td>{day.total_games_completed}</td>
              <td>{day.completion_rate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Key Metrics

### Unique Visitors

Number of distinct users who visited the site (tracked via UUID)

### Unique Players

Number of distinct users who completed at least one game

### Conversion Rate

Percentage of visitors who became players: `(unique_players / unique_visitors) * 100`

### Completion Rate

Percentage of started games that were completed: `(games_completed / games_started) * 100`

### Average Games per Player

How many attempts users make: `total_games_completed / unique_players`

## Privacy & Performance

- ✅ **Privacy-friendly**: Uses client-generated UUIDs, no PII stored
- ✅ **Non-blocking**: Fire-and-forget tracking, won't slow down app
- ✅ **Lightweight**: Single table + materialized view
- ✅ **Scalable**: Indexed for fast queries
- ✅ **Anonymous**: No authentication required for tracking

## Maintenance

### Clean Up Old Data (Optional)

```sql
-- Delete events older than 90 days
DELETE FROM analytics_events
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

-- Refresh materialized view after cleanup
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
```

### Monitor Table Size

```sql
-- Check table size
SELECT
  pg_size_pretty(pg_total_relation_size('analytics_events')) as table_size,
  COUNT(*) as row_count
FROM analytics_events;
```

## Troubleshooting

### Events Not Being Tracked

1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check RLS policies allow anonymous inserts
4. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Materialized View Not Updating

```sql
-- Check last refresh time
SELECT
  schemaname,
  matviewname,
  last_refresh
FROM pg_stat_user_tables
WHERE relname = 'daily_analytics';

-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
```

### Performance Issues

- Add indexes on frequently queried columns
- Use materialized view instead of querying raw events
- Archive old data to separate table
- Consider partitioning `analytics_events` by date

## Next Steps

1. Run the SQL migration to create tables
2. Deploy your updated app
3. Wait 24 hours for data to accumulate
4. Refresh the materialized view
5. Query your analytics!

For questions or issues, check the [Supabase documentation](https://supabase.com/docs).
