-- Seed question sets cho PvP games thiếu bộ đề (flashcard-battle, pvp-vocabulary).
-- Sao chép từ flashcard-vocabulary nếu game đích chưa có set active.

DO $$
DECLARE
  src_game_id INT;
  src_set_id  INT;
  tgt_slug    TEXT;
  tgt_game_id INT;
  new_set_id  INT;
BEGIN
  SELECT g.id INTO src_game_id
  FROM games g
  WHERE g.slug = 'flashcard-vocabulary' AND COALESCE(g.is_active, TRUE) = TRUE
  LIMIT 1;

  IF src_game_id IS NULL THEN
    RAISE NOTICE 'flashcard-vocabulary not found — skip';
    RETURN;
  END IF;

  SELECT gqs.id INTO src_set_id
  FROM game_question_sets gqs
  WHERE gqs.game_id = src_game_id AND COALESCE(gqs.is_active, TRUE) = TRUE
  ORDER BY gqs.sort_order, gqs.id
  LIMIT 1;

  IF src_set_id IS NULL THEN
    RAISE NOTICE 'No source question set — skip';
    RETURN;
  END IF;

  FOREACH tgt_slug IN ARRAY ARRAY['flashcard-battle', 'pvp-vocabulary']
  LOOP
    SELECT g.id INTO tgt_game_id
    FROM games g
    WHERE g.slug = tgt_slug AND COALESCE(g.is_active, TRUE) = TRUE
    LIMIT 1;

    IF tgt_game_id IS NULL THEN
      RAISE NOTICE 'Game % not found', tgt_slug;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM game_question_sets gqs
      WHERE gqs.game_id = tgt_game_id AND COALESCE(gqs.is_active, TRUE) = TRUE
    ) THEN
      RAISE NOTICE 'Game % already has question set', tgt_slug;
      CONTINUE;
    END IF;

    INSERT INTO game_question_sets
      (game_id, level_id, name, description, questions_per_round, time_per_question_s, is_active, sort_order, created_at, updated_at)
    SELECT tgt_game_id, gqs.level_id, gqs.name, gqs.description, gqs.questions_per_round, gqs.time_per_question_s,
           TRUE, gqs.sort_order, NOW(), NOW()
    FROM game_question_sets gqs
    WHERE gqs.id = src_set_id
    RETURNING id INTO new_set_id;

    INSERT INTO game_questions
      (set_id, question_type, question_text, hint_text, audio_url, image_url, options_json, correct_index,
       explanation, base_score, difficulty, is_active, sort_order, created_at, updated_at)
    SELECT new_set_id, q.question_type, q.question_text, q.hint_text, q.audio_url, q.image_url, q.options_json,
           q.correct_index, q.explanation, q.base_score, q.difficulty, q.is_active, q.sort_order, NOW(), NOW()
    FROM game_questions q
    WHERE q.set_id = src_set_id AND COALESCE(q.is_active, TRUE) = TRUE;

    RAISE NOTICE 'Seeded question set for % (set_id=%)', tgt_slug, new_set_id;
  END LOOP;
END $$;
