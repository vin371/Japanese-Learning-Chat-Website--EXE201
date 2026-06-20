-- Xóa vĩnh viễn Daily Challenge (game slug: daily-challenge)
BEGIN;

UPDATE game_sessions SET daily_challenge_id = NULL WHERE daily_challenge_id IS NOT NULL;

DELETE FROM user_daily_challenges;
DELETE FROM daily_challenges;

DELETE FROM games WHERE slug = 'daily-challenge';

COMMIT;

-- Kiểm tra:
-- SELECT slug FROM games WHERE slug = 'daily-challenge';
