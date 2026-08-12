#!/usr/bin/env python3
from __future__ import annotations
import os, subprocess
from textwrap import dedent

DB=os.environ.get('DATABASE_URL')
if not DB: raise SystemExit('DATABASE_URL_REQUIRED')
TA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; TB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
PA='11111111-1111-4111-8111-111111111171'; IA='44444444-4444-4444-8444-444444444471'
A='assessment:evidence-review:v1'; G='gap:evidence-review:g5'
R='99999999-9999-4999-8999-999999999971'; E='evidence:buyer-intent:ux2b2'
R2='99999999-9999-4999-8999-999999999972'; E2='evidence:buyer-intent:not-submitted'
GATES=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE']

def run(sql): return subprocess.run(['psql',DB,'-X','-qAt','-v','ON_ERROR_STOP=1'],input=dedent(sql),text=True,capture_output=True)
def ok(name,sql,expected=None):
    r=run(sql)
    if r.returncode!=0: raise AssertionError(f'{name} expected success\n{r.stdout}\n{r.stderr}')
    if expected is not None:
        lines=[x for x in r.stdout.splitlines() if x.strip()]; actual=lines[-1] if lines else ''
        if actual!=expected: raise AssertionError(f'{name} expected {expected!r}, got {actual!r}')
    print('PASS',name)
def bad(name,sql,contains):
    r=run(sql)
    if r.returncode==0: raise AssertionError(f'{name} expected failure')
    text=r.stdout+'\n'+r.stderr
    if contains not in text: raise AssertionError(f'{name} expected {contains!r}\n{text}')
    print('PASS',name)

def gates():
    rows=[]
    for gate in GATES:
        result='BLOCKED' if gate=='G5_MARKET' else 'PASS'
        rows.append(f"('{TA}','{PA}','{A}',1,'{gate}','{result}','{gate} basis',ARRAY['evidence:{gate}']::text[],9000,'2026-08-12T16:20:00Z','human:readiness-reviewer','method-v1')")
    return "INSERT INTO agroway_invest.readiness_gate_assessment (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version) VALUES "+','.join(rows)+';'

