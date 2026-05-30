-- Yumegoji seed PART 13/13 (run 01 -> 13 in order)
-- File: yumegoji_supabase_data_v2_part13.sql
-- game_session_powerups (21 rows)
-- ============================================================
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (1, 7, 12, 1, '2026-03-29T07:00:30.4807202');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (2, 7, 12, 2, '2026-03-29T07:00:31.0201196');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (3, 7, 12, 3, '2026-03-29T07:00:31.3484811');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (4, 7, 12, 4, '2026-03-29T07:00:31.5794573');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (5, 7, 12, 5, '2026-03-29T07:00:31.8260779');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (6, 7, 11, 6, '2026-03-29T07:00:39.5617283');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (7, 7, 10, 7, '2026-03-29T07:00:42.8662288');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (8, 13, 8, 1, '2026-03-29T13:56:57.6156750');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (9, 13, 11, 2, '2026-03-29T13:57:13.6807846');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (10, 13, 10, 3, '2026-03-29T13:57:16.5533619');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (11, 13, 10, 4, '2026-03-29T13:57:17.3055755');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (12, 13, 8, 5, '2026-03-29T13:57:22.4468345');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (13, 13, 11, 6, '2026-03-29T13:57:51.2230455');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (14, 20, 11, 1, '2026-03-29T14:55:12.1981184');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (15, 20, 10, 2, '2026-03-29T14:55:15.8991573');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (16, 22, 7, 1, '2026-03-30T00:47:48.5434761');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (17, 34, 12, 1, '2026-03-30T02:24:24.1129172');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (18, 1083, 7, 1, '2026-04-20T07:22:15.1688552');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (19, 1083, 11, 2, '2026-04-20T07:22:21.5665434');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (20, 1083, 10, 3, '2026-04-20T07:22:24.1657412');
INSERT INTO "game_session_powerups" ("id", "session_id", "power_up_id", "used_at_order", "used_at") VALUES (21, 1107, 5, 1, '2026-04-23T05:21:53.8505724');
SELECT setval(pg_get_serial_sequence('"game_session_powerups"', 'id'), COALESCE((SELECT MAX(id) FROM "game_session_powerups"),0)+1, false);

-- ============================================================
-- premium_payment_requests (3 rows)
-- ============================================================
INSERT INTO "premium_payment_requests" ("id", "user_id", "token", "amount_vnd", "duration_days", "status", "created_at", "confirmed_at", "approved_at", "approved_by", "note", "bank_code", "account_no", "account_name") VALUES (1, 28, 'NAPR66D2Yume', 10000, 30, 'approved', '2026-03-30T09:45:48.2433333', '2026-03-30T09:45:57.0233086', '2026-03-30T09:49:44.7333333', 1, '', 'ICB', '105877558159', 'HOANG NGUYEN THE VINH');
INSERT INTO "premium_payment_requests" ("id", "user_id", "token", "amount_vnd", "duration_days", "status", "created_at", "confirmed_at", "approved_at", "approved_by", "note", "bank_code", "account_no", "account_name") VALUES (2, 30, 'NAP2ML2PYume', 10000, 30, 'created', '2026-04-01T04:14:41.2400000', NULL, NULL, NULL, NULL, 'ICB', '105877558159', 'HOANG NGUYEN THE VINH');
INSERT INTO "premium_payment_requests" ("id", "user_id", "token", "amount_vnd", "duration_days", "status", "created_at", "confirmed_at", "approved_at", "approved_by", "note", "bank_code", "account_no", "account_name") VALUES (3, 31, 'NAPJ2LFKYume', 10000, 30, 'created', '2026-05-01T01:26:06.8333333', NULL, NULL, NULL, NULL, 'ICB', '105877558159', 'HOANG NGUYEN THE VINH');
SELECT setval(pg_get_serial_sequence('"premium_payment_requests"', 'id'), COALESCE((SELECT MAX(id) FROM "premium_payment_requests"),0)+1, false);

