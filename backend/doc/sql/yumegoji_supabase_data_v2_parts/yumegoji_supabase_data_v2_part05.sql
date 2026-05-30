-- Yumegoji seed PART 5/13 (run 01 -> 13 in order)
-- File: yumegoji_supabase_data_v2_part05.sql
-- level_up_results (1 rows)
-- ============================================================
INSERT INTO "level_up_results" ("id", "user_id", "test_id", "from_level", "to_level", "score", "max_score", "is_passed", "created_at") VALUES (1, 28, 1, 'N5', 'N4', 0, 40, false, '2026-04-15T05:46:15.5824491');
SELECT setval(pg_get_serial_sequence('"level_up_results"', 'id'), COALESCE((SELECT MAX(id) FROM "level_up_results"),0)+1, false);

-- ============================================================
-- quick_quizzes (2 rows)
-- ============================================================
INSERT INTO "quick_quizzes" ("id", "level_id", "title", "type", "question_count", "duration_seconds", "is_active", "created_at", "updated_at") VALUES (1, 1, 'Quiz từ vựng N5 - Chào hỏi', 'vocabulary', 5, 120, true, '2026-03-16T07:55:09.6627227', '2026-03-16T07:55:09.6627227');
INSERT INTO "quick_quizzes" ("id", "level_id", "title", "type", "question_count", "duration_seconds", "is_active", "created_at", "updated_at") VALUES (2, 1, 'Quiz số đếm N5', 'vocabulary', 10, 180, true, '2026-03-16T07:55:09.6627227', '2026-03-16T07:55:09.6627227');
SELECT setval(pg_get_serial_sequence('"quick_quizzes"', 'id'), COALESCE((SELECT MAX(id) FROM "quick_quizzes"),0)+1, false);

-- ============================================================
-- quick_quiz_questions (4 rows)
-- ============================================================
INSERT INTO "quick_quiz_questions" ("id", "quick_quiz_id", "question_text", "options", "correct_answer_index", "explanation", "sort_order", "created_at", "updated_at") VALUES (1, 1, '「こんにちは」はいつ使いますか。', '["A. Buổi sáng", "B. Buổi trưa/chiều", "C. Buổi tối", "D. Khi đi ngủ"]', 1, 'こんにちは = chào buổi trưa/chiều', 1, '2026-03-16T07:55:09.6627227', '2026-03-16T07:55:09.6627227');
INSERT INTO "quick_quiz_questions" ("id", "quick_quiz_id", "question_text", "options", "correct_answer_index", "explanation", "sort_order", "created_at", "updated_at") VALUES (2, 1, '「さようなら」の意味は？', '["A. Xin chào", "B. Cảm ơn", "C. Tạm biệt", "D. Xin lỗi"]', 2, 'さようなら = Tạm biệt', 2, '2026-03-16T07:55:09.6627227', '2026-03-16T07:55:09.6627227');
INSERT INTO "quick_quiz_questions" ("id", "quick_quiz_id", "question_text", "options", "correct_answer_index", "explanation", "sort_order", "created_at", "updated_at") VALUES (3, 2, '「5」は日本語で？', '["A. し", "B. ご", "C. ろく", "D. なな"]', 1, '5 = ご', 1, '2026-03-16T07:55:09.6627227', '2026-03-16T07:55:09.6627227');
INSERT INTO "quick_quiz_questions" ("id", "quick_quiz_id", "question_text", "options", "correct_answer_index", "explanation", "sort_order", "created_at", "updated_at") VALUES (4, 2, '「7」の読みは？', '["A. しち", "B. はち", "C. きゅう", "D. じゅう"]', 0, '7 = なな hoặc しち', 2, '2026-03-16T07:55:09.6627227', '2026-03-16T07:55:09.6627227');
SELECT setval(pg_get_serial_sequence('"quick_quiz_questions"', 'id'), COALESCE((SELECT MAX(id) FROM "quick_quiz_questions"),0)+1, false);

