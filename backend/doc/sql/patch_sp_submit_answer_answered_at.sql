-- Fix: game_session_answers.answered_at NOT NULL (PostgreSQL không có DEFAULT như SQL Server)

CREATE OR REPLACE FUNCTION sp_submit_answer(
  p_session_id     INTEGER,
  p_question_id    INTEGER,
  p_question_order INTEGER,
  p_chosen_index   INTEGER,
  p_response_ms    INTEGER,
  p_power_up_used  VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(is_correct BOOLEAN, correct_index INTEGER, score_earned INTEGER,
              combo INTEGER, speed_bonus INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_is_correct      BOOLEAN := FALSE;
  v_correct_index   INTEGER;
  v_score_earned    INTEGER := 0;
  v_combo_now       INTEGER := 0;
  v_double_active   BOOLEAN := FALSE;
  v_session_total_q INTEGER;
  v_ppt             INTEGER;
  v_ord             INTEGER;
BEGIN
  SELECT NULLIF(gs.total_questions, 0) INTO v_session_total_q
  FROM game_sessions gs WHERE gs.id = p_session_id;

  v_ppt := CASE
    WHEN v_session_total_q IS NULL OR v_session_total_q < 1 THEN 10
    ELSE ROUND(100.0 / v_session_total_q)::INTEGER END;
  IF v_ppt < 1 THEN v_ppt := 1; END IF;

  SELECT q.correct_index INTO v_correct_index
  FROM game_questions q WHERE q.id = p_question_id;

  IF p_chosen_index IS NOT NULL AND v_correct_index IS NOT NULL
     AND p_chosen_index = v_correct_index THEN
    v_is_correct := TRUE;
  END IF;

  v_ord := (SELECT COALESCE(MAX(gsa.question_order), 0)
            FROM game_session_answers gsa WHERE gsa.session_id = p_session_id);
  v_combo_now := 0;
  WHILE v_ord >= 1 LOOP
    IF EXISTS (
      SELECT 1 FROM game_session_answers gsa
      WHERE gsa.session_id = p_session_id
        AND gsa.question_order = v_ord
        AND gsa.is_correct = TRUE
    ) THEN
      v_combo_now := v_combo_now + 1;
    ELSE
      EXIT;
    END IF;
    v_ord := v_ord - 1;
  END LOOP;

  IF v_is_correct THEN
    v_combo_now := v_combo_now + 1;
    IF p_power_up_used = 'double-points' THEN v_double_active := TRUE; END IF;
    v_score_earned := v_ppt * CASE WHEN v_double_active THEN 2 ELSE 1 END;
  ELSE
    v_combo_now := 0;
  END IF;

  INSERT INTO game_session_answers
    (session_id, question_id, question_order, chosen_index, is_correct,
     response_ms, score_earned, combo_at_answer, power_up_used, answered_at)
  VALUES
    (p_session_id, p_question_id, p_question_order, p_chosen_index, v_is_correct,
     p_response_ms, v_score_earned, v_combo_now, p_power_up_used, NOW());

  RETURN QUERY SELECT v_is_correct, v_correct_index, v_score_earned, v_combo_now, 0;
END;
$$;

ALTER TABLE game_session_answers
  ALTER COLUMN answered_at SET DEFAULT NOW();