-- ============================================================
-- premium_subscriptions (1 rows)
-- ============================================================
INSERT INTO "premium_subscriptions" ("id", "user_id", "payment_request_id", "started_at", "expires_at", "is_active") VALUES (1, 28, 1, '2026-03-30T09:49:44.7333333', '2026-04-29T09:49:44.7333333', true);
SELECT setval(pg_get_serial_sequence('"premium_subscriptions"', 'id'), COALESCE((SELECT MAX(id) FROM "premium_subscriptions"),0)+1, false);

-- ============================================================
-- user_activities_log (64 rows)
-- ============================================================
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (1, 28, 'game_completed', 'game', 10, 0, NULL, '2026-03-29T11:27:43.7221928');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (2, 28, 'game_completed', 'game', 12, 220, NULL, '2026-03-29T11:29:10.1252011');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (3, 28, 'game_completed', 'game', 12, 263, NULL, '2026-03-29T11:29:21.0980806');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (4, 28, 'game_completed', 'game', 7, 0, NULL, '2026-03-29T14:06:46.2293509');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (5, 28, 'game_completed', 'game', 8, 100, NULL, '2026-03-29T14:07:12.9912031');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (6, 28, 'game_completed', 'game', 10, 544, NULL, '2026-03-29T20:57:51.3288481');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (7, 28, 'game_completed', 'game', 14, 0, NULL, '2026-03-29T21:00:34.7476354');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (8, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-29T21:24:00.7047670');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (9, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-29T21:24:35.3505914');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (10, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-29T21:24:42.9662935');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (11, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-29T21:38:23.1365177');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (12, 28, 'game_completed', 'game', 10, 0, NULL, '2026-03-29T21:55:45.0682376');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (13, 28, 'game_completed', 'game', 5, 0, NULL, '2026-03-29T21:56:32.1833133');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (14, 28, 'game_completed', 'game', 10, 90, NULL, '2026-03-30T07:48:15.6370284');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (15, 28, 'game_completed', 'game', 12, 0, NULL, '2026-03-30T07:49:33.2169969');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (16, 28, 'game_completed', 'game', 10, 0, NULL, '2026-03-30T07:55:49.4099521');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (17, 28, 'game_completed', 'game', 14, 10, NULL, '2026-03-30T07:57:25.2091008');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (18, 28, 'game_completed', 'game', 14, 0, NULL, '2026-03-30T07:57:47.6625559');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (19, 28, 'game_completed', 'game', 14, 10, NULL, '2026-03-30T08:17:53.3007364');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (20, 28, 'game_completed', 'game', 10, 100, NULL, '2026-03-30T08:51:10.2864406');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (21, 28, 'game_completed', 'game', 10, 100, NULL, '2026-03-30T09:12:37.2600106');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (22, 28, 'game_completed', 'game', 12, 100, NULL, '2026-03-30T09:13:35.0486440');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (23, 28, 'game_completed', 'game', 10, 100, NULL, '2026-03-30T09:22:44.8399857');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (24, 28, 'game_completed', 'game', 10, 100, NULL, '2026-03-30T09:23:52.5564066');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (25, 28, 'game_completed', 'game', 10, 100, NULL, '2026-03-30T09:24:37.9301359');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (26, 28, 'game_completed', 'game', 14, 10, NULL, '2026-03-30T09:25:12.2502597');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (27, 28, 'game_completed', 'game', 10, 10, NULL, '2026-03-30T09:36:24.7789507');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (28, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-30T09:39:51.2017565');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (29, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-30T09:39:59.1202408');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (30, 28, 'game_completed', 'game', 13, 0, NULL, '2026-03-30T09:41:13.0924480');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (31, 28, 'game_completed', 'game', 13, 40, NULL, '2026-03-30T10:02:13.2680707');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (32, 28, 'game_completed', 'game', 14, 20, NULL, '2026-03-30T10:02:45.5550620');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (33, 28, 'game_completed', 'game', 2, 0, NULL, '2026-03-30T10:03:13.7536752');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (34, 28, 'game_completed', 'game', 8, 50, NULL, '2026-03-30T10:03:52.1473292');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (35, 28, 'game_completed', 'game', 8, 0, NULL, '2026-03-30T10:04:28.1276276');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (36, 28, 'game_completed', 'game', 6, 100, NULL, '2026-03-30T10:09:15.3702478');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (37, 28, 'game_completed', 'game', 7, 0, NULL, '2026-03-30T10:10:27.0519331');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (38, 28, 'game_completed', 'game', 7, 0, NULL, '2026-03-30T10:10:48.8002880');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (39, 28, 'game_completed', 'game', 6, 0, NULL, '2026-03-30T13:51:43.9624954');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (40, 28, 'game_completed', 'game', 6, 0, NULL, '2026-03-30T13:52:21.8134768');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (41, 28, 'game_completed', 'game', 6, 0, NULL, '2026-03-30T14:27:02.3988858');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (42, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-01T07:35:32.9419674');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (43, 28, 'game_completed', 'game', 10, 20, NULL, '2026-04-20T12:50:52.2231513');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (44, 28, 'game_completed', 'game', 10, 30, NULL, '2026-04-20T13:07:22.8504610');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (45, 28, 'game_completed', 'game', 10, 20, NULL, '2026-04-20T13:37:07.9520136');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (46, 28, 'game_completed', 'game', 10, 80, NULL, '2026-04-20T13:54:11.4031188');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (47, 28, 'game_completed', 'game', 10, 90, NULL, '2026-04-20T13:57:57.2641543');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (48, 28, 'game_completed', 'game', 10, 90, NULL, '2026-04-20T14:08:28.7147874');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (49, 28, 'game_completed', 'game', 10, 50, NULL, '2026-04-20T14:18:28.3742760');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (50, 28, 'game_completed', 'game', 10, 80, NULL, '2026-04-20T14:19:14.9753470');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (51, 28, 'game_completed', 'game', 14, 0, NULL, '2026-04-20T14:39:03.5037141');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (52, 28, 'game_completed', 'game', 8, 0, NULL, '2026-04-20T15:03:46.2808916');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (53, 28, 'game_completed', 'game', 8, 80, NULL, '2026-04-20T15:04:31.3046305');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (54, 28, 'game_completed', 'game', 10, 0, NULL, '2026-04-20T15:07:24.7918865');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (55, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-20T15:08:35.1305014');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (56, 28, 'game_completed', 'game', 10, 80, NULL, '2026-04-20T15:09:10.4846854');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (57, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-20T15:09:28.1559830');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (58, 28, 'game_completed', 'game', 10, 80, NULL, '2026-04-20T15:19:37.1590989');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (59, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-20T15:20:02.9793750');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (60, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-20T17:04:42.8550467');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (61, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-23T12:22:03.9195700');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (62, 28, 'game_completed', 'game', 10, 100, NULL, '2026-04-23T12:42:58.7238009');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (63, 31, 'game_completed', 'game', 10, 100, NULL, '2026-05-01T08:59:03.5421577');
INSERT INTO "user_activities_log" ("id", "user_id", "activity_type", "entity_type", "entity_id", "score", "metadata", "created_at") VALUES (64, 32, 'game_completed', 'game', 10, 100, NULL, '2026-05-11T17:34:46.9868170');
SELECT setval(pg_get_serial_sequence('"user_activities_log"', 'id'), COALESCE((SELECT MAX(id) FROM "user_activities_log"),0)+1, false);

