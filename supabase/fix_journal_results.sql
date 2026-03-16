-- Fix journal_trades where result doesn't match PnL sign
-- Run this in your Supabase SQL Editor

-- First, let's see what needs fixing (preview)
SELECT
  id,
  date,
  instrument,
  pnl,
  result,
  CASE
    WHEN pnl > 0 THEN 'win'
    WHEN pnl < 0 THEN 'loss'
    ELSE 'breakeven'
  END AS correct_result,
  CASE
    WHEN (pnl > 0 AND result != 'win') OR
         (pnl < 0 AND result != 'loss') OR
         (pnl = 0 AND result != 'breakeven')
    THEN 'MISMATCH'
    ELSE 'OK'
  END AS status
FROM journal_trades
WHERE
  (pnl > 0 AND result != 'win') OR
  (pnl < 0 AND result != 'loss') OR
  (pnl = 0 AND result != 'breakeven')
ORDER BY date DESC;

-- Now fix them all
UPDATE journal_trades
SET result = CASE
  WHEN pnl > 0 THEN 'win'
  WHEN pnl < 0 THEN 'loss'
  ELSE 'breakeven'
END
WHERE
  (pnl > 0 AND result != 'win') OR
  (pnl < 0 AND result != 'loss') OR
  (pnl = 0 AND result != 'breakeven');

-- Verify: Should return 0 rows now
SELECT COUNT(*) as remaining_mismatches
FROM journal_trades
WHERE
  (pnl > 0 AND result != 'win') OR
  (pnl < 0 AND result != 'loss') OR
  (pnl = 0 AND result != 'breakeven');
