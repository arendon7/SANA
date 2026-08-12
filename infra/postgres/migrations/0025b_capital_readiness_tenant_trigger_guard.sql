BEGIN;

-- INT1.6A trigger/RLS ordering guard.
-- PostgreSQL executes BEFORE INSERT triggers before the table RLS WITH CHECK.
-- When an application transaction has an explicit app.tenant_id, reject a
-- mismatched NEW.tenant_id before any tenant-sensitive validation query runs.
-- FORCE RLS remains the authoritative row visibility/write policy.

CREATE OR REPLACE FUNCTION agroway_invest.assert_readiness_insert_tenant_context()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  raw_tenant text;
  scoped_tenant uuid;
BEGIN
  raw_tenant := nullif(current_setting('app.tenant_id', true), '');

  -- Administrative/migration sessions may omit the setting. Non-owner runtime
  -- sessions still fail closed at FORCE RLS. When the setting is present, this
  -- guard ensures trigger logic cannot evaluate a row for another tenant first.
  IF raw_tenant IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    scoped_tenant := raw_tenant::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'READINESS_TENANT_CONTEXT_INVALID: row-level security tenant context is not a UUID'
      USING ERRCODE = '22023';
  END;

  IF NEW.tenant_id IS DISTINCT FROM scoped_tenant THEN
    RAISE EXCEPTION 'READINESS_TENANT_CONTEXT_MISMATCH: row-level security tenant scope violation'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'capital_pilot_intake',
    'capital_pilot_intake_transition',
    'readiness_assessment',
    'readiness_gate_assessment',
    'readiness_gap',
    'readiness_gap_transition'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON agroway_invest.%I FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_readiness_insert_tenant_context()',
      'aaa_' || table_name || '_tenant_context_bi', table_name
    );
  END LOOP;
END;
$$;

COMMENT ON FUNCTION agroway_invest.assert_readiness_insert_tenant_context() IS
  'Pre-RLS trigger guard: when app.tenant_id is set, NEW.tenant_id must match before tenant-sensitive validation logic executes. FORCE RLS remains authoritative.';

COMMIT;