-- ============================================================
-- user_lesson_progress (7 rows)
-- ============================================================
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (1, 28, 1, 'completed', 100, '2026-03-28T17:56:46.0445629', '2026-03-28T17:56:46.0445629', '2026-03-28T17:56:46.0445629', '2026-03-28T17:56:46.0445629');
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (2, 28, 3, 'completed', 100, '2026-03-28T17:57:27.5589342', '2026-03-28T17:57:27.5589342', '2026-03-28T17:57:27.5589342', '2026-03-28T17:57:27.5589342');
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (3, 28, 4, 'completed', 100, '2026-03-28T19:00:26.6213220', '2026-03-28T19:00:26.6213220', '2026-03-28T19:00:26.6213220', '2026-03-28T19:00:26.6213220');
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (4, 28, 2, 'completed', 100, '2026-03-28T19:00:32.0143226', '2026-03-28T19:00:32.0143226', '2026-03-28T19:00:32.0143226', '2026-03-28T19:00:32.0143226');
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (5, 28, 7, 'completed', 100, '2026-03-28T19:00:47.4828038', '2026-03-28T19:00:47.4828038', '2026-03-28T19:00:47.4828038', '2026-03-28T19:00:47.4828038');
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (6, 28, 5, 'completed', 100, '2026-03-28T19:00:54.3793153', '2026-03-28T19:00:54.3793153', '2026-03-28T19:00:54.3793153', '2026-03-28T19:00:54.3793153');
INSERT INTO "user_lesson_progress" ("id", "user_id", "lesson_id", "status", "progress_percent", "completed_at", "last_accessed_at", "created_at", "updated_at") VALUES (8, 29, 14, 'completed', 100, '2026-04-07T06:38:46.4942193', '2026-04-07T06:38:46.4942193', '2026-04-07T06:38:46.4942193', '2026-04-07T06:38:46.4942193');
SELECT setval(pg_get_serial_sequence('"user_lesson_progress"', 'id'), COALESCE((SELECT MAX(id) FROM "user_lesson_progress"),0)+1, false);

