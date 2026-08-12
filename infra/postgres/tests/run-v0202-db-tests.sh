#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL must be set}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIG="$ROOT/infra/postgres/migrations"
TEST="$ROOT/infra/postgres/tests"

while IFS= read -r f; do
  echo "==> applying $(basename "$f")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done < <(find "$MIG" -maxdepth 1 -type f -name '*.sql' | sort)

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TEST/v016r_knowledge_ai_runtime.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TEST/v0201_tenant_integrity_runtime.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TEST/v0201_rls_runtime.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TEST/v0202_domain_integrity_runtime.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TEST/v021_access_portability_runtime.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TEST/v0210_sync_ingress_ack_runtime.sql"

echo "AGROWAY PostgreSQL/PostGIS cumulative integration tests 0001-0026: PASS"
