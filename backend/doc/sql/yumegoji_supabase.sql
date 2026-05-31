-- ============================================================
-- Yumegoji DB — Supabase / PostgreSQL Migration
-- Tables: 100
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "game_question_sets" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "level_id" INTEGER NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT NULL,
    "questions_per_round" INTEGER NULL,
    "time_per_question_s" INTEGER NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_questions" (
    "id" SERIAL NOT NULL,
    "set_id" INTEGER NOT NULL,
    "question_type" VARCHAR(30) NOT NULL,
    "question_text" VARCHAR(500) NULL,
    "hint_text" VARCHAR(500) NULL,
    "audio_url" VARCHAR(500) NULL,
    "image_url" VARCHAR(500) NULL,
    "options_json" TEXT NOT NULL,
    "correct_index" INTEGER NULL,
    "explanation" TEXT NULL,
    "base_score" INTEGER NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "games" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT NULL,
    "skill_type" VARCHAR(50) NULL,
    "level_min" VARCHAR(10) NULL,
    "level_max" VARCHAR(10) NULL,
    "max_hearts" INTEGER NOT NULL,
    "rules_json" TEXT NULL,
    "icon_url" VARCHAR(500) NULL,
    "is_pvp" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "is_boss_mode" BOOLEAN NOT NULL,
    "config_json" TEXT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_session_answers" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_order" INTEGER NOT NULL,
    "chosen_index" INTEGER NULL,
    "is_correct" BOOLEAN NOT NULL,
    "response_ms" INTEGER NULL,
    "score_earned" INTEGER NOT NULL,
    "combo_at_answer" INTEGER NOT NULL,
    "power_up_used" VARCHAR(50) NULL,
    "answered_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "max_combo" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "hearts_remaining" INTEGER NULL,
    "hearts_lost" INTEGER NOT NULL,
    "time_spent_seconds" INTEGER NULL,
    "exp_earned" INTEGER NOT NULL,
    "xu_earned" INTEGER NOT NULL,
    "opponent_id" INTEGER NULL,
    "is_win" BOOLEAN NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "ended_at" TIMESTAMPTZ NULL,
    "set_id" INTEGER NULL,
    "pvp_room_id" INTEGER NULL,
    "boss_config_id" INTEGER NULL,
    "daily_challenge_id" INTEGER NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "achievements" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT NULL,
    "icon_url" VARCHAR(500) NULL,
    "condition_type" VARCHAR(50) NOT NULL,
    "condition_value" TEXT NULL,
    "xu_reward" INTEGER NOT NULL,
    "exp_reward" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "criteria_type" VARCHAR(50) NOT NULL,
    "criteria_json" TEXT NULL,
    "reward_exp" INTEGER NOT NULL,
    "reward_xu" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ads" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NULL,
    "content_url" VARCHAR(500) NOT NULL,
    "placement" VARCHAR(100) NULL,
    "affiliate_partner_id" INTEGER NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "affiliate_partners" (
    "id" SERIAL NOT NULL,
    "partner_name" VARCHAR(200) NOT NULL,
    "partner_code" VARCHAR(50) NULL,
    "commission_rate" DECIMAL(5,2) NULL,
    "contact_info" TEXT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_learning_recommendations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "conversation_id" INTEGER NULL,
    "recommended_lesson_ids" TEXT NULL,
    "recommendation_type" VARCHAR(30) NULL,
    "metadata" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
    "id" SERIAL NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "dimensions" TEXT NULL,
    "created_by" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NULL,
    "changes" TEXT NULL,
    "ip_address" VARCHAR(45) NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "avatar_frames" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name_vi" VARCHAR(120) NOT NULL,
    "description_nv" VARCHAR(500) NULL,
    "image_path" VARCHAR(300) NOT NULL,
    "frame_kind" VARCHAR(20) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "badges" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT NULL,
    "icon_url" VARCHAR(500) NULL,
    "type" VARCHAR(30) NULL,
    "is_premium_only" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "blocked_users" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "blocked_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "boss_battle_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "boss_config_id" INTEGER NOT NULL,
    "hp_remaining" INTEGER NOT NULL,
    "is_boss_defeated" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "boss_battles" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "topic" VARCHAR(200) NULL,
    "level_id" INTEGER NULL,
    "boss_hp" INTEGER NOT NULL,
    "time_limit_sec" INTEGER NULL,
    "reward_exp" INTEGER NOT NULL,
    "reward_xu" INTEGER NOT NULL,
    "config_json" TEXT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "boss_configs" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "level_id" INTEGER NULL,
    "set_id" INTEGER NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NULL,
    "image_url" VARCHAR(500) NULL,
    "hp" INTEGER NOT NULL,
    "reward_xu" INTEGER NOT NULL,
    "reward_exp" INTEGER NOT NULL,
    "time_limit_s" INTEGER NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bug_reports" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NULL,
    "description" TEXT NOT NULL,
    "page_url" VARCHAR(500) NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_room_members" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL,
    "last_read_at" TIMESTAMPTZ NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_rooms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NULL,
    "type" VARCHAR(20) NOT NULL,
    "level_id" INTEGER NULL,
    "description" TEXT NULL,
    "avatar_url" VARCHAR(500) NULL,
    "max_members" INTEGER NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chatbot_conversations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chatbot_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_edit_logs" (
    "id" SERIAL NOT NULL,
    "editor_id" INTEGER NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "old_value" TEXT NULL,
    "new_value" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_submissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NULL,
    "content" TEXT NULL,
    "status" VARCHAR(20) NOT NULL,
    "approved_by" INTEGER NULL,
    "approved_at" TIMESTAMPTZ NULL,
    "rejection_note" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversation_members" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL,
    "last_read_message_id" INTEGER NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NULL,
    "type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "slug" VARCHAR(80) NULL,
    "category" VARCHAR(50) NULL,
    "level_id" INTEGER NULL,
    "max_members" INTEGER NULL,
    "avatar_url" VARCHAR(500) NULL,
    "created_by" INTEGER NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_challenges" (
    "id" SERIAL NOT NULL,
    "challenge_date" DATE NOT NULL,
    "game_id" INTEGER NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NULL,
    "target_score" INTEGER NULL,
    "target_accuracy" INTEGER NULL,
    "reward_xu" INTEGER NOT NULL,
    "reward_exp" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "bonus_exp" INTEGER NOT NULL,
    "bonus_xu" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_rewards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reward_date" DATE NOT NULL,
    "reward_type" VARCHAR(30) NOT NULL,
    "reward_value" TEXT NULL,
    "claimed_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feedback" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "friend_requests" (
    "id" SERIAL NOT NULL,
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "responded_at" TIMESTAMPTZ NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "friendships" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "friend_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_score_configs" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "base_score" INTEGER NOT NULL,
    "max_speed_bonus" INTEGER NOT NULL,
    "speed_bonus_threshold_ms" INTEGER NOT NULL,
    "combo_rules_json" TEXT NOT NULL,
    "penalty_per_miss" INTEGER NOT NULL,
    "xu_base_reward" INTEGER NOT NULL,
    "exp_base_reward" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_session_powerups" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "power_up_id" INTEGER NOT NULL,
    "used_at_order" INTEGER NOT NULL,
    "used_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "grammar_items" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NULL,
    "pattern" VARCHAR(200) NOT NULL,
    "structure" TEXT NULL,
    "meaning_vi" TEXT NULL,
    "meaning_en" TEXT NULL,
    "example_sentences" TEXT NULL,
    "level_id" INTEGER NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "in_app_products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "target_id" INTEGER NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kanji_items" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NULL,
    "character" VARCHAR(10) NOT NULL,
    "readings_on" VARCHAR(200) NULL,
    "readings_kun" VARCHAR(200) NULL,
    "meaning_vi" VARCHAR(300) NULL,
    "meaning_en" VARCHAR(300) NULL,
    "stroke_count" INTEGER NULL,
    "jlpt_level" VARCHAR(10) NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
    "id" SERIAL NOT NULL,
    "period_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracy_percent" DECIMAL(5,2) NULL,
    "avg_response_seconds" DECIMAL(6,2) NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "leaderboard_periods" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "scope" VARCHAR(30) NOT NULL,
    "level_id" INTEGER NULL,
    "game_id" INTEGER NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learning_materials" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NULL,
    "level_id" INTEGER NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size_kb" INTEGER NULL,
    "is_premium" BOOLEAN NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "download_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lesson_categories" (
    "id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "thumbnail_url" VARCHAR(500) NULL,
    "sort_order" INTEGER NOT NULL,
    "is_premium" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lesson_quiz_questions" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lessons" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "content" TEXT NULL,
    "sort_order" INTEGER NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "is_premium" BOOLEAN NOT NULL,
    "is_published" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" INTEGER NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "level_up_question_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_key" VARCHAR(10) NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "level_up_questions" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "points" INTEGER NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "level_up_results" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,
    "from_level" VARCHAR(10) NOT NULL,
    "to_level" VARCHAR(10) NOT NULL,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "is_passed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "level_up_tests" (
    "id" SERIAL NOT NULL,
    "from_level" VARCHAR(10) NOT NULL,
    "to_level" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500) NULL,
    "total_points" INTEGER NOT NULL,
    "pass_score" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "levels" (
    "id" INTEGER NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT NULL,
    "sort_order" INTEGER NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "message_reactions" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "emoji" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "messages" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NULL,
    "user_id" INTEGER NULL,
    "content" TEXT NULL,
    "type" VARCHAR(20) NOT NULL,
    "reply_to_id" INTEGER NULL,
    "is_pinned" BOOLEAN NOT NULL,
    "pinned_by" INTEGER NULL,
    "pinned_at" TIMESTAMPTZ NULL,
    "is_deleted" BOOLEAN NOT NULL,
    "deleted_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "moderation_notes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "moderator_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NULL,
    "body" TEXT NULL,
    "data" TEXT NULL,
    "read_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "placement_question_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_key" VARCHAR(1) NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "placement_questions" (
    "id" SERIAL NOT NULL,
    "level_label" VARCHAR(5) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "placement_results" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "placement_test_id" INTEGER NOT NULL,
    "score_vocabulary" INTEGER NOT NULL,
    "score_reading" INTEGER NOT NULL,
    "score_conversation" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "level_result" VARCHAR(10) NOT NULL,
    "answers_detail" TEXT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "placement_results_app" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "level_label" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "placement_tests" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NULL,
    "total_questions" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "plans" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "price_monthly" DECIMAL(10,2) NULL,
    "price_yearly" DECIMAL(10,2) NULL,
    "features" TEXT NULL,
    "max_friends" INTEGER NULL,
    "game_plays_per_day" INTEGER NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "post_comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "post_reactions" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "emoji" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NULL,
    "image_url" VARCHAR(500) NULL,
    "is_deleted" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "power_ups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT NULL,
    "effect_type" VARCHAR(30) NOT NULL,
    "icon_url" VARCHAR(500) NULL,
    "xu_price" INTEGER NOT NULL,
    "is_premium" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "stackable" BOOLEAN NOT NULL,
    "max_per_session" INTEGER NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "premium_payment_config" (
    "id" INTEGER NOT NULL,
    "bank_code" VARCHAR(16) NOT NULL,
    "account_no" VARCHAR(64) NOT NULL,
    "account_name" VARCHAR(200) NOT NULL,
    "premium_price_vnd" INTEGER NOT NULL,
    "premium_duration_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "premium_payment_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(32) NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "confirmed_at" TIMESTAMPTZ NULL,
    "approved_at" TIMESTAMPTZ NULL,
    "approved_by" INTEGER NULL,
    "note" VARCHAR(500) NULL,
    "bank_code" VARCHAR(16) NOT NULL,
    "account_no" VARCHAR(64) NOT NULL,
    "account_name" VARCHAR(200) NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "premium_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "payment_request_id" INTEGER NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "profile_backgrounds" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name_vi" VARCHAR(120) NOT NULL,
    "description_nv" VARCHAR(500) NULL,
    "image_path" VARCHAR(300) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "profile_titles" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name_vi" VARCHAR(120) NOT NULL,
    "description_nv" VARCHAR(500) NULL,
    "image_path" VARCHAR(300) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "plan_id" INTEGER NULL,
    "discount_type" VARCHAR(20) NULL,
    "discount_value" DECIMAL(10,2) NULL,
    "max_uses" INTEGER NULL,
    "used_count" INTEGER NOT NULL,
    "valid_from" TIMESTAMPTZ NULL,
    "valid_until" TIMESTAMPTZ NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pvp_rooms" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "set_id" INTEGER NULL,
    "host_user_id" INTEGER NOT NULL,
    "guest_user_id" INTEGER NULL,
    "status" VARCHAR(20) NOT NULL,
    "room_code" VARCHAR(32) NOT NULL,
    "level_id" INTEGER NULL,
    "host_session_id" INTEGER NULL,
    "guest_session_id" INTEGER NULL,
    "winner_user_id" INTEGER NULL,
    "total_questions" INTEGER NOT NULL,
    "question_order_json" TEXT NULL,
    "started_at" TIMESTAMPTZ NULL,
    "ended_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quick_quiz_questions" (
    "id" SERIAL NOT NULL,
    "quick_quiz_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correct_answer_index" INTEGER NOT NULL,
    "explanation" TEXT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quick_quiz_results" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "quick_quiz_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "time_spent_seconds" INTEGER NULL,
    "answers_detail" TEXT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quick_quizzes" (
    "id" SERIAL NOT NULL,
    "level_id" INTEGER NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" VARCHAR(30) NULL,
    "question_count" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "reported_user_id" INTEGER NULL,
    "message_id" INTEGER NULL,
    "room_id" INTEGER NULL,
    "type" VARCHAR(20) NOT NULL,
    "severity" INTEGER NULL,
    "description" TEXT NULL,
    "status" VARCHAR(20) NOT NULL,
    "assigned_moderator_id" INTEGER NULL,
    "resolved_at" TIMESTAMPTZ NULL,
    "resolution_note" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sensitive_keywords" (
    "id" SERIAL NOT NULL,
    "keyword" VARCHAR(200) NOT NULL,
    "severity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "cancelled_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "suspension_proposals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "moderator_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "admin_id" INTEGER NULL,
    "decided_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_announcements" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(30) NULL,
    "is_published" BOOLEAN NOT NULL,
    "published_at" TIMESTAMPTZ NULL,
    "created_by" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "subscription_id" INTEGER NULL,
    "type" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "payment_method" VARCHAR(50) NULL,
    "payment_reference" VARCHAR(255) NULL,
    "status" VARCHAR(20) NOT NULL,
    "metadata" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_achievements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_activities_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NULL,
    "entity_id" INTEGER NULL,
    "score" INTEGER NULL,
    "metadata" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_avatar_frame_unlocks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "frame_id" INTEGER NOT NULL,
    "granted_by_user_id" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "is_equipped" BOOLEAN NOT NULL,
    "unlocked_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_bookmarks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_daily_challenges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "daily_challenge_id" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL,
    "score_achieved" INTEGER NULL,
    "reward_claimed" BOOLEAN NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_daily_usage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "usage_date" DATE NOT NULL,
    "game_play_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_in_app_purchases" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NULL,
    "purchased_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_inventory" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "power_up_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_lesson_progress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "progress_percent" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ NULL,
    "last_accessed_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_mutes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "moderator_id" INTEGER NOT NULL,
    "muted_until" TIMESTAMPTZ NOT NULL,
    "reason" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
    "user_id" INTEGER NOT NULL,
    "email_optin" BOOLEAN NOT NULL,
    "browser_push_token" TEXT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "user_online_status" (
    "user_id" INTEGER NOT NULL,
    "last_seen_at" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "user_profile_background_unlocks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "background_id" INTEGER NOT NULL,
    "granted_by_user_id" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_profile_title_unlocks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "granted_by_user_id" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "display_name" VARCHAR(100) NULL,
    "avatar_url" VARCHAR(500) NULL,
    "cover_url" VARCHAR(500) NULL,
    "bio" TEXT NULL,
    "date_of_birth" DATE NULL,
    "privacy_profile" VARCHAR(20) NULL,
    "privacy_friend_request" VARCHAR(20) NULL,
    "theme" VARCHAR(10) NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "equipped_avatar_frame_slug" VARCHAR(64) NULL,
    "equipped_title_slug" VARCHAR(64) NULL,
    "profile_background_slug" VARCHAR(64) NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "device_info" VARCHAR(255) NULL,
    "ip_address" VARCHAR(45) NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_statistics" (
    "user_id" INTEGER NOT NULL,
    "lessons_completed" INTEGER NOT NULL,
    "games_played" INTEGER NOT NULL,
    "quizzes_completed" INTEGER NOT NULL,
    "total_exp" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NULL,
    "role" VARCHAR(20) NOT NULL,
    "level_id" INTEGER NULL,
    "exp" INTEGER NOT NULL,
    "streak_days" INTEGER NOT NULL,
    "last_streak_at" DATE NULL,
    "xu" INTEGER NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL,
    "is_locked" BOOLEAN NOT NULL,
    "locked_at" TIMESTAMPTZ NULL,
    "locked_reason" TEXT NULL,
    "last_login_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ NULL,
    "is_premium" BOOLEAN NOT NULL,
    "google_sub" VARCHAR(255) NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vocabulary_items" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NULL,
    "word_jp" VARCHAR(100) NOT NULL,
    "reading" VARCHAR(200) NULL,
    "meaning_vi" VARCHAR(500) NULL,
    "meaning_en" VARCHAR(500) NULL,
    "example_sentence" TEXT NULL,
    "audio_url" VARCHAR(500) NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "warnings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "moderator_id" INTEGER NOT NULL,
    "report_id" INTEGER NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY ("id")
);

-- ============================================================
-- Foreign Key Constraints
-- ============================================================

ALTER TABLE "game_sessions" ADD CONSTRAINT "fk_game_sessions_boss_config_id" FOREIGN KEY ("boss_config_id") REFERENCES "boss_configs" ("id") ON DELETE SET NULL;
ALTER TABLE "game_sessions" ADD CONSTRAINT "fk_game_sessions_pvp_room_id" FOREIGN KEY ("pvp_room_id") REFERENCES "pvp_rooms" ("id") ON DELETE SET NULL;
ALTER TABLE "game_sessions" ADD CONSTRAINT "fk_game_sessions_set_id" FOREIGN KEY ("set_id") REFERENCES "game_question_sets" ("id") ON DELETE SET NULL;
ALTER TABLE "boss_battles" ADD CONSTRAINT "fk_boss_battles_game_id" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE SET NULL;
ALTER TABLE "boss_battles" ADD CONSTRAINT "fk_boss_battles_level_id" FOREIGN KEY ("level_id") REFERENCES "levels" ("id") ON DELETE SET NULL;
ALTER TABLE "conversation_members" ADD CONSTRAINT "fk_conversation_members_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE SET NULL;
ALTER TABLE "lesson_quiz_questions" ADD CONSTRAINT "fk_lesson_quiz_questions_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "lessons" ("id") ON DELETE SET NULL;
ALTER TABLE "messages" ADD CONSTRAINT "fk_messages_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "chat_rooms" ("id") ON DELETE SET NULL;
ALTER TABLE "messages" ADD CONSTRAINT "fk_messages_reply_to_id" FOREIGN KEY ("reply_to_id") REFERENCES "messages" ("id") ON DELETE SET NULL;
ALTER TABLE "placement_question_options" ADD CONSTRAINT "fk_placement_question_options_question_id" FOREIGN KEY ("question_id") REFERENCES "placement_questions" ("id") ON DELETE SET NULL;
ALTER TABLE "premium_payment_requests" ADD CONSTRAINT "fk_premium_payment_requests_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "premium_payment_requests" ADD CONSTRAINT "fk_premium_payment_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "premium_subscriptions" ADD CONSTRAINT "fk_premium_subscriptions_payment_request_id" FOREIGN KEY ("payment_request_id") REFERENCES "premium_payment_requests" ("id") ON DELETE SET NULL;
ALTER TABLE "premium_subscriptions" ADD CONSTRAINT "fk_premium_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "user_avatar_frame_unlocks" ADD CONSTRAINT "fk_user_avatar_frame_unlocks_frame_id" FOREIGN KEY ("frame_id") REFERENCES "avatar_frames" ("id") ON DELETE SET NULL;
ALTER TABLE "user_avatar_frame_unlocks" ADD CONSTRAINT "fk_user_avatar_frame_unlocks_granted_by_user_id" FOREIGN KEY ("granted_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "user_avatar_frame_unlocks" ADD CONSTRAINT "fk_user_avatar_frame_unlocks_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "user_profile_background_unlocks" ADD CONSTRAINT "fk_user_profile_background_unlocks_background_id" FOREIGN KEY ("background_id") REFERENCES "profile_backgrounds" ("id") ON DELETE SET NULL;
ALTER TABLE "user_profile_background_unlocks" ADD CONSTRAINT "fk_user_profile_background_unlocks_granted_by_user_id" FOREIGN KEY ("granted_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "user_profile_background_unlocks" ADD CONSTRAINT "fk_user_profile_background_unlocks_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "user_profile_title_unlocks" ADD CONSTRAINT "fk_user_profile_title_unlocks_granted_by_user_id" FOREIGN KEY ("granted_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "user_profile_title_unlocks" ADD CONSTRAINT "fk_user_profile_title_unlocks_title_id" FOREIGN KEY ("title_id") REFERENCES "profile_titles" ("id") ON DELETE SET NULL;
ALTER TABLE "user_profile_title_unlocks" ADD CONSTRAINT "fk_user_profile_title_unlocks_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;

-- ============================================================
-- Views
-- ============================================================

CREATE OR REPLACE VIEW vw_question_stats AS
SELECT
  q.id AS question_id,
  q.question_text,
  q.question_type,
  g.name AS game_name,
  COUNT(a.id) AS total_attempts,
  SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_count,
  CAST(SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) AS DECIMAL(10,4))
    / NULLIF(COUNT(a.id), 0) * 100 AS accuracy_pct,
  AVG(CAST(a.response_ms AS FLOAT)) AS avg_response_ms
FROM game_questions q
JOIN game_question_sets gqs ON q.set_id = gqs.id
JOIN games g ON gqs.game_id = g.id
LEFT JOIN game_session_answers a ON a.question_id = q.id
GROUP BY q.id, q.question_text, q.question_type, g.name;

CREATE OR REPLACE VIEW vw_user_game_personal_best AS
SELECT
  gs.user_id,
  gs.game_id,
  g.name AS game_name,
  MAX(gs.score) AS personal_best,
  MAX(gs.max_combo) AS best_combo,
  COUNT(*) AS total_plays
FROM game_sessions gs
JOIN games g ON gs.game_id = g.id
WHERE gs.ended_at IS NOT NULL
GROUP BY gs.user_id, gs.game_id, g.name;


-- ============================================================
-- Stored Procedures → PostgreSQL Functions
-- sp_StartGameSession, sp_SubmitAnswer, sp_EndGameSession
-- ============================================================

-- sp_StartGameSession
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
  SELECT id, max_hearts INTO v_game_id, v_max_hearts
  FROM games WHERE slug = p_game_slug AND COALESCE(is_active, TRUE) = TRUE;

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
    SELECT questions_per_round INTO v_questions_per_round
    FROM game_question_sets WHERE id = v_actual_set_id;
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
    (user_id, game_id, score, correct_count, total_questions, hearts_remaining, set_id, started_at)
  VALUES (p_user_id, v_game_id, 0, 0, v_n, v_max_hearts, v_actual_set_id, NOW())
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

-- sp_SubmitAnswer
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

  -- Calculate current combo streak
  v_ord := (SELECT COALESCE(MAX(question_order), 0)
            FROM game_session_answers WHERE session_id = p_session_id);
  v_combo_now := 0;
  WHILE v_ord >= 1 LOOP
    IF EXISTS (SELECT 1 FROM game_session_answers
               WHERE session_id = p_session_id AND question_order = v_ord AND is_correct = TRUE) THEN
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
     response_ms, score_earned, combo_at_answer, power_up_used)
  VALUES
    (p_session_id, p_question_id, p_question_order, p_chosen_index, v_is_correct,
     p_response_ms, v_score_earned, v_combo_now, p_power_up_used);

  RETURN QUERY SELECT v_is_correct, v_correct_index, v_score_earned, v_combo_now, 0;
END;
$$;

-- sp_EndGameSession
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

  -- Update user_statistics
  INSERT INTO user_statistics (user_id, games_played, total_exp)
    VALUES (v_user_id, 1, v_exp_reward)
  ON CONFLICT (user_id) DO UPDATE SET
    games_played = user_statistics.games_played + 1,
    total_exp    = user_statistics.total_exp + v_exp_reward,
    updated_at   = NOW();

  -- Log activity
  INSERT INTO user_activities_log (user_id, activity_type, entity_type, entity_id, score)
  VALUES (v_user_id, 'game_completed', 'game', v_game_id, v_total_score);

  RETURN QUERY SELECT v_total_score, v_correct, v_total_q,
                      v_accuracy, v_max_combo, v_time_spent,
                      v_exp_reward, v_xu_reward;
END;
$$;