# Independent UX2B-2 fixture: project + intake reaches HUMAN_REVIEW, then one
# blocked G5 assessment/gap is persisted exactly as the canonical model expects.
ok('CREATE_UX2B2_PROJECT_INTAKE_ASSESSMENT',f"""
INSERT INTO agroway_invest.project
 (project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,currency,required_minor,committed_minor,deployed_minor,recovered_minor,created_at,updated_at)
VALUES ('{PA}','{TA}','UX2B2-HASS','UX2B2 Hass fixture','UNDER_REVIEW','NOT_EVALUATED','aaaaaaaa-0000-4000-8000-000000000071','aaaaaaaa-0000-4000-8000-000000000072','[]'::jsonb,'[]'::jsonb,'COP',40000000,0,0,0,'2026-08-12T16:00:00Z','2026-08-12T16:00:00Z');
INSERT INTO agroway_invest.capital_pilot_intake
 (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,originator_ref,consent_set_ref,data_pack_version,created_at)
VALUES ('{IA}','{TA}','{PA}',1,'SANA_DIAGNOSTIC','diagnostic:ux2b2','sana:test','consent:ux2b2','datapack-v1','2026-08-12T16:01:00Z');
INSERT INTO agroway_invest.capital_pilot_intake_transition
 (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
VALUES
 ('77777777-0000-4000-8000-000000000001','{TA}','{PA}','{IA}',1,0,NULL,'CREATED','human:readiness-reviewer','2026-08-12T16:01:00Z'),
 ('77777777-0000-4000-8000-000000000002','{TA}','{PA}','{IA}',1,1,'CREATED','CANONICAL_REUSE_SCAN','human:readiness-reviewer','2026-08-12T16:02:00Z'),
 ('77777777-0000-4000-8000-000000000003','{TA}','{PA}','{IA}',1,2,'CANONICAL_REUSE_SCAN','DATA_COMPLETION','human:readiness-reviewer','2026-08-12T16:03:00Z'),
 ('77777777-0000-4000-8000-000000000004','{TA}','{PA}','{IA}',1,3,'DATA_COMPLETION','EVIDENCE_VALIDATION','human:readiness-reviewer','2026-08-12T16:04:00Z'),
 ('77777777-0000-4000-8000-000000000005','{TA}','{PA}','{IA}',1,4,'EVIDENCE_VALIDATION','ASSESSMENT_READY','human:readiness-reviewer','2026-08-12T16:05:00Z'),
 ('77777777-0000-4000-8000-000000000006','{TA}','{PA}','{IA}',1,5,'ASSESSMENT_READY','UNDER_ASSESSMENT','human:readiness-reviewer','2026-08-12T16:06:00Z'),
 ('77777777-0000-4000-8000-000000000007','{TA}','{PA}','{IA}',1,6,'UNDER_ASSESSMENT','HUMAN_REVIEW','human:readiness-reviewer','2026-08-12T16:07:00Z');
BEGIN; SET LOCAL app.tenant_id='{TA}'; SET CONSTRAINTS ALL DEFERRED;
{gates()}
INSERT INTO agroway_invest.readiness_gap
 (gap_id,tenant_id,project_id,assessment_id,assessment_version,gate_id,code,severity,blocking,description,source_ref,owner_ref,due_at,required_evidence_roles,opened_at)
VALUES ('{G}','{TA}','{PA}','{A}',1,'G5_MARKET','MARKET_CURRENT_BUYER_EVIDENCE_MISSING','CRITICAL',true,'Buyer evidence missing','gate:G5','producer:1','2026-08-13T10:00:00Z',ARRAY['BUYER_INTENT']::text[],'2026-08-12T16:10:00Z');
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('77777777-0000-4000-8000-000000000008','{TA}','{PA}','{A}',1,'{G}',0,NULL,'OPEN','human:readiness-reviewer',ARRAY[]::text[],NULL,'2026-08-12T16:10:00Z');
INSERT INTO agroway_invest.readiness_assessment
 (assessment_id,tenant_id,project_id,version,intake_id,intake_version,policy_version,methodology_version,project_snapshot_ref,approved_budget_version,evidence_manifest_as_of,risk_profile_as_of,evidence_manifest_digest_sha256,risk_profile_digest_sha256,source_risk_digest_sha256,evidence_coverage_bps,decision,deterministic_maximum_decision,rationale,reviewer_ref,reviewed_at,digest_sha256,created_at)
VALUES ('{A}','{TA}','{PA}',1,'{IA}',1,'policy-v1','method-v1','snapshot:ux2b2',NULL,'2026-08-12T16:15:00Z','2026-08-12T16:15:00Z','{'a'*64}','{'b'*64}','{'c'*64}',8000,'NOT_CAPITAL_READY','NOT_CAPITAL_READY','Needs buyer evidence','human:readiness-reviewer','2026-08-12T16:30:00Z','{'e'*64}','2026-08-12T16:31:00Z');
SET CONSTRAINTS ALL IMMEDIATE; COMMIT;
""")

