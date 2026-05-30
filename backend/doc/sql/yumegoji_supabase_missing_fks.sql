-- ============================================================
-- Yumegoji — Bổ sung Foreign Key còn thiếu (PostgreSQL / Supabase)
-- Chạy SAU:
--   1) yumegoji_supabase.sql (schema + 23 FK gốc)
--   2) seed data part 01 → 13
--   3) yumegoji_supabase_indexes.sql (tùy chọn)
--
-- Idempotent: chạy lại an toàn, bỏ qua FK đã tồn tại.
-- Bước 0 tự NULL/delete dòng orphan (vd. conversations.created_by=21 không có users).
-- Không sửa 23 FK đã có trong yumegoji_supabase.sql.
-- ============================================================

-- ---------- Bước 0: Sửa orphan trước khi thêm FK (seed có user_id 21,23,25... không có trong users) ----------

CREATE OR REPLACE FUNCTION public.yumegoji_fix_orphan_null(
  p_table text, p_column text, p_ref_table text, p_ref_column text DEFAULT 'id'
) RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  n bigint;
BEGIN
  EXECUTE format(
    'UPDATE %I t SET %I = NULL
     WHERE t.%I IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM %I r WHERE r.%I = t.%I)',
    p_table, p_column, p_column, p_ref_table, p_ref_column, p_column
  );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.yumegoji_fix_orphan_delete(
  p_table text, p_column text, p_ref_table text, p_ref_column text DEFAULT 'id'
) RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  n bigint;
BEGIN
  EXECUTE format(
    'DELETE FROM %I t
     WHERE NOT EXISTS (SELECT 1 FROM %I r WHERE r.%I = t.%I)',
    p_table, p_ref_table, p_ref_column, p_column
  );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

