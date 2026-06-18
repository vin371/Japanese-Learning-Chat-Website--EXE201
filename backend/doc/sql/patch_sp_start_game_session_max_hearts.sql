-- Fix PostgreSQL 42702: column reference "max_hearts" is ambiguous
-- RETURNS TABLE output column names shadow bare column refs in plpgsql body.

CREATE OR REPLACE FUNCTION sp_start_game_session(
  p_user_id        INTEGER,
  p_game_slug      VARCHAR(100),
  p_set_id         INTEGER DEFAULT NULL,
  p_question_count INTEGER DEFAULT NULL
)
RETURNS TABLE(session_id INTEGER, max_hearts INTEGER, set_id INTEGER,
              q_id INTEGER, question_type VARCHAR, question_text VARCHAR,
              hint_text VARCHAR, audio_url VARCHAR, image_url VARCHAR,
              options_json TEXT, base_score INTEGER, difficulty SMALLINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_game_id          INTEGER;
  v_max_hearts       INTEGER;
  v_session_id       INTEGER;
  v_actual_set_id    INTEGER := p_set_id;
  v_questions_per_round INTEGER;
  v_n                INTEGER;
  v_avail            INTEGER;
BEGIN
  SELECT g.id, g.max_hearts INTO v_game_id, v_max_hearts
  FROM games g
  WHERE g.slug = p_game_slug AND COALESCE(g.is_active, TRUE) = TRUE;

  IF v_game_id IS NULL THEN
    RAISE EXCEPTION 'Game không tồn tại hoặc chưa active';
  END IF;

  IF v_actual_set_id IS NULL THEN
    SELECT gqs.id, gqs.questions_per_round
    INTO v_actual_set_id, v_questions_per_round
    FROM game_question_sets gqs
    LEFT JOIN users u ON u.id = p_user_id
    WHERE gqs.game_id = v_game_id AND COALESCE(gqs.is_active, TRUE) = TRUE
      AND (u.level_id IS NULL OR gqs.level_id IS NULL OR gqs.level_id = u.level_id)
    ORDER BY
      CASE WHEN u.level_id IS NOT NULL AND gqs.level_id = u.level_id THEN 0
           WHEN gqs.level_id IS NULL THEN 1 ELSE 2 END,
      gqs.sort_order, gqs.id
    LIMIT 1;

    IF v_actual_set_id IS NULL THEN
      SELECT gqs.id, gqs.questions_per_round INTO v_actual_set_id, v_questions_per_round
      FROM game_question_sets gqs
      WHERE gqs.game_id = v_game_id AND COALESCE(gqs.is_active, TRUE) = TRUE
      ORDER BY gqs.sort_order, gqs.id LIMIT 1;
    END IF;
  ELSE
    SELECT gqs.questions_per_round INTO v_questions_per_round
    FROM game_question_sets gqs
    WHERE gqs.id = v_actual_set_id;
  END IF;

  IF v_actual_set_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm được question set';
  END IF;

  SELECT COUNT(*) INTO v_avail
  FROM game_questions q
  WHERE q.set_id = v_actual_set_id AND COALESCE(q.is_active, TRUE) = TRUE;

  IF v_avail < 1 THEN
    RAISE EXCEPTION 'Bộ câu hỏi trống cho set này';
  END IF;

  v_n := COALESCE(v_questions_per_round, 10);
  IF p_question_count IS NOT NULL AND p_question_count > 0 THEN
    v_n := p_question_count;
  END IF;
  IF v_n > v_avail THEN v_n := v_avail; END IF;
  IF v_n < 1 THEN v_n := 1; END IF;

  INSERT INTO game_sessions
    (user_id, game_id, score, max_combo, correct_count, total_questions,
     hearts_remaining, hearts_lost, exp_earned, xu_earned, set_id, started_at)
  VALUES (p_user_id, v_game_id, 0, 0, 0, v_n, v_max_hearts, 0, 0, 0, v_actual_set_id, NOW())
  RETURNING id INTO v_session_id;

  RETURN QUERY
  SELECT v_session_id, v_max_hearts, v_actual_set_id,
         q.id, q.question_type, q.question_text,
         q.hint_text, q.audio_url, q.image_url,
         q.options_json, q.base_score, q.difficulty
  FROM game_questions q
  WHERE q.set_id = v_actual_set_id AND COALESCE(q.is_active, TRUE) = TRUE
  ORDER BY random()
  LIMIT v_n;
END;
$$;