ok('CREATE_VALIDATED_RECEIPTS',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_receipt
 (receipt_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,evidence_ref,object_ref,digest_sha256,content_type,byte_length,evidence_role,submitted_by_actor_ref,submitted_at,idempotency_key,correlation_id,validation_state)
VALUES
 ('{R}','{TA}','{PA}','{A}',1,'{G}','{E}','object://ux2b2/{R}','{'f'*64}','application/pdf',4096,'BUYER_INTENT','producer:1','2026-08-12T16:35:00Z','ux2b2-receipt-000001','corr:ux2b2:1','VALIDATED'),
 ('{R2}','{TA}','{PA}','{A}',1,'{G}','{E2}','object://ux2b2/{R2}','{'9'*64}','application/pdf',2048,'BUYER_INTENT','producer:2','2026-08-12T16:35:00Z','ux2b2-receipt-000002','corr:ux2b2:2','VALIDATED');
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('77777777-0000-4000-8000-000000000009','{TA}','{PA}','{A}',1,'{G}',1,'OPEN','EVIDENCE_SUBMITTED','producer:1',ARRAY[]::text[],ARRAY['{E}']::text[],'Producer submitted buyer intent','2026-08-12T16:36:00Z');
COMMIT;
""")

# Receipt safety != human adequacy. Resolution without a human acceptance fails.
bad('UNREVIEWED_EVIDENCE_CANNOT_RESOLVE',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('77777777-0000-4000-8000-000000000010','{TA}','{PA}','{A}',1,'{G}',2,'EVIDENCE_SUBMITTED','RESOLVED','human:reviewer',ARRAY['{E}']::text[],ARRAY[]::text[],'Attempt without review','2026-08-12T16:40:00Z'); COMMIT;
""",'READINESS_RESOLUTION_REQUIRES_LATEST_HUMAN_ACCEPTED_EVIDENCE')

bad('SUBMITTER_CANNOT_REVIEW_OWN_RECEIPT',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000001','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'f'*64}',0,'ACCEPTED_FOR_GAP_REVIEW','producer:1','Self review forbidden','2026-08-12T16:41:00Z',NULL,'{'1'*64}'); COMMIT;
""",'READINESS_EVIDENCE_REVIEW_SEPARATION_OF_DUTIES_REQUIRED')

bad('REVIEW_RECEIPT_DIGEST_MUST_MATCH',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000002','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'0'*64}',0,'ACCEPTED_FOR_GAP_REVIEW','human:reviewer','Digest mismatch','2026-08-12T16:41:00Z',NULL,'{'2'*64}'); COMMIT;
""",'READINESS_EVIDENCE_REVIEW_RECEIPT_DIGEST_MISMATCH')

bad('UNSUBMITTED_RECEIPT_CANNOT_BE_REVIEWED',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000003','{TA}','{PA}','{A}',1,'{G}','{R2}','{E2}','{'9'*64}',0,'ACCEPTED_FOR_GAP_REVIEW','human:reviewer','Not submitted','2026-08-12T16:41:00Z',NULL,'{'3'*64}'); COMMIT;
""",'READINESS_EVIDENCE_REVIEW_REQUIRES_SUBMISSION_PROOF')

ok('HUMAN_ACCEPTS_SUBMITTED_EVIDENCE',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000004','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'f'*64}',0,'ACCEPTED_FOR_GAP_REVIEW','human:reviewer','Buyer intent is adequate for G5 review','2026-08-12T16:42:00Z',NULL,'{'4'*64}'); COMMIT;
""")

# A later rejection/refresh supersedes an earlier acceptance for resolution proof.
ok('HUMAN_LATER_REJECTS_EVIDENCE',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000005','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'f'*64}',1,'REJECTED','human:reviewer','Document no longer proves current buyer pathway','2026-08-12T16:43:00Z','{'4'*64}','{'5'*64}'); COMMIT;
""")

bad('LATEST_REJECTED_EVIDENCE_CANNOT_RESOLVE',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('77777777-0000-4000-8000-000000000011','{TA}','{PA}','{A}',1,'{G}',2,'EVIDENCE_SUBMITTED','RESOLVED','human:reviewer',ARRAY['{E}']::text[],ARRAY[]::text[],'Rejected evidence cannot resolve','2026-08-12T16:44:00Z'); COMMIT;
""",'READINESS_RESOLUTION_REQUIRES_LATEST_HUMAN_ACCEPTED_EVIDENCE')

bad('REVIEW_CHAIN_SEQUENCE_JUMP_REJECTED',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000006','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'f'*64}',3,'ACCEPTED_FOR_GAP_REVIEW','human:reviewer2','Sequence jump','2026-08-12T16:45:00Z','{'5'*64}','{'6'*64}'); COMMIT;
""",'READINESS_EVIDENCE_REVIEW_SEQUENCE_NOT_CONTIGUOUS')

bad('REVIEW_CHAIN_PREDECESSOR_DIGEST_REJECTED',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000007','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'f'*64}',2,'ACCEPTED_FOR_GAP_REVIEW','human:reviewer2','Wrong predecessor','2026-08-12T16:45:00Z','{'0'*64}','{'7'*64}'); COMMIT;
""",'READINESS_EVIDENCE_REVIEW_PREDECESSOR_DIGEST_MISMATCH')

