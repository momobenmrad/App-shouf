#!/usr/bin/env bash
# Applies every migration on a throwaway Postgres and runs the SQL test files.
# Uses $DATABASE_URL when set (CI service container); otherwise starts a temporary local cluster.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL_OPTS=(-v ON_ERROR_STOP=1 -q -X)

cleanup() { :; }
if [[ -z "${DATABASE_URL:-}" ]]; then
  PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
  TMP="$(mktemp -d)"
  chmod 777 "$TMP"
  AS=()
  if [[ "$(id -u)" == "0" ]]; then AS=(runuser -u postgres --); fi
  "${AS[@]}" "$PG_BIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
  "${AS[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -o "-k $TMP -p 54329 -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null
  cleanup() { "${AS[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null; rm -rf "$TMP"; }
  DATABASE_URL="postgresql://postgres@/postgres?host=$TMP&port=54329"
fi
trap cleanup EXIT

run() { psql "$DATABASE_URL" "${PSQL_OPTS[@]}" "$@"; }

run -f "$ROOT/tests/stub_supabase.sql"
for f in "$ROOT"/migrations/*.sql; do
  echo "migrate $(basename "$f")"
  run -f "$f"
done
run -f "$ROOT/seed.sql"
for f in "$ROOT"/tests/*.test.sql; do
  echo "test    $(basename "$f")"
  run -o /dev/null -f "$f"
done
echo "OK"
