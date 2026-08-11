\set ON_ERROR_STOP on

-- v0.20.2 tests invariants even when executed as the migration/admin role.

-- 1) Same tenant, different investment project commitment must not fund deployment.
DO $$
DECLARE
  t uuid := '51000000-0000-0000-0000-000000000001';
  p1 uuid := '51000000-0000-0000-0000-000000000101';
  p2 uuid := '51000000-0000-0000-0000-000000000102';
  c2 uuid := '51000000-0000-0000-0000-000000000201';
BEGIN
  INSERT INTO agroway_invest.project(
    project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,
    currency,required_minor,committed_minor,deployed_minor,recovered_minor,created_at,updated_at
  ) VALUES
    (p1,t,'V0202-P1','Project 1','APPROVED','ELIGIBLE','51000000-0000-0000-0000-000000000301','51000000-0000-0000-0000-000000000302','[]','[]','COP',10000,0,0,0,now(),now()),
    (p2,t,'V0202-P2','Project 2','APPROVED','ELIGIBLE','51000000-0000-0000-0000-000000000303','51000000-0000-0000-0000-000000000304','[]','[]','COP',10000,1000,0,0,now(),now());

  INSERT INTO agroway_invest.capital_commitment(commitment_id,tenant_id,project_id,amount_minor,currency,source_ref,committed_at)
  VALUES (c2,t,p2,1000,'COP','source:valid',now());

  BEGIN
    INSERT INTO agroway_invest.capital_deployment(deployment_id,tenant_id,project_id,commitment_id,amount_minor,currency,purpose_code,evidence_ref,deployed_at)
    VALUES ('51000000-0000-0000-0000-000000000401',t,p1,c2,100,'COP','INPUTS','evidence:x',now());
    RAISE EXCEPTION 'expected same-tenant cross-project commitment FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO agroway_invest.capital_recovery(recovery_id,tenant_id,project_id,amount_minor,currency,kind,evidence_ref,received_at)
    VALUES ('51000000-0000-0000-0000-000000000402',t,p1,100,'USD','RETURN','evidence:y',now());
    RAISE EXCEPTION 'expected project currency FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

-- 2) approved_budget_version must reference an actual version on the same project.
DO $$
DECLARE
  t uuid := '52000000-0000-0000-0000-000000000001';
  p uuid := '52000000-0000-0000-0000-000000000101';
BEGIN
  INSERT INTO agroway_invest.project(
    project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,
    currency,required_minor,committed_minor,deployed_minor,recovered_minor,created_at,updated_at
  ) VALUES (p,t,'V0202-BUD','Budget Project','DRAFT','NOT_EVALUATED','52000000-0000-0000-0000-000000000201','52000000-0000-0000-0000-000000000202','[]','[]','COP',0,0,0,0,now(),now());

  BEGIN
    UPDATE agroway_invest.project SET approved_budget_version=99 WHERE project_id=p;
    RAISE EXCEPTION 'expected approved budget FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  INSERT INTO agroway_invest.budget_version(project_id,tenant_id,version,currency,total_minor,state,created_at,approved_at)
  VALUES (p,t,1,'COP',0,'APPROVED',now(),now());
  UPDATE agroway_invest.project SET approved_budget_version=1 WHERE project_id=p;
END $$;

-- 3) Model-backed Copilot responses must bind to the exact evidence context.
DO $$
DECLARE
  t uuid := '53000000-0000-0000-0000-000000000001';
  s uuid := '53000000-0000-0000-0000-000000000101';
  r uuid := '53000000-0000-0000-0000-000000000102';
  a uuid := '53000000-0000-0000-0000-000000000103';
  h char(64) := repeat('a',64);
BEGIN
  INSERT INTO agroway_copilot.session(session_id,tenant_id,actor_id,opened_at) VALUES (s,t,a,now());
  INSERT INTO agroway_copilot.inquiry(request_id,tenant_id,session_id,actor_id,mode,question,requested_at)
  VALUES (r,t,s,a,'READ','context binding',now());
  INSERT INTO agroway_copilot.evidence_bundle(bundle_id,tenant_id,request_id,as_of,context_hash_sha256,accepted_evidence_ids,rejected_evidence_ids)
  VALUES ('bundle-v0202',t,r,now(),h,'[]','[]');

  BEGIN
    INSERT INTO agroway_copilot.response(response_id,tenant_id,request_id,status,answer,context_hash_sha256,created_at)
    VALUES ('response-no-context',t,r,'PARTIAL','partial without context',NULL,now());
    RAISE EXCEPTION 'expected model response without context rejection';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO agroway_copilot.response(response_id,tenant_id,request_id,status,answer,context_hash_sha256,created_at)
    VALUES ('response-wrong-context',t,r,'COMPLETE','wrong context',repeat('b',64),now());
    RAISE EXCEPTION 'expected unknown context FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  INSERT INTO agroway_copilot.response(response_id,tenant_id,request_id,status,answer,context_hash_sha256,created_at)
  VALUES ('response-correct-context',t,r,'COMPLETE','bound context',h,now());
