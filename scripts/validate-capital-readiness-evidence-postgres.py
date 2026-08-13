#!/usr/bin/env python3
from __future__ import annotations
import os, subprocess
from textwrap import dedent

DB=os.environ.get('DATABASE_URL')
if not DB: raise SystemExit('DATABASE_URL_REQUIRED')
TA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; TB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
PA='11111111-1111-4111-8111-111111111111'; IA='44444444-4444-4444-8444-444444444441'
A='assessment:evidence:v2'; G='gap:evidence:g5'; R='99999999-9999-4999-8999-999999999921'; E='evidence:buyer-intent:ux2b1a'
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
        rows.append(f"('{TA}','{PA}','{A}',2,'{gate}','{result}','{gate} basis',ARRAY['evidence:{gate}']::text[],9000,'2026-08-12T11:50:00Z','human:reviewer','method-v1')")
    return "INSERT INTO agroway_invest.readiness_gate_assessment (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version) VALUES "+','.join(rows)+';'

ok('CREATE_EVIDENCE_ASSESSMENT_V2',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}'; SET CONSTRAINTS ALL DEFERRED;
{gates()}
INSERT INTO agroway_invest.readiness_gap
 (gap_id,tenant_id,project_id,assessment_id,assessment_version,gate_id,code,severity,blocking,description,source_ref,owner_ref,due_at,required_evidence_roles,opened_at)
VALUES ('{G}','{TA}','{PA}','{A}',2,'G5_MARKET','MARKET_CURRENT_BUYER_EVIDENCE_MISSING','CRITICAL',true,'Buyer evidence missing','gate:G5','producer:1','2026-08-13T10:00:00Z',ARRAY['BUYER_INTENT']::text[],'2026-08-12T11:40:00Z');
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999920','{TA}','{PA}','{A}',2,'{G}',0,NULL,'OPEN','human:reviewer',ARRAY[]::text[],NULL,'2026-08-12T11:40:00Z');
INSERT INTO agroway_invest.readiness_assessment
 (assessment_id,tenant_id,project_id,version,intake_id,intake_version,policy_version,methodology_version,project_snapshot_ref,approved_budget_version,evidence_manifest_as_of,risk_profile_as_of,evidence_manifest_digest_sha256,risk_profile_digest_sha256,source_risk_digest_sha256,evidence_coverage_bps,decision,deterministic_maximum_decision,rationale,reviewer_ref,reviewed_at,digest_sha256,created_at)
VALUES ('{A}','{TA}','{PA}',2,'{IA}',1,'policy-v1','method-v1','snapshot:evidence:v2',NULL,'2026-08-12T11:30:00Z','2026-08-12T11:30:00Z','{'a'*64}','{'b'*64}','{'c'*64}',8000,'NOT_CAPITAL_READY','NOT_CAPITAL_READY','Needs buyer evidence','human:reviewer','2026-08-12T12:00:00Z','{'e'*64}','2026-08-12T12:01:00Z');
SET CONSTRAINTS ALL IMMEDIATE; COMMIT;
""")

bad('DIRECT_EVIDENCE_SUBMITTED_WITHOUT_RECEIPT',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999922','{TA}','{PA}','{A}',2,'{G}',1,'OPEN','EVIDENCE_SUBMITTED','producer:1',ARRAY[]::text[],NULL,'2026-08-12T12:05:00Z'); COMMIT;
""",'READINESS_EVIDENCE_SUBMISSION_REQUIRES_RECEIPT')

bad('RECEIPT_WRONG_ROLE_REJECTED',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_receipt
 (receipt_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,evidence_ref,object_ref,digest_sha256,content_type,byte_length,evidence_role,submitted_by_actor_ref,submitted_at,idempotency_key,correlation_id,validation_state)
VALUES ('99999999-9999-4999-8999-999999999923','{TA}','{PA}','{A}',2,'{G}','evidence:wrong-role','object://wrong','{'d'*64}','application/pdf',10,'WRONG_ROLE','producer:1','2026-08-12T12:00:00Z','evidence-wrong-role-001','corr:wrong','VALIDATED'); COMMIT;
""",'READINESS_EVIDENCE_ROLE_NOT_REQUIRED')

ok('VALID_RECEIPT',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_receipt
 (receipt_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,evidence_ref,object_ref,digest_sha256,content_type,byte_length,evidence_role,submitted_by_actor_ref,submitted_at,idempotency_key,correlation_id,validation_state)
VALUES ('{R}','{TA}','{PA}','{A}',2,'{G}','{E}','object://validated/{R}','{'f'*64}','application/pdf',4096,'BUYER_INTENT','producer:1','2026-08-12T12:00:00Z','evidence-valid-000001','corr:valid','VALIDATED'); COMMIT;
""")

