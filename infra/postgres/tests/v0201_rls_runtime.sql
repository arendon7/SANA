\set ON_ERROR_STOP on

DROP ROLE IF EXISTS agroway_runtime_test;
DROP ROLE IF EXISTS agroway_copilot_test;
CREATE ROLE agroway_runtime_test NOLOGIN;
CREATE ROLE agroway_copilot_test NOLOGIN;

GRANT USAGE ON SCHEMA agroway_external,agroway_invest,agroway_control,agroway_copilot,agroway_pilot TO agroway_runtime_test;
GRANT SELECT,INSERT,UPDATE,DELETE ON
  agroway_external.provider,
  agroway_invest.project,
  agroway_control.snapshot,
  agroway_copilot.session,
  agroway_pilot.enrollment
TO agroway_runtime_test;

GRANT USAGE ON SCHEMA agroway_external TO agroway_copilot_test;
GRANT SELECT ON agroway_external.measurement, agroway_external.canonical_fact_v TO agroway_copilot_test;

-- Seed as admin/superuser so RLS is not part of fixture creation.
INSERT INTO agroway_external.provider(provider_id,tenant_id,provider_key,kind)
VALUES
 ('30000000-0000-0000-0000-000000000101','30000000-0000-0000-0000-000000000001','rls-a','WEATHER'),
 ('40000000-0000-0000-0000-000000000102','40000000-0000-0000-0000-000000000002','rls-b','WEATHER');

INSERT INTO agroway_invest.project(
  project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,
  currency,required_minor,committed_minor,deployed_minor,recovered_minor,created_at,updated_at
) VALUES
 ('30000000-0000-0000-0000-000000000201','30000000-0000-0000-0000-000000000001','RLS-A','RLS A','DRAFT','NOT_EVALUATED','30000000-0000-0000-0000-000000000202','30000000-0000-0000-0000-000000000203','[]','[]','COP',0,0,0,0,now(),now()),
 ('40000000-0000-0000-0000-000000000204','40000000-0000-0000-0000-000000000002','RLS-B','RLS B','DRAFT','NOT_EVALUATED','40000000-0000-0000-0000-000000000205','40000000-0000-0000-0000-000000000206','[]','[]','COP',0,0,0,0,now(),now());

INSERT INTO agroway_control.snapshot(snapshot_id,tenant_id,as_of,network,capital,agronomy,operations,supply,demand,impact,exceptions,watermarks)
VALUES
 ('rls-snapshot-a','30000000-0000-0000-0000-000000000001',now(),'{}','{}','{}','{}','{}','{}','{}','[]','{}'),
 ('rls-snapshot-b','40000000-0000-0000-0000-000000000002',now(),'{}','{}','{}','{}','{}','{}','{}','[]','{}');

INSERT INTO agroway_copilot.session(session_id,tenant_id,actor_id,opened_at)
VALUES
 ('30000000-0000-0000-0000-000000000301','30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000302',now()),
 ('40000000-0000-0000-0000-000000000303','40000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000304',now());

INSERT INTO agroway_pilot.enrollment(pilot_id,tenant_id,name,farm_ref,plot_refs,cycle_refs,policy_version,status,enrolled_at)
VALUES
 ('30000000-0000-0000-0000-000000000401','30000000-0000-0000-0000-000000000001','RLS Pilot A','farm:a','[]','[]','v020','RUNNING',now()),
 ('40000000-0000-0000-0000-000000000402','40000000-0000-0000-0000-000000000002','RLS Pilot B','farm:b','[]','[]','v020','RUNNING',now());

SET ROLE agroway_runtime_test;
SELECT set_config('app.tenant_id','30000000-0000-0000-0000-000000000001',false);

DO $$
BEGIN
  IF (SELECT count(*) FROM agroway_external.provider) <> 1 THEN RAISE EXCEPTION 'provider RLS leak'; END IF;
  IF (SELECT count(*) FROM agroway_invest.project) <> 1 THEN RAISE EXCEPTION 'invest RLS leak'; END IF;
  IF (SELECT count(*) FROM agroway_control.snapshot) <> 1 THEN RAISE EXCEPTION 'control RLS leak'; END IF;
  IF (SELECT count(*) FROM agroway_copilot.session) <> 1 THEN RAISE EXCEPTION 'copilot RLS leak'; END IF;
  IF (SELECT count(*) FROM agroway_pilot.enrollment) <> 1 THEN RAISE EXCEPTION 'pilot RLS leak'; END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO agroway_external.provider(provider_id,tenant_id,provider_key,kind)
    VALUES ('30000000-0000-0000-0000-000000000199','40000000-0000-0000-0000-000000000002','illegal-tenant-write','WEATHER');
    RAISE EXCEPTION 'expected RLS WITH CHECK rejection';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;

SELECT set_config('app.tenant_id','',false);
DO $$
BEGIN
  IF (SELECT count(*) FROM agroway_external.provider) <> 0 THEN RAISE EXCEPTION 'empty tenant context must reveal zero rows'; END IF;
END $$;

RESET ROLE;

DO $$
DECLARE forced_count integer;
BEGIN
  SELECT count(*) INTO forced_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('agroway_external','agroway_invest','agroway_control','agroway_copilot','agroway_pilot')
    AND c.relkind='r'
    AND c.relforcerowsecurity;
  IF forced_count <> 35 THEN
    RAISE EXCEPTION 'expected 35 FORCE-RLS tables, found %', forced_count;
  END IF;
END $$;

DO $$
DECLARE opts text[];
BEGIN
  SELECT c.reloptions INTO opts
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='agroway_external' AND c.relname='canonical_fact_v';
  IF opts IS NULL OR NOT ('security_invoker=true' = ANY(opts)) THEN
    RAISE EXCEPTION 'canonical_fact_v missing security_invoker=true';
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('agroway_copilot_test','agroway_external.raw_ingestion_record','SELECT') THEN
    RAISE EXCEPTION 'Copilot role must not read raw ingestion payloads';
  END IF;
END $$;

SELECT 'PASS v0.20.1 FORCE RLS + tenant isolation + raw boundary' AS result;
