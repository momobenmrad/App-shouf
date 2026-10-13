#!/usr/bin/env bash
# Runs once, on the first start of the demo database (docker-entrypoint-initdb.d).
# Same schema as production: the Supabase stand-in, every migration, the base seed, then the demo content.
set -euo pipefail
run() { psql -v ON_ERROR_STOP=1 -q -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" "$@"; }

run -f /chouf/supabase/tests/stub_supabase.sql
run <<'SQL'
-- PostgREST passes the JWT claims as one JSON setting.
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub'
  )::uuid;
$$;
create role authenticator login noinherit password 'demo';
grant anon, authenticated, service_role to authenticator;
SQL
for f in /chouf/supabase/migrations/*.sql; do
  echo "migration $(basename "$f")"
  run -f "$f"
done
run -f /chouf/supabase/seed.sql
run -f /chouf/demo/seed-demo.sql
run -c 'create schema demo_ready' # healthcheck marker
echo "demo database ready: $(run -Atc 'select count(*) from public.titles') titles, $(run -Atc 'select count(*) from public.channels') channels"
