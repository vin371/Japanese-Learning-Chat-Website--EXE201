-- Supabase/PostgreSQL: user_inventory.created_at NOT NULL nhưng không có DEFAULT.
-- Code cũ (SQL Server) chỉ INSERT (user_id, power_up_id, quantity, updated_at) → lỗi 23502 trên production.
-- Chạy patch này trên Supabase SQL Editor nếu chưa redeploy backend mới (commit 4e48183+).

ALTER TABLE user_inventory
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE user_inventory
  ALTER COLUMN updated_at SET DEFAULT NOW();
