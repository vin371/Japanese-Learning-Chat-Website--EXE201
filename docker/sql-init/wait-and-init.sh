#!/usr/bin/env bash
# Chờ SQL Server sẵn sàng rồi chạy 01 (DDL) + 02 (seed) — idempotent nếu YumegojiDB đã tồn tại.
set -euo pipefail

SQL_HOST="${SQL_HOST:-yumegoji-sql}"
SA_PASSWORD="${MSSQL_SA_PASSWORD:?Set MSSQL_SA_PASSWORD}"
SQL_DIR="${SQL_DIR:-/sql}"
MAX_WAIT="${MAX_WAIT:-90}"

if [[ -x /opt/mssql-tools18/bin/sqlcmd ]]; then
  SQLCMD=/opt/mssql-tools18/bin/sqlcmd
elif [[ -x /opt/mssql-tools/bin/sqlcmd ]]; then
  SQLCMD=/opt/mssql-tools/bin/sqlcmd
else
  echo "sqlcmd not found in container image." >&2
  exit 1
fi

sql_query() {
  "$SQLCMD" -S "$SQL_HOST" -U sa -P "$SA_PASSWORD" -C "$@"
}

echo "[db-init] Waiting for SQL Server at ${SQL_HOST} (max ${MAX_WAIT}s)..."
ready=0
for ((i = 1; i <= MAX_WAIT; i++)); do
  if sql_query -Q "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "[db-init] SQL Server did not become ready in time." >&2
  exit 1
fi

echo "[db-init] SQL Server is up."

db_id="$(sql_query -d master -Q "SET NOCOUNT ON; SELECT CONVERT(varchar(20), DB_ID(N'YumegojiDB'))" -h -1 -W | tr -d '[:space:]')"
if [[ -n "$db_id" && "$db_id" != "NULL" ]]; then
  echo "[db-init] YumegojiDB already exists (id=${db_id}) — skip DDL/seed."
  exit 0
fi

if [[ ! -f "${SQL_DIR}/01_yumegoji_database_DDL.sql" ]]; then
  echo "[db-init] Missing ${SQL_DIR}/01_yumegoji_database_DDL.sql" >&2
  exit 1
fi

echo "[db-init] Running 01_yumegoji_database_DDL.sql ..."
(cd "$SQL_DIR" && sql_query -d master -i "01_yumegoji_database_DDL.sql")

echo "[db-init] Running 02_yumegoji_database_seed.sql ..."
(cd "$SQL_DIR" && sql_query -d YumegojiDB -i "02_yumegoji_database_seed.sql")

echo "[db-init] Database initialized successfully."
