-- ============================================================
-- Yumegoji DB — Performance Indexes + Unique Constraints
-- Run AFTER schema + data loaded
-- ============================================================

-- Users
CREATE UNIQUE INDEX IF NOT EXISTS "UX_users_google_sub_partial" ON "users" ("google_sub") WHERE "google_sub" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_users_level_locked" ON "users" ("level_id", "is_locked");

-- Messages (performance-critical for chat)
CREATE INDEX IF NOT EXISTS "IX_messages_room_created" ON "messages" ("room_id", "created_at");
CREATE INDEX IF NOT EXISTS "IX_messages_conversation_id" ON "messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "IX_messages_user" ON "messages" ("user_id");

-- Game sessions
CREATE INDEX IF NOT EXISTS "IX_gs_user_game" ON "game_sessions" ("user_id", "game_id");
CREATE INDEX IF NOT EXISTS "IX_gs_ended" ON "game_sessions" ("ended_at");
CREATE INDEX IF NOT EXISTS "IX_gsa_sess" ON "game_session_answers" ("session_id", "question_order");
CREATE INDEX IF NOT EXISTS "IX_gsa_q" ON "game_session_answers" ("question_id", "is_correct");
CREATE INDEX IF NOT EXISTS "IX_gspu_sess" ON "game_session_powerups" ("session_id");

-- Game questions
CREATE INDEX IF NOT EXISTS "IX_gqs_game_level" ON "game_question_sets" ("game_id", "level_id");
CREATE INDEX IF NOT EXISTS "IX_gq_set" ON "game_questions" ("set_id", "question_type", "is_active");

-- Notifications
CREATE INDEX IF NOT EXISTS "IX_notifications_user_read" ON "notifications" ("user_id", "read_at");
CREATE INDEX IF NOT EXISTS "IX_notifications_created" ON "notifications" ("created_at");

-- Leaderboard
CREATE INDEX IF NOT EXISTS "IX_leaderboard_entries_period_rank" ON "leaderboard_entries" ("period_id", "rank");

-- Premium
CREATE UNIQUE INDEX IF NOT EXISTS "UX_premium_req_token" ON "premium_payment_requests" ("token");
CREATE INDEX IF NOT EXISTS "IX_premium_req_status" ON "premium_payment_requests" ("status", "id" DESC);
CREATE INDEX IF NOT EXISTS "IX_premium_req_user" ON "premium_payment_requests" ("user_id", "id" DESC);
CREATE INDEX IF NOT EXISTS "IX_premium_sub_user" ON "premium_subscriptions" ("user_id", "expires_at" DESC);

-- Lessons
CREATE INDEX IF NOT EXISTS "IX_lessons_category_published_sort" ON "lessons" ("category_id", "is_published", "sort_order");
CREATE INDEX IF NOT EXISTS "IX_lesson_quiz_lesson_sort" ON "lesson_quiz_questions" ("lesson_id", "sort_order");

-- Social
CREATE INDEX IF NOT EXISTS "IX_posts_user_created" ON "posts" ("user_id", "created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_post_reactions_unique" ON "post_reactions" ("post_id", "user_id", "emoji");

-- Friends
CREATE INDEX IF NOT EXISTS "IX_friend_requests_to_status" ON "friend_requests" ("to_user_id", "status");
CREATE INDEX IF NOT EXISTS "IX_friendships_friend" ON "friendships" ("friend_id");

-- Transactions
CREATE INDEX IF NOT EXISTS "IX_transactions_user" ON "transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "IX_transactions_created" ON "transactions" ("created_at");
CREATE INDEX IF NOT EXISTS "IX_transactions_reference" ON "transactions" ("payment_reference");

-- Reports/Moderation
CREATE INDEX IF NOT EXISTS "IX_reports_status" ON "reports" ("status");
CREATE INDEX IF NOT EXISTS "IX_reports_reported_user" ON "reports" ("reported_user_id");
CREATE INDEX IF NOT EXISTS "IX_reports_created" ON "reports" ("created_at");

-- User activities
CREATE INDEX IF NOT EXISTS "IX_user_activities_log_user_created" ON "user_activities_log" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "IX_user_activities_log_type_created" ON "user_activities_log" ("activity_type", "created_at");

-- Placement / Level-up
CREATE INDEX IF NOT EXISTS "IX_placement_results_user" ON "placement_results" ("user_id");
CREATE INDEX IF NOT EXISTS "IX_placement_results_app_user_created" ON "placement_results_app" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "IX_level_up_results_user_created" ON "level_up_results" ("user_id", "created_at");

-- PvP
CREATE INDEX IF NOT EXISTS "IX_pvp_status" ON "pvp_rooms" ("status", "level_id");
CREATE INDEX IF NOT EXISTS "IX_pvp_host" ON "pvp_rooms" ("host_user_id", "status");

-- Chatbot
CREATE INDEX IF NOT EXISTS "IX_chatbot_messages_conversation_created" ON "chatbot_messages" ("conversation_id", "created_at");

-- Conversations
CREATE UNIQUE INDEX IF NOT EXISTS "IX_conversation_members_unique" ON "conversation_members" ("conversation_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_conversations_slug" ON "conversations" ("slug") WHERE "slug" IS NOT NULL;

-- Analytics
CREATE INDEX IF NOT EXISTS "IX_analytics_snapshots_date_metric" ON "analytics_snapshots" ("snapshot_date", "metric_name");

-- Audit
CREATE INDEX IF NOT EXISTS "IX_audit_logs_actor" ON "audit_logs" ("actor_id");
CREATE INDEX IF NOT EXISTS "IX_audit_logs_created" ON "audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "IX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");

-- Misc
CREATE INDEX IF NOT EXISTS "IX_boss_battles_game" ON "boss_battles" ("game_id", "is_active");
CREATE INDEX IF NOT EXISTS "IX_subscriptions_user_status" ON "subscriptions" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "IX_quick_quiz_results_user_quiz" ON "quick_quiz_results" ("user_id", "quick_quiz_id");
CREATE INDEX IF NOT EXISTS "IX_user_mutes_user_until" ON "user_mutes" ("user_id", "muted_until");
CREATE INDEX IF NOT EXISTS "IX_ai_learning_recommendations_user_created" ON "ai_learning_recommendations" ("user_id", "created_at");
