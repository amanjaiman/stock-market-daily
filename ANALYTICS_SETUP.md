# Analytics Setup - Quick Start

You now have a complete analytics tracking system! Here's what was set up:

## 📁 Files Created

1. **`create_analytics_table.sql`** - Database migration to create tables
2. **`src/services/analyticsService.ts`** - Analytics tracking service
3. **`ANALYTICS_GUIDE.md`** - Complete documentation
4. **`analytics_queries.sql`** - Ready-to-use SQL queries
5. **`ANALYTICS_SETUP.md`** - This file

## 📝 Files Modified

1. **`src/App.tsx`** - Integrated tracking for page views, game starts, and completions
2. **`src/lib/supabase.ts`** - Added TypeScript interfaces for analytics tables

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Database Tables

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and run `create_analytics_table.sql`

### Step 2: Deploy Your App

```bash
npm run build
# Deploy to your hosting (Netlify, Vercel, etc.)
```

### Step 3: Verify It's Working

Wait a few hours, then check your data:

```sql
-- Run this in Supabase SQL Editor
SELECT
  COUNT(DISTINCT user_uuid) as unique_visitors,
  COUNT(*) as total_events
FROM analytics_events
WHERE created_at >= CURRENT_DATE;
```

## 📊 What Gets Tracked

### Automatically Tracked Events:

| Event              | When                | Data Captured                                           |
| ------------------ | ------------------- | ------------------------------------------------------- |
| **page_view**      | User visits site    | user_uuid, session_id                                   |
| **game_started**   | User starts playing | user_uuid, session_id, day                              |
| **game_completed** | User finishes game  | user_uuid, session_id, day, final_value, won, num_tries |

### Privacy-Friendly:

- ✅ No personally identifiable information (PII)
- ✅ Client-generated UUIDs only
- ✅ No IP addresses or user agents
- ✅ Anonymous tracking

## 🔍 Quick Analytics Queries

### Today's Stats

```sql
SELECT
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as visitors,
  COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as players
FROM analytics_events
WHERE created_at >= CURRENT_DATE;
```

### Last 7 Days Summary

```sql
SELECT * FROM daily_analytics
ORDER BY date DESC
LIMIT 7;
```

### Conversion Rate

```sql
WITH stats AS (
  SELECT
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'page_view') as visitors,
    COUNT(DISTINCT user_uuid) FILTER (WHERE event_type = 'game_completed') as players
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  visitors,
  players,
  ROUND((players::numeric / NULLIF(visitors, 0)) * 100, 2) as conversion_rate_pct
FROM stats;
```

## 🛠️ Daily Maintenance

Set up automatic refresh of the `daily_analytics` view:

```sql
-- Run this once to schedule daily refresh at 1 AM UTC
SELECT cron.schedule(
  'refresh-daily-analytics',
  '0 1 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics$$
);
```

Or refresh manually:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
```

## 📈 Key Metrics You Can Track

1. **Unique Visitors** - How many people visit your site
2. **Unique Players** - How many people play at least one game
3. **Conversion Rate** - % of visitors who become players
4. **Completion Rate** - % of started games that finish
5. **Retention** - Users returning multiple days
6. **Win Rate** - % of games won per challenge
7. **Engagement** - Average attempts per player
8. **Session Duration** - How long users stay

## 📚 Full Documentation

- **`ANALYTICS_GUIDE.md`** - Complete guide with advanced queries
- **`analytics_queries.sql`** - 20+ pre-built queries ready to run

## 🔐 Security Notes

- Analytics events use **Row Level Security (RLS)**
- Anonymous users can **INSERT** (for tracking)
- Authenticated users can **SELECT** (for admin dashboard)
- No sensitive data is stored

## 🎯 What's Next?

1. **Run the SQL migration** (Step 1 above)
2. **Deploy your app** - tracking will start automatically
3. **Wait 24 hours** for data to accumulate
4. **Run queries** from `analytics_queries.sql` to see your stats
5. **Optional**: Build an admin dashboard using `getAnalyticsSummary()`

## 💡 Tips

- Check analytics daily to understand user behavior
- Use conversion rate to optimize your game onboarding
- Track win rates to adjust difficulty
- Monitor retention to see if users come back
- Use session data to optimize game length

## 🐛 Troubleshooting

### No events being tracked?

1. Check browser console for errors
2. Verify Supabase env vars are set
3. Confirm RLS policies allow anonymous inserts
4. Check Network tab for failed requests

### Can't query data?

1. Make sure you're authenticated in Supabase
2. Check RLS policies
3. Verify the migration ran successfully

---

**Questions?** See `ANALYTICS_GUIDE.md` for detailed documentation.

**Need help?** Check the Supabase docs: https://supabase.com/docs
