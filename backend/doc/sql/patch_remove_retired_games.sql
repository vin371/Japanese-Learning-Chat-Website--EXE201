-- ============================================================
-- Xóa vĩnh viễn các game đã ngừng phát triển (chạy trên Supabase SQL Editor)
-- Slugs: sentence-builder, pvp-vocabulary, multiple-choice,
--        flashcard-vocabulary, flashcard-battle
-- ============================================================

BEGIN;

-- Gỡ tham chiếu tùy chọn (FK ON DELETE SET NULL nếu đã apply missing_fks)
UPDATE daily_challenges
SET game_id = NULL, updated_at = NOW()
WHERE game_id IN (
  SELECT id FROM games
  WHERE slug IN (
    'sentence-builder',
    'pvp-vocabulary',
    'multiple-choice',
    'flashcard-vocabulary',
    'flashcard-battle'
  )
);

UPDATE leaderboard_periods
SET game_id = NULL
WHERE game_id IN (
  SELECT id FROM games
  WHERE slug IN (
    'sentence-builder',
    'pvp-vocabulary',
    'multiple-choice',
    'flashcard-vocabulary',
    'flashcard-battle'
  )
);

-- Xóa game (CASCADE → question_sets, questions, score_configs, sessions, pvp_rooms nếu FK đã có)
DELETE FROM games
WHERE slug IN (
  'sentence-builder',
  'pvp-vocabulary',
  'multiple-choice',
  'flashcard-vocabulary',
  'flashcard-battle'
);

COMMIT;

-- Kiểm tra sau khi chạy:
-- SELECT slug, name FROM games ORDER BY sort_order;