DO $cleanup$
DECLARE
  fixes_null text[][] := ARRAY[
    ARRAY['users', 'level_id', 'levels'],
    ARRAY['lessons', 'created_by', 'users'],
    ARRAY['vocabulary_items', 'lesson_id', 'lessons'],
    ARRAY['kanji_items', 'lesson_id', 'lessons'],
    ARRAY['grammar_items', 'lesson_id', 'lessons'],
    ARRAY['grammar_items', 'level_id', 'levels'],
    ARRAY['learning_materials', 'lesson_id', 'lessons'],
    ARRAY['learning_materials', 'level_id', 'levels'],
    ARRAY['quick_quizzes', 'level_id', 'levels'],
    ARRAY['chat_rooms', 'level_id', 'levels'],
    ARRAY['chat_rooms', 'created_by', 'users'],
    ARRAY['conversations', 'level_id', 'levels'],
    ARRAY['conversations', 'created_by', 'users'],
    ARRAY['messages', 'room_id', 'chat_rooms'],
    ARRAY['messages', 'user_id', 'users'],
    ARRAY['messages', 'pinned_by', 'users'],
    ARRAY['game_sessions', 'opponent_id', 'users'],
    ARRAY['game_sessions', 'daily_challenge_id', 'daily_challenges'],
    ARRAY['game_question_sets', 'level_id', 'levels'],
    ARRAY['boss_configs', 'level_id', 'levels'],
    ARRAY['pvp_rooms', 'set_id', 'game_question_sets'],
    ARRAY['pvp_rooms', 'guest_user_id', 'users'],
    ARRAY['pvp_rooms', 'winner_user_id', 'users'],
    ARRAY['pvp_rooms', 'level_id', 'levels'],
    ARRAY['daily_challenges', 'game_id', 'games'],
    ARRAY['leaderboard_periods', 'level_id', 'levels'],
    ARRAY['leaderboard_periods', 'game_id', 'games'],
    ARRAY['reports', 'reported_user_id', 'users'],
    ARRAY['reports', 'message_id', 'messages'],
    ARRAY['reports', 'room_id', 'chat_rooms'],
    ARRAY['reports', 'assigned_moderator_id', 'users'],
    ARRAY['warnings', 'report_id', 'reports'],
    ARRAY['transactions', 'subscription_id', 'subscriptions'],
    ARRAY['promo_codes', 'plan_id', 'plans'],
    ARRAY['user_in_app_purchases', 'transaction_id', 'transactions'],
    ARRAY['ai_learning_recommendations', 'conversation_id', 'chatbot_conversations'],
    ARRAY['content_submissions', 'approved_by', 'users'],
    ARRAY['audit_logs', 'actor_id', 'users'],
    ARRAY['analytics_snapshots', 'created_by', 'users'],
    ARRAY['affiliate_partners', 'created_by', 'users'],
    ARRAY['ads', 'affiliate_partner_id', 'affiliate_partners'],
    ARRAY['ads', 'created_by', 'users'],
    ARRAY['sensitive_keywords', 'created_by', 'users'],
    ARRAY['suspension_proposals', 'admin_id', 'users'],
    ARRAY['system_announcements', 'created_by', 'users']
  ];
  fixes_delete text[][] := ARRAY[
    ARRAY['user_profiles', 'user_id', 'users'],
    ARRAY['email_verifications', 'user_id', 'users'],
    ARRAY['password_reset_tokens', 'user_id', 'users'],
    ARRAY['user_sessions', 'user_id', 'users'],
    ARRAY['user_activities_log', 'user_id', 'users'],
    ARRAY['user_statistics', 'user_id', 'users'],
    ARRAY['user_notification_preferences', 'user_id', 'users'],
    ARRAY['user_online_status', 'user_id', 'users'],
    ARRAY['lesson_categories', 'level_id', 'levels'],
    ARRAY['lessons', 'category_id', 'lesson_categories'],
    ARRAY['user_lesson_progress', 'user_id', 'users'],
    ARRAY['user_lesson_progress', 'lesson_id', 'lessons'],
    ARRAY['user_bookmarks', 'user_id', 'users'],
    ARRAY['user_bookmarks', 'lesson_id', 'lessons'],
    ARRAY['lesson_quiz_questions', 'lesson_id', 'lessons'],
    ARRAY['placement_results', 'user_id', 'users'],
    ARRAY['placement_results', 'placement_test_id', 'placement_tests'],
    ARRAY['placement_results_app', 'user_id', 'users'],
    ARRAY['placement_question_options', 'question_id', 'placement_questions'],
    ARRAY['quick_quiz_questions', 'quick_quiz_id', 'quick_quizzes'],
    ARRAY['quick_quiz_results', 'user_id', 'users'],
    ARRAY['quick_quiz_results', 'quick_quiz_id', 'quick_quizzes'],
    ARRAY['level_up_questions', 'test_id', 'level_up_tests'],
    ARRAY['level_up_question_options', 'question_id', 'level_up_questions'],
    ARRAY['level_up_results', 'user_id', 'users'],
    ARRAY['level_up_results', 'test_id', 'level_up_tests'],
    ARRAY['game_question_sets', 'game_id', 'games'],
    ARRAY['game_questions', 'set_id', 'game_question_sets'],
    ARRAY['game_score_configs', 'game_id', 'games'],
    ARRAY['game_sessions', 'user_id', 'users'],
    ARRAY['game_sessions', 'game_id', 'games'],
    ARRAY['game_session_answers', 'session_id', 'game_sessions'],
    ARRAY['game_session_answers', 'question_id', 'game_questions'],
    ARRAY['game_session_powerups', 'session_id', 'game_sessions'],
    ARRAY['game_session_powerups', 'power_up_id', 'power_ups'],
    ARRAY['boss_configs', 'game_id', 'games'],
    ARRAY['boss_configs', 'set_id', 'game_question_sets'],
    ARRAY['boss_battle_sessions', 'session_id', 'game_sessions'],
    ARRAY['boss_battle_sessions', 'boss_config_id', 'boss_configs'],
    ARRAY['pvp_rooms', 'game_id', 'games'],
    ARRAY['pvp_rooms', 'host_user_id', 'users'],
    ARRAY['user_daily_challenges', 'user_id', 'users'],
    ARRAY['user_daily_challenges', 'daily_challenge_id', 'daily_challenges'],
    ARRAY['user_inventory', 'user_id', 'users'],
    ARRAY['user_inventory', 'power_up_id', 'power_ups'],
    ARRAY['user_achievements', 'user_id', 'users'],
    ARRAY['user_achievements', 'achievement_id', 'achievements'],
    ARRAY['user_badges', 'user_id', 'users'],
    ARRAY['user_badges', 'badge_id', 'badges'],
    ARRAY['daily_rewards', 'user_id', 'users'],
    ARRAY['user_daily_usage', 'user_id', 'users'],
    ARRAY['leaderboard_entries', 'period_id', 'leaderboard_periods'],
    ARRAY['leaderboard_entries', 'user_id', 'users'],
    ARRAY['chat_room_members', 'room_id', 'chat_rooms'],
    ARRAY['chat_room_members', 'user_id', 'users'],
    ARRAY['messages', 'sender_id', 'users'],
    ARRAY['message_reactions', 'message_id', 'messages'],
    ARRAY['message_reactions', 'user_id', 'users'],
    ARRAY['friend_requests', 'from_user_id', 'users'],
    ARRAY['friend_requests', 'to_user_id', 'users'],
    ARRAY['friendships', 'user_id', 'users'],
    ARRAY['friendships', 'friend_id', 'users'],
    ARRAY['blocked_users', 'user_id', 'users'],
    ARRAY['blocked_users', 'blocked_user_id', 'users'],
    ARRAY['conversation_members', 'conversation_id', 'conversations'],
    ARRAY['conversation_members', 'user_id', 'users'],
    ARRAY['posts', 'user_id', 'users'],
    ARRAY['post_comments', 'post_id', 'posts'],
    ARRAY['post_comments', 'user_id', 'users'],
    ARRAY['post_reactions', 'post_id', 'posts'],
    ARRAY['post_reactions', 'user_id', 'users'],
    ARRAY['subscriptions', 'user_id', 'users'],
    ARRAY['subscriptions', 'plan_id', 'plans'],
    ARRAY['transactions', 'user_id', 'users'],
    ARRAY['user_in_app_purchases', 'user_id', 'users'],
    ARRAY['user_in_app_purchases', 'product_id', 'in_app_products'],
    ARRAY['notifications', 'user_id', 'users'],
    ARRAY['bug_reports', 'user_id', 'users'],
    ARRAY['feedback', 'user_id', 'users'],
    ARRAY['chatbot_conversations', 'user_id', 'users'],
    ARRAY['chatbot_messages', 'conversation_id', 'chatbot_conversations'],
    ARRAY['ai_learning_recommendations', 'user_id', 'users'],
    ARRAY['content_edit_logs', 'editor_id', 'users'],
    ARRAY['content_submissions', 'user_id', 'users'],
    ARRAY['reports', 'reporter_id', 'users'],
    ARRAY['warnings', 'user_id', 'users'],
    ARRAY['warnings', 'moderator_id', 'users'],
    ARRAY['user_mutes', 'user_id', 'users'],
    ARRAY['user_mutes', 'moderator_id', 'users'],
    ARRAY['moderation_notes', 'user_id', 'users'],
    ARRAY['moderation_notes', 'moderator_id', 'users'],
    ARRAY['suspension_proposals', 'user_id', 'users'],
    ARRAY['suspension_proposals', 'moderator_id', 'users'],
    ARRAY['premium_payment_requests', 'user_id', 'users'],
    ARRAY['premium_subscriptions', 'user_id', 'users']
  ];
  r text[];
