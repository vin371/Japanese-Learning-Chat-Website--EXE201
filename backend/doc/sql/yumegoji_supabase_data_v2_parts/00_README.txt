YUMEGOJI SUPABASE DATA - CHAY TUNG FILE THEO THU TU
===================================================
Thu muc trong repo: backend/doc/sql/

1. yumegoji_supabase.sql (schema)
2. Chay part01 -> part13 (moi part = 1 lan Run trong SQL Editor hoac psql)
3. Chay yumegoji_supabase_indexes.sql (tuy chon, khuyen nghi)
4. Chay yumegoji_supabase_missing_fks.sql (bo sung FK cho Schema Visualizer)

Hoac dung yumegoji_supabase_data_v2_fixed.sql thay cho part01-13.

1.  part01 (72 KB)   - levels, users, lessons, games setup...
2.  part02 (108 KB)  - game_questions
3.  part03 (37 KB)   - placement test
4.  part04 (64 KB)   - level-up test
5.  part05 (9 KB)    - posts, conversations
6.  part06 (26 KB)   - messages (nho)
7.  part07 (426 KB)  - 1 tin nhan co anh lon
8.  part08 (1 KB)    - messages tiep
9.  part09 (426 KB)  - 1 tin nhan co anh lon
10. part10 (5 KB)    - messages cuoi + setval
11. part11 (66 KB)   - chat rooms, game_sessions
12. part12 (106 KB)  - game_session_answers
13. part13 (32 KB)   - premium, inventory, ...

Lu y: Moi part tu commit (khong dung BEGIN/COMMIT xuyen part).
Neu part giua bi loi, xoa data da insert roi chay lai tu part loi.

Docker: docker compose up tu dong chay tat ca (service db-init).
