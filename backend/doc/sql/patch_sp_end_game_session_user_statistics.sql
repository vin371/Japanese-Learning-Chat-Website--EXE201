-- Fix: user_statistics.lessons_completed NOT NULL khi sp_end_game_session cũ INSERT thiếu cột.
-- Chạy trên Supabase/PostgreSQL sau khi deploy backend mới.

ALTER TABLE user_statistics
  ALTER COLUMN lessons_completed SET DEFAULT 0;

UPDATE user_statistics
SET lessons_completed = 0
WHERE lessons_completed IS NULL;

ALTER TABLE user_statistics
  ALTER COLUMN quizzes_completed SET DEFAULT 0;

UPDATE user_statistics
SET quizzes_completed = 0
WHERE quizzes_completed IS NULL;

CREATE OR REPLACE FUNCTION sp_end_game_session(p_session_id INTEGER)
RETURNS TABLE(final_score INTEGER, correct_count INTEGER, total_questions INTEGER,
              accuracy_percent DECIMAL, max_combo INTEGER, time_spent_seconds INTEGER,
              exp_earned INTEGER, xu_earned INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_user_id     INTEGER;
  v_game_id     INTEGER;
  v_total_q     INTEGER;
  v_total_score INTEGER;
  v_correct     INTEGER;
  v_max_combo   INTEGER;
  v_time_spent  INTEGER;
  v_xu_reward   INTEGER;
  v_exp_reward  INTEGER;
  v_accuracy    DECIMAL(5,2);
BEGIN
  SELECT user_id, game_id, total_questions
  INTO v_user_id, v_game_id, v_total_q
  FROM game_sessions WHERE id = p_session_id;

  SELECT
    COALESCE(SUM(score_earned), 0),
    COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0),
    COALESCE(MAX(combo_at_answer), 0),
    CASE WHEN COUNT(*) > 1
      THEN EXTRACT(EPOCH FROM (MAX(answered_at) - MIN(answered_at)))::INTEGER ELSE 0 END
  INTO v_total_score, v_correct, v_max_combo, v_time_spent
  FROM game_session_answers WHERE session_id = p_session_id;

  IF v_total_score > 100 THEN v_total_score := 100; END IF;
  v_accuracy := CASE WHEN v_total_q > 0
    THEN CAST(v_correct AS DECIMAL(5,2)) / v_total_q * 100 ELSE 0 END;

  v_exp_reward := LEAST(v_correct * 10, 100);
  v_xu_reward  := GREATEST(v_correct, 0);

  UPDATE game_sessions SET
    score              = v_total_score,
    correct_count      = v_correct,
    max_combo          = v_max_combo,
    time_spent_seconds = v_time_spent,
    exp_earned         = v_exp_reward,
    xu_earned          = v_xu_reward,
    ended_at           = NOW()
  WHERE id = p_session_id;

  UPDATE users SET
    exp = exp + v_exp_reward,
    xu  = xu  + v_xu_reward
  WHERE id = v_user_id;

  BEGIN
    INSERT INTO user_statistics (
      user_id, lessons_completed, games_played, quizzes_completed, total_exp, updated_at
    ) VALUES (v_user_id, 0, 1, 0, v_exp_reward, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      games_played = user_statistics.games_played + 1,
      total_exp    = user_statistics.total_exp + v_exp_reward,
      updated_at   = NOW();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    INSERT INTO user_activities_log (
      user_id, activity_type, entity_type, entity_id, score, created_at
    ) VALUES (v_user_id, 'game_completed', 'game', v_game_id, v_total_score, NOW());
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN QUERY SELECT v_total_score, v_correct, v_total_q,
                      v_accuracy, v_max_combo, v_time_spent,
                      v_exp_reward, v_xu_reward;
END;
$$;