bad('RECEIPT_IDEMPOTENCY_UNIQUE',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_evidence_receipt
 (receipt_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,evidence_ref,object_ref,digest_sha256,content_type,byte_length,evidence_role,submitted_by_actor_ref,submitted_at,idempotency_key,correlation_id,validation_state)
VALUES ('99999999-9999-4999-8999-999999999924','{TA}','{PA}','{A}',2,'{G}','evidence:drift','object://drift','{'1'*64}','application/pdf',4096,'BUYER_INTENT','producer:1','2026-08-12T12:00:00Z','evidence-valid-000001','corr:drift','VALIDATED'); COMMIT;
""",'readiness_evidence_receipt_tenant_idempotency_uq')

bad('RECEIPT_APPEND_ONLY_UPDATE',f"UPDATE agroway_invest.readiness_evidence_receipt SET object_ref='tamper' WHERE receipt_id='{R}';",'READINESS_APPEND_ONLY')
bad('RECEIPT_APPEND_ONLY_DELETE',f"DELETE FROM agroway_invest.readiness_evidence_receipt WHERE receipt_id='{R}';",'READINESS_APPEND_ONLY')

bad('NON_SUBMISSION_CANNOT_LINK_RECEIPT',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999925','{TA}','{PA}','{A}',2,'{G}',1,'OPEN','IN_REMEDIATION','producer:1',ARRAY[]::text[],ARRAY['{E}']::text[],NULL,'2026-08-12T12:05:00Z'); COMMIT;
""",'READINESS_NON_SUBMISSION_TRANSITION_CANNOT_LINK_SUBMITTED_EVIDENCE')

bad('SUBMISSION_ACTOR_MUST_MATCH_RECEIPT',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999926','{TA}','{PA}','{A}',2,'{G}',1,'OPEN','EVIDENCE_SUBMITTED','other:actor',ARRAY[]::text[],ARRAY['{E}']::text[],NULL,'2026-08-12T12:05:00Z'); COMMIT;
""",'READINESS_EVIDENCE_SUBMISSION_RECEIPT_SET_MISMATCH')

bad('SUBMISSION_UNKNOWN_RECEIPT_REJECTED',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999927','{TA}','{PA}','{A}',2,'{G}',1,'OPEN','EVIDENCE_SUBMITTED','producer:1',ARRAY[]::text[],ARRAY['evidence:not-there']::text[],NULL,'2026-08-12T12:05:00Z'); COMMIT;
""",'READINESS_EVIDENCE_SUBMISSION_RECEIPT_SET_MISMATCH')

ok('VALID_EVIDENCE_SUBMISSION',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999928','{TA}','{PA}','{A}',2,'{G}',1,'OPEN','EVIDENCE_SUBMITTED','producer:1',ARRAY[]::text[],ARRAY['{E}']::text[],'Submitted for human review','2026-08-12T12:05:00Z'); COMMIT;
""")

ok('SUBMISSION_NOT_RESOLUTION',f"SELECT to_state||'|'||cardinality(resolution_evidence_refs)||'|'||cardinality(submitted_evidence_refs) FROM agroway_invest.readiness_gap_transition WHERE transition_id='99999999-9999-4999-8999-999999999928';",'EVIDENCE_SUBMITTED|0|1')

ok('LATER_HUMAN_RESOLUTION_REMAINS_DISTINCT',f"""
BEGIN; SET LOCAL app.tenant_id='{TA}';
INSERT INTO agroway_invest.readiness_gap_transition
 (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999929','{TA}','{PA}','{A}',2,'{G}',2,'EVIDENCE_SUBMITTED','RESOLVED','human:reviewer',ARRAY['{E}']::text[],ARRAY[]::text[],'Human reviewed and accepted evidence','2026-08-12T12:10:00Z'); COMMIT;
""")

ok('RECEIPT_FORCE_RLS',"SELECT (c.relrowsecurity AND c.relforcerowsecurity)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='agroway_invest' AND c.relname='readiness_evidence_receipt';",'true')
ok('RECEIPT_TABLE_ONE',"SELECT count(*) FROM information_schema.tables WHERE table_schema='agroway_invest' AND table_name='readiness_evidence_receipt';",'1')
ok('NO_FILE_BYTES_COLUMN',"SELECT count(*) FROM information_schema.columns WHERE table_schema='agroway_invest' AND table_name='readiness_evidence_receipt' AND column_name IN ('bytes','content','payload','blob','file_bytes');",'0')

ok('RLS_TEST_ROLE',"""
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='readiness_evidence_reader') THEN CREATE ROLE readiness_evidence_reader NOLOGIN; END IF; END $$;
GRANT USAGE ON SCHEMA agroway_invest TO readiness_evidence_reader;
GRANT SELECT ON agroway_invest.readiness_evidence_receipt TO readiness_evidence_reader;
""")
ok('RLS_OTHER_TENANT_SEES_ZERO',f"""
BEGIN; SET LOCAL ROLE readiness_evidence_reader; SET LOCAL app.tenant_id='{TB}'; SELECT count(*) FROM agroway_invest.readiness_evidence_receipt; COMMIT;
""",'0')
ok('RLS_OWN_TENANT_SEES_ONE',f"""
BEGIN; SET LOCAL ROLE readiness_evidence_reader; SET LOCAL app.tenant_id='{TA}'; SELECT count(*) FROM agroway_invest.readiness_evidence_receipt; COMMIT;
""",'1')

print('PASS_CAPITAL_READINESS_EVIDENCE_POSTGRES_UX2B1A')