-- ============================================================
-- user_inventory (54 rows)
-- ============================================================
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (1, 1, 1, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (2, 1, 2, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (3, 1, 3, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (4, 1, 4, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (5, 1, 5, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (6, 1, 6, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (7, 1, 7, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (8, 1, 8, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (9, 1, 9, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (10, 1, 10, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (11, 1, 11, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (12, 1, 12, 3, '2026-03-29T11:23:48.1909418', '2026-03-29T04:23:48.1909418');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (13, 28, 1, 6, '2026-03-29T13:27:56.6594229', '2026-03-30T02:11:51.2881372');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (14, 28, 2, 5, '2026-03-29T13:27:56.6594229', '2026-03-29T06:27:56.6594229');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (15, 28, 3, 6, '2026-03-29T13:27:56.6594229', '2026-04-20T07:20:52.1099407');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (16, 28, 4, 5, '2026-03-29T13:27:56.6594229', '2026-03-29T06:27:56.6594229');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (17, 28, 5, 5, '2026-03-29T13:27:56.6594229', '2026-04-23T05:21:53.8435331');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (18, 28, 6, 5, '2026-03-29T13:27:56.6594229', '2026-03-29T06:27:56.6594229');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (19, 28, 7, 3, '2026-03-29T13:27:56.6594229', '2026-04-20T07:22:15.1612428');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (20, 28, 8, 3, '2026-03-29T13:27:56.6594229', '2026-03-29T13:57:22.4468345');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (21, 28, 9, 5, '2026-03-29T13:27:56.6594229', '2026-03-29T06:27:56.6594229');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (22, 28, 10, 0, '2026-03-29T13:27:56.6594229', '2026-04-20T07:22:24.1642020');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (23, 28, 11, 2, '2026-03-29T13:27:56.6594229', '2026-04-23T05:09:13.0061373');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (24, 28, 12, 0, '2026-03-29T13:27:56.6594229', '2026-03-30T02:24:24.1071622');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (25, 30, 1, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (26, 30, 2, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (27, 30, 3, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (28, 30, 4, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (29, 30, 6, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (30, 30, 7, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (31, 30, 8, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (32, 30, 10, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (33, 30, 11, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (34, 30, 12, 10, '2026-04-01T09:34:25.7510652', '2026-04-01T02:34:25.7510652');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (35, 31, 1, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (36, 31, 2, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (37, 31, 3, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (38, 31, 4, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (39, 31, 6, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (40, 31, 7, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (41, 31, 8, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (42, 31, 10, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (43, 31, 11, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (44, 31, 12, 10, '2026-04-01T09:37:45.8990532', '2026-04-01T02:37:45.8990532');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (45, 32, 1, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (46, 32, 2, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (47, 32, 3, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (48, 32, 4, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (49, 32, 6, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (50, 32, 7, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (51, 32, 8, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (52, 32, 10, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (53, 32, 11, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
INSERT INTO "user_inventory" ("id", "user_id", "power_up_id", "quantity", "created_at", "updated_at") VALUES (54, 32, 12, 10, '2026-05-11T17:34:27.2191793', '2026-05-11T10:34:27.2191793');
SELECT setval(pg_get_serial_sequence('"user_inventory"', 'id'), COALESCE((SELECT MAX(id) FROM "user_inventory"),0)+1, false);