ok('HUMAN_REACCEPTS_WITH_VALID_CHAIN',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_review
 (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
VALUES ('88888888-0000-4000-8000-000000000008','{TA}','{PA}','{A}',1,'{G}','{R}','{E}','{'f'*64}',2,'ACCEPTED_FOR_GAP_REVIEW','human:reviewer2','Updated buyer evidence accepted','2026-08-12T16:45:00Z','{'5'*64}','{'8'*64}'); COMMIT;
""")

ok('EXPLICIT_RESOLUTION_WITH_LATEST_HUMAN_ACCEPTANCE',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('77777777-0000-4000-8000-000000000012','{TA}','{PA}','{A}',1,'{G}',2,'EVIDENCE_SUBMITTED','RESOLVED','human:resolver',ARRAY['{E}']::text[],ARRAY[]::text[],'Human accepted evidence and explicitly resolved G5','2026-08-12T16:46:00Z'); COMMIT;
""")

ok('REVIEW_HISTORY_DOES_NOT_REPLACE_GAP_TRANSITION',f"SELECT (SELECT count(*) FROM agroway_invest.readiness_evidence_review WHERE receipt_id='{R}')||'|'||(SELECT to_state FROM agroway_invest.readiness_gap_transition WHERE tenant_id='{TA}' AND gap_id='{G}' ORDER BY sequence DESC LIMIT 1);",'3|RESOLVED')
bad('REVIEW_LEDGER_APPEND_ONLY_UPDATE',f"UPDATE agroway_invest.readiness_evidence_review SET rationale='tamper' WHERE decision_id='88888888-0000-4000-8000-000000000004';",'READINESS_APPEND_ONLY')
bad('REVIEW_LEDGER_APPEND_ONLY_DELETE',f"DELETE FROM agroway_invest.readiness_evidence_review WHERE decision_id='88888888-0000-4000-8000-000000000004';",'READINESS_APPEND_ONLY')

ok('REVIEW_FORCE_RLS',"SELECT (c.relrowsecurity AND c.relforcerowsecurity)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='agroway_invest' AND c.relname='readiness_evidence_review';",'true')
ok('REVIEW_TABLE_ONE',"SELECT count(*) FROM information_schema.tables WHERE table_schema='agroway_invest' AND table_name='readiness_evidence_review';",'1')
ok('NO_RAW_FILE_BYTES_IN_REVIEW',"SELECT count(*) FROM information_schema.columns WHERE table_schema='agroway_invest' AND table_name='readiness_evidence_review' AND column_name IN ('bytes','content','payload','blob','file_bytes');",'0')
ok('RLS_REVIEW_READER_ROLE',"""
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='readiness_review_reader') THEN CREATE ROLE readiness_review_reader NOLOGIN; END IF; END $$;
GRANT USAGE ON SCHEMA agroway_invest TO readiness_review_reader;
GRANT SELECT ON agroway_invest.readiness_evidence_review TO readiness_review_reader;
""")
ok('RLS_REVIEW_OTHER_TENANT_ZERO',f"BEGIN; SET LOCAL ROLE readiness_review_reader; SET LOCAL app.tenant_id='{TB}'; SELECT count(*) FROM agroway_invest.readiness_evidence_review; COMMIT;",'0')
ok('RLS_REVIEW_OWN_TENANT_THREE',f"BEGIN; SET LOCAL ROLE readiness_review_reader; SET LOCAL app.tenant_id='{TA}'; SELECT count(*) FROM agroway_invest.readiness_evidence_review; COMMIT;",'3')

print('PASS_CAPITAL_READINESS_EVIDENCE_REVIEW_POSTGRES_UX2B2')
