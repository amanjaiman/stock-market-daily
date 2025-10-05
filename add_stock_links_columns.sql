-- SQL script to add wiki_link and stock_link columns to stocks and daily_challenges tables
-- Run this in your Supabase SQL Editor

-- Add columns to stocks table
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS wiki_link TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS stock_link TEXT;

-- Add columns to daily_challenges table
ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS wiki_link TEXT;
ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS stock_link TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stocks' 
AND column_name IN ('wiki_link', 'stock_link')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_challenges' 
AND column_name IN ('wiki_link', 'stock_link')
ORDER BY column_name;