-- ============================================================
-- posts (5 rows)
-- ============================================================
INSERT INTO "posts" ("id", "user_id", "content", "image_url", "is_deleted", "created_at", "updated_at") VALUES (1, 28, 'vinhdz', NULL, true, '2026-04-01T07:10:23.1752935', '2026-04-01T08:26:03.6160771');
INSERT INTO "posts" ("id", "user_id", "content", "image_url", "is_deleted", "created_at", "updated_at") VALUES (2, 28, 'Thật đẹp', '/uploads/beba0c991c0145bca8c7a3f7df2069e6.png', true, '2026-04-01T07:14:42.7460958', '2026-04-01T07:37:48.8554017');
INSERT INTO "posts" ("id", "user_id", "content", "image_url", "is_deleted", "created_at", "updated_at") VALUES (3, 28, NULL, '/uploads/84901ec9b32e4231beb44f10e4acebfb.png', false, '2026-04-01T07:37:55.8938080', '2026-04-01T07:37:55.8938080');
INSERT INTO "posts" ("id", "user_id", "content", "image_url", "is_deleted", "created_at", "updated_at") VALUES (4, 28, 'vinhdz', '/uploads/f4fccb7e204745d888e17730f75b8bb0.png', true, '2026-04-01T08:25:37.8857139', '2026-04-01T09:47:31.5559589');
INSERT INTO "posts" ("id", "user_id", "content", "image_url", "is_deleted", "created_at", "updated_at") VALUES (5, 28, 'hi❤️', '/uploads/2152197aaa814610956875cd86a631db.png', false, '2026-04-07T01:08:26.3494545', '2026-04-07T01:08:26.3494545');
SELECT setval(pg_get_serial_sequence('"posts"', 'id'), COALESCE((SELECT MAX(id) FROM "posts"),0)+1, false);

-- ============================================================
-- post_reactions (3 rows)
-- ============================================================
INSERT INTO "post_reactions" ("id", "post_id", "user_id", "emoji", "created_at") VALUES (19, 3, 28, '👍', '2026-04-01T10:03:51.3258463');
INSERT INTO "post_reactions" ("id", "post_id", "user_id", "emoji", "created_at") VALUES (20, 3, 28, '❤️', '2026-04-01T10:09:33.4299293');
INSERT INTO "post_reactions" ("id", "post_id", "user_id", "emoji", "created_at") VALUES (23, 5, 28, '❤️', '2026-04-15T10:05:39.4390624');
SELECT setval(pg_get_serial_sequence('"post_reactions"', 'id'), COALESCE((SELECT MAX(id) FROM "post_reactions"),0)+1, false);

-- ============================================================
-- post_comments (4 rows)
-- ============================================================
INSERT INTO "post_comments" ("id", "post_id", "user_id", "content", "is_deleted", "created_at") VALUES (1, 3, 28, 'hi', false, '2026-04-01T09:54:31.3764412');
INSERT INTO "post_comments" ("id", "post_id", "user_id", "content", "is_deleted", "created_at") VALUES (2, 3, 28, 'hi', false, '2026-04-01T10:03:57.8310728');
INSERT INTO "post_comments" ("id", "post_id", "user_id", "content", "is_deleted", "created_at") VALUES (3, 3, 28, 'hi', false, '2026-04-01T10:04:18.5904709');
INSERT INTO "post_comments" ("id", "post_id", "user_id", "content", "is_deleted", "created_at") VALUES (4, 3, 28, 'hi', false, '2026-04-20T08:10:21.5342633');
SELECT setval(pg_get_serial_sequence('"post_comments"', 'id'), COALESCE((SELECT MAX(id) FROM "post_comments"),0)+1, false);

-- ============================================================
-- conversations (3 rows)
-- ============================================================
INSERT INTO "conversations" ("id", "name", "type", "created_at", "updated_at", "kind", "slug", "category", "level_id", "max_members", "avatar_url", "created_by") VALUES (1, NULL, 'Direct', '2026-03-18T09:19:51.6061074', '2026-03-18T09:19:51.6061074', 'Private', NULL, NULL, NULL, NULL, NULL, 21);
INSERT INTO "conversations" ("id", "name", "type", "created_at", "updated_at", "kind", "slug", "category", "level_id", "max_members", "avatar_url", "created_by") VALUES (2, NULL, 'Direct', '2026-03-18T09:22:38.5209866', '2026-03-18T09:22:38.5209866', 'Private', NULL, NULL, NULL, NULL, NULL, 23);
INSERT INTO "conversations" ("id", "name", "type", "created_at", "updated_at", "kind", "slug", "category", "level_id", "max_members", "avatar_url", "created_by") VALUES (3, NULL, 'Direct', '2026-03-18T09:24:03.1430352', '2026-03-18T09:24:03.1684377', 'Private', NULL, NULL, NULL, NULL, NULL, 25);
SELECT setval(pg_get_serial_sequence('"conversations"', 'id'), COALESCE((SELECT MAX(id) FROM "conversations"),0)+1, false);