END $$;

-- 4) Certification can bind only an eligible decision with same policy/digest.
DO $$
DECLARE
  t uuid := '54000000-0000-0000-0000-000000000001';
  p uuid := '54000000-0000-0000-0000-000000000101';
  rejected_digest char(64) := repeat('c',64);
  eligible_digest char(64) := repeat('d',64);
BEGIN
  INSERT INTO agroway_pilot.enrollment(pilot_id,tenant_id,name,farm_ref,plot_refs,cycle_refs,policy_version,status,enrolled_at)
  VALUES (p,t,'v0202 pilot','farm:v0202','[]','[]','v020','ELIGIBLE_FOR_CERTIFICATION',now());

  INSERT INTO agroway_pilot.certification_decision(pilot_id,tenant_id,policy_version,status,evidence_digest_sha256,decision_digest_sha256,reason_codes,evaluated_at)
  VALUES
    (p,t,'v020','REJECTED',repeat('e',64),rejected_digest,'["FAIL"]',now()),
    (p,t,'v020','ELIGIBLE_FOR_CERTIFICATION',repeat('f',64),eligible_digest,'[]',now());

  BEGIN
    INSERT INTO agroway_pilot.certificate(certificate_id,pilot_id,tenant_id,policy_version,decision_digest_sha256,issued_by_actor_id,issued_at,human_attestation,state)
    VALUES ('cert-rejected-decision',p,t,'v020',rejected_digest,'54000000-0000-0000-0000-000000000201',now(),true,'ACTIVE');
    RAISE EXCEPTION 'expected rejected decision certificate FK rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  INSERT INTO agroway_pilot.certificate(certificate_id,pilot_id,tenant_id,policy_version,decision_digest_sha256,issued_by_actor_id,issued_at,human_attestation,state)
  VALUES ('cert-v0202-good',p,t,'v020',eligible_digest,'54000000-0000-0000-0000-000000000201',now(),true,'ACTIVE');

  BEGIN
    INSERT INTO agroway_pilot.certificate(certificate_id,pilot_id,tenant_id,policy_version,decision_digest_sha256,issued_by_actor_id,issued_at,human_attestation,state)
    VALUES ('cert-v0202-second-active',p,t,'v020',eligible_digest,'54000000-0000-0000-0000-000000000202',now(),true,'ACTIVE');
    RAISE EXCEPTION 'expected one active certificate rejection';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

-- 5) PASS replay requires at least one event.
DO $$
DECLARE
  t uuid := '55000000-0000-0000-0000-000000000001';
  p uuid := '55000000-0000-0000-0000-000000000101';
BEGIN
  INSERT INTO agroway_pilot.enrollment(pilot_id,tenant_id,name,farm_ref,plot_refs,cycle_refs,policy_version,status,enrolled_at)
  VALUES (p,t,'replay pilot','farm:replay','[]','[]','v020','RUNNING',now());
  BEGIN
    INSERT INTO agroway_pilot.replay_audit(audit_id,pilot_id,tenant_id,status,event_count,replay_digest_sha256,reason_codes,audited_at)
    VALUES ('55000000-0000-0000-0000-000000000201',p,t,'PASS',0,repeat('a',64),'[]',now());
    RAISE EXCEPTION 'expected empty PASS replay rejection';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- 6) External-data DB constraints reject malformed source/raw/scene data.
DO $$
DECLARE
  t uuid := '56000000-0000-0000-0000-000000000001';
  provider uuid := '56000000-0000-0000-0000-000000000101';
  source uuid := '56000000-0000-0000-0000-000000000102';
BEGIN
  INSERT INTO agroway_external.provider(provider_id,tenant_id,provider_key,kind)
  VALUES (provider,t,'v0202-provider','REMOTE_SENSING');
  INSERT INTO agroway_external.source(source_id,tenant_id,provider_id,external_source_key,freshness_slo_minutes)
  VALUES (source,t,provider,'scene-source',60);

  BEGIN
    INSERT INTO agroway_external.raw_ingestion_record(ingestion_id,tenant_id,source_id,provider_event_id,received_at,content_type,payload_sha256,payload,state)
    VALUES ('56000000-0000-0000-0000-000000000201',t,source,'bad-sha',now(),'application/json','not-a-sha','{}','RECEIVED');
    RAISE EXCEPTION 'expected malformed payload sha rejection';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO agroway_external.remote_sensing_scene(scene_id,tenant_id,source_id,provider_scene_id,acquired_at,cloud_cover_pct,footprint)
    VALUES ('scene-cloud-invalid',t,source,'provider-scene',now(),101,ST_GeomFromText('POLYGON((0 0,0 1,1 1,1 0,0 0))',4326));
    RAISE EXCEPTION 'expected cloud cover range rejection';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

SELECT 'PASS v0.20.2 domain-integrity hardening runtime' AS result;