BEGIN
  FOREACH r SLICE 1 IN ARRAY fixes_null LOOP
    PERFORM public.yumegoji_fix_orphan_null(r[1], r[2], r[3]);
  END LOOP;
  FOREACH r SLICE 1 IN ARRAY fixes_delete LOOP
    PERFORM public.yumegoji_fix_orphan_delete(r[1], r[2], r[3]);
  END LOOP;
END;
$cleanup$;

DROP FUNCTION public.yumegoji_fix_orphan_null(text, text, text, text);
DROP FUNCTION public.yumegoji_fix_orphan_delete(text, text, text, text);

-- Kiểm tra orphan còn lại (kỳ vọng 0):
-- SELECT COUNT(*) FROM conversations c
--   LEFT JOIN users u ON u.id = c.created_by
--   WHERE c.created_by IS NOT NULL AND u.id IS NULL;

CREATE OR REPLACE FUNCTION public.yumegoji_add_fk_if_missing(p_name text, p_sql text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND c.conname = p_name
  ) THEN
    EXECUTE p_sql;
  END IF;
END;
$$;

-- ==================== 1. USERS & LEVELS ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_users_level_id',
  'ALTER TABLE public.users ADD CONSTRAINT fk_users_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_profiles_user_id',
  'ALTER TABLE public.user_profiles ADD CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_email_verifications_user_id',
  'ALTER TABLE public.email_verifications ADD CONSTRAINT fk_email_verifications_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_password_reset_tokens_user_id',
  'ALTER TABLE public.password_reset_tokens ADD CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_sessions_user_id',
  'ALTER TABLE public.user_sessions ADD CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_activities_log_user_id',
  'ALTER TABLE public.user_activities_log ADD CONSTRAINT fk_user_activities_log_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_statistics_user_id',
  'ALTER TABLE public.user_statistics ADD CONSTRAINT fk_user_statistics_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_notification_preferences_user_id',
  'ALTER TABLE public.user_notification_preferences ADD CONSTRAINT fk_user_notification_preferences_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_online_status_user_id',
  'ALTER TABLE public.user_online_status ADD CONSTRAINT fk_user_online_status_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

