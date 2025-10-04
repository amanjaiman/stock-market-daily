-- SQL script to allow duplicate names on the leaderboard
-- Run this in your Supabase SQL Editor

-- First, check if there's a unique constraint on the name column
-- This will show all constraints on the leaderboard table
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'leaderboard' AND n.nspname = 'public';

-- If you see a unique constraint on 'name' or on 'name, day', drop it:
-- Replace 'constraint_name_here' with the actual constraint name from the query above

-- Example: If constraint is on name alone
-- ALTER TABLE leaderboard DROP CONSTRAINT constraint_name_here;

-- Example: If constraint is on (name, day) composite
-- ALTER TABLE leaderboard DROP CONSTRAINT constraint_name_here;

-- Common constraint names to check for:
-- ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_name_key;
-- ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_name_day_key;
-- ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS unique_name_per_day;

-- After removing the constraint, verify it's gone:
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'leaderboard' AND n.nspname = 'public';

