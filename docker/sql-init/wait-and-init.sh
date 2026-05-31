#!/usr/bin/env bash
# Chờ PostgreSQL sẵn sàng rồi chạy schema + seed Supabase — idempotent nếu đã có users.
set -euo pipefail

PGHOST="${PGHOST:-yumegoji-postgres}"
PGUSER="${PGUSER:-yumegoji}"
PGPASSWORD="${PGPASSWORD:?Set PGPASSWORD or POSTGRES_PASSWORD}"
PGDATABASE="${PGDATABASE:-yumegoji}"
SQL_DIR="${SQL_DIR:-/sql}"
MAX_WAIT="${MAX_WAIT:-90}"

export PGHOST PGUSER PGPASSWORD PGDATABASE

psql_cmd() {
  psql -v ON_ERROR_STOP=1 "$@"
}

echo "[db-init] Waiting for PostgreSQL at ${PGHOST} (max ${MAX_WAIT}s)..."
ready=0
for ((i = 1; i <= MAX_WAIT; i++)); do
  if pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "[db-init] PostgreSQL did not become ready in time." >&2
  exit 1
fi

echo "[db-init] PostgreSQL is up."

if psql_cmd -tAc "SELECT 1 FROM users LIMIT 1" 2>/dev/null | grep -q 1; then
  echo "[db-init] Database already initialized — skip schema/seed."
  exit 0
fi

schema="${SQL_DIR}/yumegoji_supabase.sql"
if [[ ! -f "$schema" ]]; then
  echo "[db-init] Missing ${schema}" >&2
  exit 1
fi

echo "[db-init] Running yumegoji_supabase.sql (schema)..."
psql_cmd -f "$schema"

parts_dir="${SQL_DIR}/yumegoji_supabase_data_v2_parts"
if [[ -d "$parts_dir" ]]; then
  mapfile -t part_files < <(find "$parts_dir" -name 'yumegoji_supabase_data_v2_part*.sql' | sort)
  if [[ ${#part_files[@]} -eq 0 ]]; then
    echo "[db-init] No seed parts found in ${parts_dir}" >&2
    exit 1
  fi
  for f in "${part_files[@]}"; do
    echo "[db-init] Running $(basename "$f") ..."
    psql_cmd -f "$f"
  done
else
  seed="${SQL_DIR}/yumegoji_supabase_data_v2_fixed.sql"
  if [[ ! -f "$seed" ]]; then
    echo "[db-init] Missing seed: ${parts_dir} or ${seed}" >&2
    exit 1
  fi
  echo "[db-init] Running yumegoji_supabase_data_v2_fixed.sql ..."
  psql_cmd -f "$seed"
fi

indexes="${SQL_DIR}/yumegoji_supabase_indexes.sql"
if [[ -f "$indexes" ]]; then
  echo "[db-init] Running yumegoji_supabase_indexes.sql ..."
  psql_cmd -f "$indexes"
fi

fks="${SQL_DIR}/yumegoji_supabase_missing_fks.sql"
if [[ -f "$fks" ]]; then
  echo "[db-init] Running yumegoji_supabase_missing_fks.sql ..."
  psql_cmd -f "$fks"
fi

echo "[db-init] Database initialized successfully."