-- ============================================================
-- conversation_members (6 rows)
-- ============================================================
INSERT INTO "conversation_members" ("id", "conversation_id", "user_id", "joined_at", "last_read_message_id") VALUES (1, 1, 22, '2026-03-18T09:19:51.6061074', NULL);
INSERT INTO "conversation_members" ("id", "conversation_id", "user_id", "joined_at", "last_read_message_id") VALUES (2, 1, 21, '2026-03-18T09:19:51.6061074', NULL);
INSERT INTO "conversation_members" ("id", "conversation_id", "user_id", "joined_at", "last_read_message_id") VALUES (3, 2, 24, '2026-03-18T09:22:38.5209866', NULL);
INSERT INTO "conversation_members" ("id", "conversation_id", "user_id", "joined_at", "last_read_message_id") VALUES (4, 2, 23, '2026-03-18T09:22:38.5209866', NULL);
INSERT INTO "conversation_members" ("id", "conversation_id", "user_id", "joined_at", "last_read_message_id") VALUES (5, 3, 26, '2026-03-18T09:24:03.1430352', NULL);
INSERT INTO "conversation_members" ("id", "conversation_id", "user_id", "joined_at", "last_read_message_id") VALUES (6, 3, 25, '2026-03-18T09:24:03.1430352', NULL);
SELECT setval(pg_get_serial_sequence('"conversation_members"', 'id'), COALESCE((SELECT MAX(id) FROM "conversation_members"),0)+1, false);

-- ============================================================
-- chat_rooms (12 rows) — MUST run before messages (part06)
-- messages.conversation_id FK -> chat_rooms.id
-- ============================================================
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (1, 'Phòng N5 - Sơ cấp', 'room-n5', 'level', 1, 'Trò chuyện cho người học N5', NULL, NULL, true, 1, '2026-03-16T07:55:09.6639317', '2026-03-26T03:02:36.1067976');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (2, 'Phòng N4', 'room-n4', 'level', 2, 'Trò chuyện cho người học N4', NULL, NULL, true, 1, '2026-03-16T07:55:09.6639317', '2026-03-26T00:23:38.1744497');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (3, 'Phòng N3', 'room-n3', 'level', 3, 'Trò chuyện cho người học N3', NULL, NULL, true, 1, '2026-03-16T07:55:09.6639317', '2026-03-28T08:11:25.7855950');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (4, 'Phòng chung', 'general', 'public', NULL, 'Trò chuyện chung bằng tiếng Nhật', NULL, NULL, true, 1, '2026-03-16T07:55:09.6639317', '2026-03-26T07:00:16.8753017');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (5, 'Vinh', NULL, 'group', NULL, NULL, NULL, 50, false, 27, '2026-03-25T02:55:05.3728589', '2026-03-26T04:12:31.5716274');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (6, 'N5', NULL, 'group', NULL, NULL, NULL, 50, false, 27, '2026-03-25T03:05:44.3748022', '2026-03-26T05:48:18.2918557');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (7, 'Direct: 28_27', 'direct-27-28', 'private', NULL, NULL, NULL, NULL, true, 28, '2026-03-25T03:34:23.4566336', '2026-03-26T07:34:03.3706935');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (8, 'hi', NULL, 'group', NULL, NULL, NULL, 50, true, 28, '2026-03-25T03:34:34.6023528', '2026-03-25T03:34:34.6023528');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (9, 'Direct: 28_1', 'direct-1-28', 'private', NULL, NULL, NULL, NULL, true, 28, '2026-03-25T04:02:22.0905795', '2026-03-25T04:02:22.0905795');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (11, 'vinh', NULL, 'group', NULL, NULL, NULL, 50, false, 27, '2026-03-26T05:47:26.1435569', '2026-03-26T05:47:46.7128971');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (12, 'Direct: 28_8', 'direct-8-28', 'private', NULL, NULL, NULL, NULL, true, 28, '2026-04-03T08:25:47.6033663', '2026-04-03T08:25:47.6033663');
INSERT INTO "chat_rooms" ("id", "name", "slug", "type", "level_id", "description", "avatar_url", "max_members", "is_active", "created_by", "created_at", "updated_at") VALUES (13, 'Direct: 28_30', 'direct-28-30', 'private', NULL, NULL, NULL, NULL, true, 28, '2026-04-07T03:06:16.4412926', '2026-04-07T03:06:41.0917822');
SELECT setval(pg_get_serial_sequence('"chat_rooms"', 'id'), COALESCE((SELECT MAX(id) FROM "chat_rooms"),0)+1, false);