-- ==================== 2. LEARNING ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_lesson_categories_level_id',
  'ALTER TABLE public.lesson_categories ADD CONSTRAINT fk_lesson_categories_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE RESTRICT'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_lessons_category_id',
  'ALTER TABLE public.lessons ADD CONSTRAINT fk_lessons_category_id FOREIGN KEY (category_id) REFERENCES public.lesson_categories(id) ON DELETE RESTRICT'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_lessons_created_by',
  'ALTER TABLE public.lessons ADD CONSTRAINT fk_lessons_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_vocabulary_items_lesson_id',
  'ALTER TABLE public.vocabulary_items ADD CONSTRAINT fk_vocabulary_items_lesson_id FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_kanji_items_lesson_id',
  'ALTER TABLE public.kanji_items ADD CONSTRAINT fk_kanji_items_lesson_id FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_grammar_items_lesson_id',
  'ALTER TABLE public.grammar_items ADD CONSTRAINT fk_grammar_items_lesson_id FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_grammar_items_level_id',
  'ALTER TABLE public.grammar_items ADD CONSTRAINT fk_grammar_items_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_learning_materials_lesson_id',
  'ALTER TABLE public.learning_materials ADD CONSTRAINT fk_learning_materials_lesson_id FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_learning_materials_level_id',
  'ALTER TABLE public.learning_materials ADD CONSTRAINT fk_learning_materials_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_lesson_progress_user_id',
  'ALTER TABLE public.user_lesson_progress ADD CONSTRAINT fk_user_lesson_progress_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_lesson_progress_lesson_id',
  'ALTER TABLE public.user_lesson_progress ADD CONSTRAINT fk_user_lesson_progress_lesson_id FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_bookmarks_user_id',
  'ALTER TABLE public.user_bookmarks ADD CONSTRAINT fk_user_bookmarks_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_bookmarks_lesson_id',
  'ALTER TABLE public.user_bookmarks ADD CONSTRAINT fk_user_bookmarks_lesson_id FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE'
);

-- lesson_quiz_questions.lesson_id — đã có fk_lesson_quiz_questions_lesson_id

-- ==================== 3. PLACEMENT & QUIZZES ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_placement_results_user_id',
  'ALTER TABLE public.placement_results ADD CONSTRAINT fk_placement_results_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_placement_results_placement_test_id',
  'ALTER TABLE public.placement_results ADD CONSTRAINT fk_placement_results_placement_test_id FOREIGN KEY (placement_test_id) REFERENCES public.placement_tests(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_placement_results_app_user_id',
  'ALTER TABLE public.placement_results_app ADD CONSTRAINT fk_placement_results_app_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

-- placement_question_options.question_id — đã có

SELECT public.yumegoji_add_fk_if_missing(
  'fk_quick_quizzes_level_id',
  'ALTER TABLE public.quick_quizzes ADD CONSTRAINT fk_quick_quizzes_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_quick_quiz_questions_quick_quiz_id',
  'ALTER TABLE public.quick_quiz_questions ADD CONSTRAINT fk_quick_quiz_questions_quick_quiz_id FOREIGN KEY (quick_quiz_id) REFERENCES public.quick_quizzes(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_quick_quiz_results_user_id',
  'ALTER TABLE public.quick_quiz_results ADD CONSTRAINT fk_quick_quiz_results_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_quick_quiz_results_quick_quiz_id',
  'ALTER TABLE public.quick_quiz_results ADD CONSTRAINT fk_quick_quiz_results_quick_quiz_id FOREIGN KEY (quick_quiz_id) REFERENCES public.quick_quizzes(id) ON DELETE CASCADE'
);

