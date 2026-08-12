\set ON_ERROR_STOP on

-- Runs as migration/admin role (CI uses postgres superuser) to prove that
-- relational constraints themselves reject cross-tenant references even when
-- RLS is bypassed administratively.

DO $$
DECLARE
  ta uuid := '10000000-0000-0000-0000-000000000001';
  tb uuid := '20000000-0000-0000-0000-000000000002';
  pa uuid := '10000000-0000-0000-0000-000000000101';
  pb uuid := '20000000-0000-0000-0000-000000000102';
BEGIN
  INSERT INTO agroway_external.provider(provider_id,tenant_id,provider_key,kind)
  VALUES (pa,ta,'tenant-a-weather','WEATHER'),(pb,tb,'tenant-b-weather','WEATHER');

  BEGIN
    INSERT INTO agroway_external.source(source_id,tenant_id,provider_id,external_source_key,freshness_slo_minutes)
    VALUES ('10000000-0000-0000-0000-000000000201',ta,pb,'illegal-cross-tenant-source',180);
    RAISE EXCEPTION 'expected external-data cross-tenant FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

DO $$
DECLARE
  ta uuid := '10000000-0000-0000-0000-000000000001';
  tb uuid := '20000000-0000-0000-0000-000000000002';
  project_b uuid := '20000000-0000-0000-0000-000000000301';
BEGIN
  INSERT INTO agroway_invest.project(
    project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,
    currency,required_minor,committed_minor,deployed_minor,recovered_minor,created_at,updated_at
  ) VALUES (
    project_b,tb,'B-001','Tenant B project','APPROVED','ELIGIBLE',
    '20000000-0000-0000-0000-000000000302','20000000-0000-0000-0000-000000000303','[]','[]',
    'COP',100000,0,0,0,now(),now()
  );

  BEGIN
    INSERT INTO agroway_invest.capital_commitment(
      commitment_id,tenant_id,project_id,amount_minor,currency,source_ref,committed_at
    ) VALUES (
      '10000000-0000-0000-0000-000000000304',ta,project_b,1000,'COP','illegal-cross-tenant',now()
    );
    RAISE EXCEPTION 'expected invest cross-tenant FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

DO $$
DECLARE
  ta uuid := '10000000-0000-0000-0000-000000000001';
  tb uuid := '20000000-0000-0000-0000-000000000002';
  session_b uuid := '20000000-0000-0000-0000-000000000401';
BEGIN
  INSERT INTO agroway_copilot.session(session_id,tenant_id,actor_id,opened_at)
  VALUES (session_b,tb,'20000000-0000-0000-0000-000000000402',now());

  BEGIN
    INSERT INTO agroway_copilot.inquiry(request_id,tenant_id,session_id,actor_id,mode,question,requested_at)
    VALUES (
      '10000000-0000-0000-0000-000000000403',ta,session_b,
      '10000000-0000-0000-0000-000000000404','READ','illegal cross tenant inquiry',now()
    );
    RAISE EXCEPTION 'expected copilot cross-tenant FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

DO $$
DECLARE
  ta uuid := '10000000-0000-0000-0000-000000000001';
  tb uuid := '20000000-0000-0000-0000-000000000002';
  pilot_b uuid := '20000000-0000-0000-0000-000000000501';
BEGIN
  INSERT INTO agroway_pilot.enrollment(
    pilot_id,tenant_id,name,farm_ref,plot_refs,cycle_refs,policy_version,status,enrolled_at
  ) VALUES (pilot_b,tb,'Tenant B pilot','farm:b','[]','[]','v020','RUNNING',now());

  BEGIN
    INSERT INTO agroway_pilot.evidence(
      pilot_id,tenant_id,evidence_id,stage,kind,source_ref,provenance_ref,source_digest_sha256,observed_at,outcome
    ) VALUES (
      pilot_b,ta,'illegal-cross-tenant-evidence','IDENTITY_LAND','FIELD_EVIDENCE','field:x','prov:x',repeat('a',64),now(),'PASS'
    );
    RAISE EXCEPTION 'expected pilot cross-tenant FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

DO $$
DECLARE
  ta uuid := '10000000-0000-0000-0000-000000000001';
  pilot_a uuid := '10000000-0000-0000-0000-000000000501';
  decision_good char(64) := repeat('c',64);
BEGIN
  INSERT INTO agroway_pilot.enrollment(
    pilot_id,tenant_id,name,farm_ref,plot_refs,cycle_refs,policy_version,status,enrolled_at
  ) VALUES (pilot_a,ta,'Tenant A pilot','farm:a','[]','[]','v020','ELIGIBLE_FOR_CERTIFICATION',now());

  INSERT INTO agroway_pilot.certification_decision(
    pilot_id,tenant_id,policy_version,status,evidence_digest_sha256,decision_digest_sha256,reason_codes,evaluated_at
  ) VALUES (pilot_a,ta,'v020','ELIGIBLE_FOR_CERTIFICATION',repeat('b',64),decision_good,'[]',now());

  BEGIN
    INSERT INTO agroway_pilot.certificate(
      certificate_id,pilot_id,tenant_id,policy_version,decision_digest_sha256,
      issued_by_actor_id,issued_at,human_attestation,state
    ) VALUES (
      'cert-wrong-digest',pilot_a,ta,'v020',repeat('d',64),
      '10000000-0000-0000-0000-000000000502',now(),true,'ACTIVE'
    );
    RAISE EXCEPTION 'expected certificate wrong-decision-digest FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  INSERT INTO agroway_pilot.certificate(
    certificate_id,pilot_id,tenant_id,policy_version,decision_digest_sha256,
    issued_by_actor_id,issued_at,human_attestation,state
  ) VALUES (
    'cert-good-digest',pilot_a,ta,'v020',decision_good,
    '10000000-0000-0000-0000-000000000502',now(),true,'ACTIVE'
  );
END $$;

SELECT 'PASS v0.20.1 tenant-aware foreign keys + certificate digest binding' AS result;