-- ==================== 4. LEVEL-UP TESTS ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_level_up_questions_test_id',
  'ALTER TABLE public.level_up_questions ADD CONSTRAINT fk_level_up_questions_test_id FOREIGN KEY (test_id) REFERENCES public.level_up_tests(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_level_up_question_options_question_id',
  'ALTER TABLE public.level_up_question_options ADD CONSTRAINT fk_level_up_question_options_question_id FOREIGN KEY (question_id) REFERENCES public.level_up_questions(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_level_up_results_user_id',
  'ALTER TABLE public.level_up_results ADD CONSTRAINT fk_level_up_results_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_level_up_results_test_id',
  'ALTER TABLE public.level_up_results ADD CONSTRAINT fk_level_up_results_test_id FOREIGN KEY (test_id) REFERENCES public.level_up_tests(id) ON DELETE CASCADE'
);

-- ==================== 5. GAMES ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_question_sets_game_id',
  'ALTER TABLE public.game_question_sets ADD CONSTRAINT fk_game_question_sets_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_question_sets_level_id',
  'ALTER TABLE public.game_question_sets ADD CONSTRAINT fk_game_question_sets_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_questions_set_id',
  'ALTER TABLE public.game_questions ADD CONSTRAINT fk_game_questions_set_id FOREIGN KEY (set_id) REFERENCES public.game_question_sets(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_score_configs_game_id',
  'ALTER TABLE public.game_score_configs ADD CONSTRAINT fk_game_score_configs_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_sessions_user_id',
  'ALTER TABLE public.game_sessions ADD CONSTRAINT fk_game_sessions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_sessions_game_id',
  'ALTER TABLE public.game_sessions ADD CONSTRAINT fk_game_sessions_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_sessions_opponent_id',
  'ALTER TABLE public.game_sessions ADD CONSTRAINT fk_game_sessions_opponent_id FOREIGN KEY (opponent_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_sessions_daily_challenge_id',
  'ALTER TABLE public.game_sessions ADD CONSTRAINT fk_game_sessions_daily_challenge_id FOREIGN KEY (daily_challenge_id) REFERENCES public.daily_challenges(id) ON DELETE SET NULL'
);

-- set_id, pvp_room_id, boss_config_id — đã có

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_session_answers_session_id',
  'ALTER TABLE public.game_session_answers ADD CONSTRAINT fk_game_session_answers_session_id FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_session_answers_question_id',
  'ALTER TABLE public.game_session_answers ADD CONSTRAINT fk_game_session_answers_question_id FOREIGN KEY (question_id) REFERENCES public.game_questions(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_session_powerups_session_id',
  'ALTER TABLE public.game_session_powerups ADD CONSTRAINT fk_game_session_powerups_session_id FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_game_session_powerups_power_up_id',
  'ALTER TABLE public.game_session_powerups ADD CONSTRAINT fk_game_session_powerups_power_up_id FOREIGN KEY (power_up_id) REFERENCES public.power_ups(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_boss_configs_game_id',
  'ALTER TABLE public.boss_configs ADD CONSTRAINT fk_boss_configs_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_boss_configs_level_id',
  'ALTER TABLE public.boss_configs ADD CONSTRAINT fk_boss_configs_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_boss_configs_set_id',
  'ALTER TABLE public.boss_configs ADD CONSTRAINT fk_boss_configs_set_id FOREIGN KEY (set_id) REFERENCES public.game_question_sets(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_boss_battle_sessions_session_id',
  'ALTER TABLE public.boss_battle_sessions ADD CONSTRAINT fk_boss_battle_sessions_session_id FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_boss_battle_sessions_boss_config_id',
  'ALTER TABLE public.boss_battle_sessions ADD CONSTRAINT fk_boss_battle_sessions_boss_config_id FOREIGN KEY (boss_config_id) REFERENCES public.boss_configs(id) ON DELETE CASCADE'
);

-- boss_battles.game_id, level_id — đã có

SELECT public.yumegoji_add_fk_if_missing(
  'fk_pvp_rooms_game_id',
  'ALTER TABLE public.pvp_rooms ADD CONSTRAINT fk_pvp_rooms_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_pvp_rooms_set_id',
  'ALTER TABLE public.pvp_rooms ADD CONSTRAINT fk_pvp_rooms_set_id FOREIGN KEY (set_id) REFERENCES public.game_question_sets(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_pvp_rooms_host_user_id',
  'ALTER TABLE public.pvp_rooms ADD CONSTRAINT fk_pvp_rooms_host_user_id FOREIGN KEY (host_user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_pvp_rooms_guest_user_id',
  'ALTER TABLE public.pvp_rooms ADD CONSTRAINT fk_pvp_rooms_guest_user_id FOREIGN KEY (guest_user_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_pvp_rooms_winner_user_id',
  'ALTER TABLE public.pvp_rooms ADD CONSTRAINT fk_pvp_rooms_winner_user_id FOREIGN KEY (winner_user_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_pvp_rooms_level_id',
  'ALTER TABLE public.pvp_rooms ADD CONSTRAINT fk_pvp_rooms_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

-- host_session_id / guest_session_id: cố ý không FK (tránh vòng tham chiếu)

SELECT public.yumegoji_add_fk_if_missing(
  'fk_daily_challenges_game_id',
  'ALTER TABLE public.daily_challenges ADD CONSTRAINT fk_daily_challenges_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_daily_challenges_user_id',
  'ALTER TABLE public.user_daily_challenges ADD CONSTRAINT fk_user_daily_challenges_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_daily_challenges_daily_challenge_id',
  'ALTER TABLE public.user_daily_challenges ADD CONSTRAINT fk_user_daily_challenges_daily_challenge_id FOREIGN KEY (daily_challenge_id) REFERENCES public.daily_challenges(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_inventory_user_id',
  'ALTER TABLE public.user_inventory ADD CONSTRAINT fk_user_inventory_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_inventory_power_up_id',
  'ALTER TABLE public.user_inventory ADD CONSTRAINT fk_user_inventory_power_up_id FOREIGN KEY (power_up_id) REFERENCES public.power_ups(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_achievements_user_id',
  'ALTER TABLE public.user_achievements ADD CONSTRAINT fk_user_achievements_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_achievements_achievement_id',
  'ALTER TABLE public.user_achievements ADD CONSTRAINT fk_user_achievements_achievement_id FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_badges_user_id',
  'ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_badges_badge_id',
  'ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_badge_id FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_daily_rewards_user_id',
  'ALTER TABLE public.daily_rewards ADD CONSTRAINT fk_daily_rewards_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_daily_usage_user_id',
  'ALTER TABLE public.user_daily_usage ADD CONSTRAINT fk_user_daily_usage_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_leaderboard_periods_level_id',
  'ALTER TABLE public.leaderboard_periods ADD CONSTRAINT fk_leaderboard_periods_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_leaderboard_periods_game_id',
  'ALTER TABLE public.leaderboard_periods ADD CONSTRAINT fk_leaderboard_periods_game_id FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_leaderboard_entries_period_id',
  'ALTER TABLE public.leaderboard_entries ADD CONSTRAINT fk_leaderboard_entries_period_id FOREIGN KEY (period_id) REFERENCES public.leaderboard_periods(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_leaderboard_entries_user_id',
  'ALTER TABLE public.leaderboard_entries ADD CONSTRAINT fk_leaderboard_entries_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

-- ==================== 6. CHAT & SOCIAL ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_chat_rooms_level_id',
  'ALTER TABLE public.chat_rooms ADD CONSTRAINT fk_chat_rooms_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_chat_rooms_created_by',
  'ALTER TABLE public.chat_rooms ADD CONSTRAINT fk_chat_rooms_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_chat_room_members_room_id',
  'ALTER TABLE public.chat_room_members ADD CONSTRAINT fk_chat_room_members_room_id FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_chat_room_members_user_id',
  'ALTER TABLE public.chat_room_members ADD CONSTRAINT fk_chat_room_members_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_messages_room_id',
  'ALTER TABLE public.messages ADD CONSTRAINT fk_messages_room_id FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_messages_user_id',
  'ALTER TABLE public.messages ADD CONSTRAINT fk_messages_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE NO ACTION'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_messages_sender_id',
  'ALTER TABLE public.messages ADD CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE NO ACTION'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_messages_pinned_by',
  'ALTER TABLE public.messages ADD CONSTRAINT fk_messages_pinned_by FOREIGN KEY (pinned_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

-- conversation_id, reply_to_id — đã có

SELECT public.yumegoji_add_fk_if_missing(
  'fk_message_reactions_message_id',
  'ALTER TABLE public.message_reactions ADD CONSTRAINT fk_message_reactions_message_id FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_message_reactions_user_id',
  'ALTER TABLE public.message_reactions ADD CONSTRAINT fk_message_reactions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_friend_requests_from_user_id',
  'ALTER TABLE public.friend_requests ADD CONSTRAINT fk_friend_requests_from_user_id FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_friend_requests_to_user_id',
  'ALTER TABLE public.friend_requests ADD CONSTRAINT fk_friend_requests_to_user_id FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_friendships_user_id',
  'ALTER TABLE public.friendships ADD CONSTRAINT fk_friendships_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_friendships_friend_id',
  'ALTER TABLE public.friendships ADD CONSTRAINT fk_friendships_friend_id FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_blocked_users_user_id',
  'ALTER TABLE public.blocked_users ADD CONSTRAINT fk_blocked_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_blocked_users_blocked_user_id',
  'ALTER TABLE public.blocked_users ADD CONSTRAINT fk_blocked_users_blocked_user_id FOREIGN KEY (blocked_user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_conversations_level_id',
  'ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_level_id FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_conversations_created_by',
  'ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

-- conversation_members.conversation_id — đã có

SELECT public.yumegoji_add_fk_if_missing(
  'fk_conversation_members_user_id',
  'ALTER TABLE public.conversation_members ADD CONSTRAINT fk_conversation_members_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_posts_user_id',
  'ALTER TABLE public.posts ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_post_comments_post_id',
  'ALTER TABLE public.post_comments ADD CONSTRAINT fk_post_comments_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_post_comments_user_id',
  'ALTER TABLE public.post_comments ADD CONSTRAINT fk_post_comments_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_post_reactions_post_id',
  'ALTER TABLE public.post_reactions ADD CONSTRAINT fk_post_reactions_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_post_reactions_user_id',
  'ALTER TABLE public.post_reactions ADD CONSTRAINT fk_post_reactions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

-- ==================== 7. PAYMENTS & PLANS ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_subscriptions_user_id',
  'ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_subscriptions_plan_id',
  'ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_plan_id FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_transactions_user_id',
  'ALTER TABLE public.transactions ADD CONSTRAINT fk_transactions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_transactions_subscription_id',
  'ALTER TABLE public.transactions ADD CONSTRAINT fk_transactions_subscription_id FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_promo_codes_plan_id',
  'ALTER TABLE public.promo_codes ADD CONSTRAINT fk_promo_codes_plan_id FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_in_app_purchases_user_id',
  'ALTER TABLE public.user_in_app_purchases ADD CONSTRAINT fk_user_in_app_purchases_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_in_app_purchases_product_id',
  'ALTER TABLE public.user_in_app_purchases ADD CONSTRAINT fk_user_in_app_purchases_product_id FOREIGN KEY (product_id) REFERENCES public.in_app_products(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_in_app_purchases_transaction_id',
  'ALTER TABLE public.user_in_app_purchases ADD CONSTRAINT fk_user_in_app_purchases_transaction_id FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL'
);

-- premium_* — đã có

-- ==================== 8. NOTIFICATIONS & SUPPORT ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_notifications_user_id',
  'ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_bug_reports_user_id',
  'ALTER TABLE public.bug_reports ADD CONSTRAINT fk_bug_reports_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_feedback_user_id',
  'ALTER TABLE public.feedback ADD CONSTRAINT fk_feedback_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_system_announcements_created_by',
  'ALTER TABLE public.system_announcements ADD CONSTRAINT fk_system_announcements_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

-- ==================== 9. CHATBOT & AI ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_chatbot_conversations_user_id',
  'ALTER TABLE public.chatbot_conversations ADD CONSTRAINT fk_chatbot_conversations_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_chatbot_messages_conversation_id',
  'ALTER TABLE public.chatbot_messages ADD CONSTRAINT fk_chatbot_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_ai_learning_recommendations_user_id',
  'ALTER TABLE public.ai_learning_recommendations ADD CONSTRAINT fk_ai_learning_recommendations_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_ai_learning_recommendations_conversation_id',
  'ALTER TABLE public.ai_learning_recommendations ADD CONSTRAINT fk_ai_learning_recommendations_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.chatbot_conversations(id) ON DELETE SET NULL'
);

-- ==================== 10. AUDIT & CONTENT ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_content_edit_logs_editor_id',
  'ALTER TABLE public.content_edit_logs ADD CONSTRAINT fk_content_edit_logs_editor_id FOREIGN KEY (editor_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_audit_logs_actor_id',
  'ALTER TABLE public.audit_logs ADD CONSTRAINT fk_audit_logs_actor_id FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_content_submissions_user_id',
  'ALTER TABLE public.content_submissions ADD CONSTRAINT fk_content_submissions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_content_submissions_approved_by',
  'ALTER TABLE public.content_submissions ADD CONSTRAINT fk_content_submissions_approved_by FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

-- ==================== 11. ANALYTICS & ADS ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_analytics_snapshots_created_by',
  'ALTER TABLE public.analytics_snapshots ADD CONSTRAINT fk_analytics_snapshots_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_affiliate_partners_created_by',
  'ALTER TABLE public.affiliate_partners ADD CONSTRAINT fk_affiliate_partners_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_ads_affiliate_partner_id',
  'ALTER TABLE public.ads ADD CONSTRAINT fk_ads_affiliate_partner_id FOREIGN KEY (affiliate_partner_id) REFERENCES public.affiliate_partners(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_ads_created_by',
  'ALTER TABLE public.ads ADD CONSTRAINT fk_ads_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

-- ==================== 12. MODERATION ====================

SELECT public.yumegoji_add_fk_if_missing(
  'fk_reports_reporter_id',
  'ALTER TABLE public.reports ADD CONSTRAINT fk_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_reports_reported_user_id',
  'ALTER TABLE public.reports ADD CONSTRAINT fk_reports_reported_user_id FOREIGN KEY (reported_user_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_reports_message_id',
  'ALTER TABLE public.reports ADD CONSTRAINT fk_reports_message_id FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_reports_room_id',
  'ALTER TABLE public.reports ADD CONSTRAINT fk_reports_room_id FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_reports_assigned_moderator_id',
  'ALTER TABLE public.reports ADD CONSTRAINT fk_reports_assigned_moderator_id FOREIGN KEY (assigned_moderator_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_warnings_user_id',
  'ALTER TABLE public.warnings ADD CONSTRAINT fk_warnings_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_warnings_moderator_id',
  'ALTER TABLE public.warnings ADD CONSTRAINT fk_warnings_moderator_id FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_warnings_report_id',
  'ALTER TABLE public.warnings ADD CONSTRAINT fk_warnings_report_id FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_mutes_user_id',
  'ALTER TABLE public.user_mutes ADD CONSTRAINT fk_user_mutes_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_user_mutes_moderator_id',
  'ALTER TABLE public.user_mutes ADD CONSTRAINT fk_user_mutes_moderator_id FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_moderation_notes_user_id',
  'ALTER TABLE public.moderation_notes ADD CONSTRAINT fk_moderation_notes_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_moderation_notes_moderator_id',
  'ALTER TABLE public.moderation_notes ADD CONSTRAINT fk_moderation_notes_moderator_id FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_sensitive_keywords_created_by',
  'ALTER TABLE public.sensitive_keywords ADD CONSTRAINT fk_sensitive_keywords_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_suspension_proposals_user_id',
  'ALTER TABLE public.suspension_proposals ADD CONSTRAINT fk_suspension_proposals_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_suspension_proposals_moderator_id',
  'ALTER TABLE public.suspension_proposals ADD CONSTRAINT fk_suspension_proposals_moderator_id FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE'
);

SELECT public.yumegoji_add_fk_if_missing(
  'fk_suspension_proposals_admin_id',
  'ALTER TABLE public.suspension_proposals ADD CONSTRAINT fk_suspension_proposals_admin_id FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL'
);

-- profile unlocks — đã có (avatar_frame, profile_background, profile_title)

-- ==================== Dọn helper & báo cáo ====================

DROP FUNCTION public.yumegoji_add_fk_if_missing(text, text);

SELECT COUNT(*) AS total_foreign_keys
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';
