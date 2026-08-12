#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
from textwrap import dedent

DB = os.environ.get("DATABASE_URL")
if not DB:
    raise SystemExit("DATABASE_URL_REQUIRED")

TA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
TB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
PA = "11111111-1111-4111-8111-111111111111"
PB = "22222222-2222-4222-8222-222222222222"
PC = "33333333-3333-4333-8333-333333333333"
IA = "44444444-4444-4444-8444-444444444441"
IB = "44444444-4444-4444-8444-444444444442"
IC = "44444444-4444-4444-8444-444444444443"
GATES = [
    "G1_ACTOR", "G2_ASSET", "G3_AGRONOMY", "G4_BUDGET", "G5_MARKET",
    "G6_RISK", "G7_TRACEABILITY", "G8_IMPACT", "G9_FINANCIAL_STRUCTURE",
]


def run(sql: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["psql", DB, "-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
        input=dedent(sql), text=True, capture_output=True,
    )


def ok(name: str, sql: str, expected_last: str | None = None) -> None:
    result = run(sql)
    if result.returncode != 0:
        raise AssertionError(f"{name} expected success\n{result.stdout}\n{result.stderr}")
    if expected_last is not None:
        lines = [x for x in result.stdout.splitlines() if x.strip()]
        actual = lines[-1] if lines else ""
        if actual != expected_last:
            raise AssertionError(f"{name} expected {expected_last!r}, got {actual!r}")
    print(f"PASS {name}")


def bad(name: str, sql: str, contains: str | None = None) -> None:
    result = run(sql)
    if result.returncode == 0:
        raise AssertionError(f"{name} expected failure but succeeded\n{result.stdout}")
    text = result.stdout + "\n" + result.stderr
    if contains and contains not in text:
        raise AssertionError(f"{name} expected {contains!r}\n{text}")
    print(f"PASS {name}")


def app(tenant: str, body: str) -> str:
    return f"""
    BEGIN;
    SET LOCAL ROLE agroway_app_test;
    SET LOCAL app.tenant_id = '{tenant}';
    {body}
    COMMIT;
    """


def intake_sql(tenant: str, project: str, intake: str, prefix: int) -> str:
    states = [
        "CREATED", "CANONICAL_REUSE_SCAN", "DATA_COMPLETION", "EVIDENCE_VALIDATION",
        "ASSESSMENT_READY", "UNDER_ASSESSMENT", "HUMAN_REVIEW",
    ]
    sql = f"""
    INSERT INTO agroway_invest.capital_pilot_intake
      (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,originator_ref,consent_set_ref,data_pack_version,created_at)
    VALUES
      ('{intake}','{tenant}','{project}',1,'SANA_DIAGNOSTIC','diagnostic:{project}','sana:test','consent:test','datapack-v1','2026-08-12T09:00:00Z');
    """
    for seq, state in enumerate(states):
        frm = "NULL" if seq == 0 else f"'{states[seq-1]}'"
        tid = f"{prefix:08d}-0000-4000-8000-{seq+1:012d}"
        sql += f"""
        INSERT INTO agroway_invest.capital_pilot_intake_transition
          (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
        VALUES
          ('{tid}','{tenant}','{project}','{intake}',1,{seq},{frm},'{state}','human:test','2026-08-12T09:{seq:02d}:00Z');
        """
    return sql


def gates_sql(tenant: str, project: str, aid: str, version: int,
              overrides: dict[str, tuple[str, list[str]]] | None = None,
              only: list[str] | None = None) -> str:
    overrides = overrides or {}
    rows = []
    for gate in (only or GATES):
        result, refs = overrides.get(gate, ("PASS", [f"evidence:{gate}"]))
        arr = "ARRAY[]::text[]" if not refs else "ARRAY[" + ",".join(f"'{r}'" for r in refs) + "]::text[]"
        rows.append(
            f"('{tenant}','{project}','{aid}',{version},'{gate}','{result}','{gate} basis',{arr},9000,"
            f"'2026-08-12T10:50:00Z','human:reviewer','method-v1')"
        )
    return """
    INSERT INTO agroway_invest.readiness_gate_assessment
      (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version)
    VALUES
    """ + ",\n".join(rows) + ";"


def assessment_sql(tenant: str, project: str, aid: str, version: int, intake: str,
                   decision: str, maximum: str, digest_char: str,
                   manifest_digest: str | None = None) -> str:
    manifest = manifest_digest or "a" * 64
    return f"""
    INSERT INTO agroway_invest.readiness_assessment
      (assessment_id,tenant_id,project_id,version,intake_id,intake_version,policy_version,methodology_version,project_snapshot_ref,
       approved_budget_version,evidence_manifest_as_of,risk_profile_as_of,evidence_manifest_digest_sha256,risk_profile_digest_sha256,
       source_risk_digest_sha256,evidence_coverage_bps,decision,deterministic_maximum_decision,rationale,reviewer_ref,reviewed_at,digest_sha256,created_at)
    VALUES
      ('{aid}','{tenant}','{project}',{version},'{intake}',1,'policy-v1','method-v1','snapshot:{aid}',NULL,
       '2026-08-12T10:00:00Z','2026-08-12T10:00:00Z','{manifest}','{'b'*64}','{'c'*64}',10000,
       '{decision}','{maximum}','Human final readiness review','human:reviewer','2026-08-12T11:00:00Z','{digest_char*64}','2026-08-12T11:01:00Z');
    """


def gap_sql(tenant: str, project: str, aid: str, version: int, gid: str,
            gate: str, code: str, blocking: bool) -> str:
    return f"""
    INSERT INTO agroway_invest.readiness_gap
      (gap_id,tenant_id,project_id,assessment_id,assessment_version,gate_id,code,severity,blocking,description,source_ref,owner_ref,due_at,required_evidence_roles,opened_at)
    VALUES
      ('{gid}','{tenant}','{project}','{aid}',{version},'{gate}','{code}','{'CRITICAL' if blocking else 'WARNING'}',
       {'true' if blocking else 'false'},'{code} description','gate:{gate}','human:owner','2026-08-13T10:00:00Z',ARRAY['ROLE:{gate}']::text[],'2026-08-12T10:30:00Z');
    """


def gap_open_sql(tenant: str, project: str, aid: str, version: int, gid: str, tid: str) -> str:
    return f"""
    INSERT INTO agroway_invest.readiness_gap_transition
      (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
    VALUES
      ('{tid}','{tenant}','{project}','{aid}',{version},'{gid}',0,NULL,'OPEN','human:reviewer',ARRAY[]::text[],NULL,'2026-08-12T10:30:00Z');
    """


# Test principal and project fixtures. The application principal is deliberately
# non-owner and receives SELECT/INSERT only on readiness tables.
ok("POSTGRES_TEST_ROLE_AND_PROJECT_FIXTURES", f"""
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='agroway_app_test') THEN
    CREATE ROLE agroway_app_test NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;
GRANT USAGE ON SCHEMA agroway_invest TO agroway_app_test;
GRANT SELECT, INSERT ON TABLE
  agroway_invest.capital_pilot_intake,
  agroway_invest.capital_pilot_intake_transition,
  agroway_invest.readiness_assessment,
  agroway_invest.readiness_gate_assessment,
  agroway_invest.readiness_gap,
  agroway_invest.readiness_gap_transition
TO agroway_app_test;
INSERT INTO agroway_invest.project
  (project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,currency,required_minor,committed_minor,deployed_minor,recovered_minor,created_at,updated_at)
VALUES
  ('{PA}','{TA}','INT16-A','Project A','UNDER_REVIEW','NOT_EVALUATED','aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000002','[]'::jsonb,'[]'::jsonb,'COP',100000000,0,0,0,'2026-08-12T08:00:00Z','2026-08-12T08:00:00Z'),
  ('{PB}','{TB}','INT16-B','Project B','UNDER_REVIEW','NOT_EVALUATED','bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002','[]'::jsonb,'[]'::jsonb,'COP',100000000,0,0,0,'2026-08-12T08:00:00Z','2026-08-12T08:00:00Z'),
  ('{PC}','{TA}','INT16-C','Project C','UNDER_REVIEW','NOT_EVALUATED','cccccccc-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000002','[]'::jsonb,'[]'::jsonb,'COP',100000000,0,0,0,'2026-08-12T08:00:00Z','2026-08-12T08:00:00Z');
""")

ok("FORCE_RLS_ENABLED_SIX_TABLES", """
SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='agroway_invest'
  AND c.relname IN ('capital_pilot_intake','capital_pilot_intake_transition','readiness_assessment','readiness_gate_assessment','readiness_gap','readiness_gap_transition')
  AND c.relrowsecurity AND c.relforcerowsecurity;
""", "6")

ok("TENANT_A_INTAKE_TO_HUMAN_REVIEW", app(TA, intake_sql(TA, PA, IA, 55555555)))
ok("TENANT_C_INTAKE_TO_HUMAN_REVIEW", app(TA, intake_sql(TA, PC, IC, 77777777)))
ok("TENANT_B_OWNER_INTAKE_FIXTURE", intake_sql(TB, PB, IB, 66666666))

# RLS and immutable privileges.
ok("RLS_TENANT_A_ONLY_OWN_ROWS", app(TA, "SELECT count(*) FROM agroway_invest.capital_pilot_intake;"), "2")
ok("RLS_UNSET_TENANT_ZERO_ROWS", """
BEGIN; SET LOCAL ROLE agroway_app_test;
SELECT count(*) FROM agroway_invest.capital_pilot_intake;
COMMIT;
""", "0")
bad("RLS_MALFORMED_TENANT_FAIL_CLOSED", """
BEGIN; SET LOCAL ROLE agroway_app_test; SET LOCAL app.tenant_id='not-a-uuid';
SELECT count(*) FROM agroway_invest.capital_pilot_intake; COMMIT;
""", "invalid input syntax for type uuid")
bad("RLS_CROSS_TENANT_INSERT_DENIED", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake
  (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
VALUES ('88888888-8888-4888-8888-888888888881','{TB}','{PB}',2,'SANA_DIAGNOSTIC','cross','v2','2026-08-12T09:10:00Z');
"""), "row-level security")
bad("COMPOSITE_TENANT_PROJECT_FORGERY_DENIED", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake
  (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
VALUES ('88888888-8888-4888-8888-888888888882','{TA}','{PB}',1,'SANA_DIAGNOSTIC','forged','v1','2026-08-12T09:10:00Z');
"""), "foreign key")
bad("APP_ROLE_UPDATE_NOT_GRANTED", app(TA, f"UPDATE agroway_invest.capital_pilot_intake SET source_ref='tamper' WHERE intake_id='{IA}';"), "permission denied")
bad("APP_ROLE_DELETE_NOT_GRANTED", app(TA, f"DELETE FROM agroway_invest.capital_pilot_intake WHERE intake_id='{IA}';"), "permission denied")
bad("OWNER_UPDATE_APPEND_ONLY", f"UPDATE agroway_invest.capital_pilot_intake SET source_ref='tamper' WHERE intake_id='{IA}';", "READINESS_APPEND_ONLY")
bad("OWNER_DELETE_APPEND_ONLY", f"DELETE FROM agroway_invest.capital_pilot_intake WHERE intake_id='{IA}';", "READINESS_APPEND_ONLY")

# Intake version and transition chains.
bad("INTAKE_DUPLICATE_VERSION", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake
  (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
VALUES ('88888888-8888-4888-8888-888888888883','{TA}','{PA}',1,'SANA_DIAGNOSTIC','dup','v1','2026-08-12T09:10:00Z');
"""), "INTAKE_VERSION_CHAIN_EXPECTED_NEXT_VERSION")
bad("INTAKE_VERSION_JUMP", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake
  (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
VALUES ('88888888-8888-4888-8888-888888888884','{TA}','{PA}',3,'SANA_DIAGNOSTIC','jump','v3','2026-08-12T09:10:00Z');
"""), "INTAKE_VERSION_CHAIN_PREVIOUS_MISSING")
bad("INTAKE_SEQUENCE_JUMP", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake_transition
  (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
VALUES ('88888888-8888-4888-8888-888888888885','{TA}','{PA}','{IA}',1,8,'HUMAN_REVIEW','CAPITAL_READY','human:test','2026-08-12T09:20:00Z');
"""), "INTAKE_TRANSITION_SEQUENCE_NOT_CONTIGUOUS")
bad("INTAKE_STALE_FROM_STATE", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake_transition
  (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
VALUES ('88888888-8888-4888-8888-888888888886','{TA}','{PA}','{IA}',1,7,'UNDER_ASSESSMENT','CAPITAL_READY','human:test','2026-08-12T09:20:00Z');
"""), "INTAKE_TRANSITION_FROM_STATE_STALE")
bad("INTAKE_TIME_REGRESSION", app(TA, f"""
INSERT INTO agroway_invest.capital_pilot_intake_transition
  (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
VALUES ('88888888-8888-4888-8888-888888888887','{TA}','{PA}','{IA}',1,7,'HUMAN_REVIEW','CAPITAL_READY','human:test','2026-08-12T09:01:00Z');
"""), "INTAKE_TRANSITION_TIME_REGRESSION")

# Valid all-PASS assessment. Child basis is staged first, parent finalizes last.
AA = "assessment:a:v1"
ok("VALID_CAPITAL_READY_ATOMIC", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gates_sql(TA, PA, AA, 1)}
{assessment_sql(TA, PA, AA, 1, IA, 'CAPITAL_READY', 'CAPITAL_READY', 'd')}
SET CONSTRAINTS ALL IMMEDIATE;
"""))
ok("FINAL_ASSESSMENT_NINE_GATES", app(TA, f"SELECT count(*) FROM agroway_invest.readiness_gate_assessment WHERE assessment_id='{AA}';"), "9")
bad("FINALIZED_REJECTS_LATE_GAP", app(TA, gap_sql(TA, PA, AA, 1, "late-gap", "G5_MARKET", "LATE", False)), "READINESS_ASSESSMENT_ALREADY_FINALIZED")
bad("FINALIZED_REJECTS_LATE_GATE", app(TA, gates_sql(TA, PA, AA, 1, only=["G1_ACTOR"])), "READINESS_ASSESSMENT_ALREADY_FINALIZED")

# Adversarial assessment transactions roll back, so version 2 remains reusable.
BAD = "assessment:a:v2-bad"
bad("EIGHT_GATE_FINAL_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gates_sql(TA, PA, BAD, 2, only=GATES[:8])}
{assessment_sql(TA, PA, BAD, 2, IA, 'NOT_CAPITAL_READY', 'NOT_CAPITAL_READY', 'e')}
SET CONSTRAINTS ALL IMMEDIATE;
"""), "READINESS_ASSESSMENT_REQUIRES_EXACTLY_NINE_GATES")
bad("DUPLICATE_GATE_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gates_sql(TA, PA, BAD, 2, only=['G1_ACTOR'])}
{gates_sql(TA, PA, BAD, 2, only=['G1_ACTOR'])}
"""), "duplicate key")
bad("UNKNOWN_GATE_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
INSERT INTO agroway_invest.readiness_gate_assessment
  (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version)
VALUES ('{TA}','{PA}','{BAD}',2,'G10_MAGIC','PASS','invalid',ARRAY[]::text[],9000,'2026-08-12T10:50:00Z','human:test','method-v1');
"""), "readiness_gate_assessment_gate_id_check")
bad("DECISION_EXCEEDS_DETERMINISTIC_MAX", app(TA, assessment_sql(TA, PA, BAD, 2, IA, "CAPITAL_READY", "NOT_CAPITAL_READY", "f")), "readiness_assessment_decision_ceiling_ck")
bad("ASSESSMENT_VERSION_JUMP", app(TA, assessment_sql(TA, PA, "assessment:a:v3", 3, IA, "NOT_CAPITAL_READY", "NOT_CAPITAL_READY", "1")), "READINESS_VERSION_CHAIN_PREVIOUS_MISSING")
bad("MALFORMED_MANIFEST_DIGEST", app(TA, assessment_sql(TA, PA, BAD, 2, IA, "NOT_CAPITAL_READY", "NOT_CAPITAL_READY", "2", "not-a-digest")), "evidence_manifest_digest_sha256")

G_BAD = "gap:a:pass-contradiction"
bad("PASS_GATE_WITH_GAP_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gap_sql(TA, PA, BAD, 2, G_BAD, 'G5_MARKET', 'UNEXPECTED_CONDITION', False)}
{gap_open_sql(TA, PA, BAD, 2, G_BAD, '88888888-8888-4888-8888-888888888888')}
{gates_sql(TA, PA, BAD, 2)}
{assessment_sql(TA, PA, BAD, 2, IA, 'NOT_CAPITAL_READY', 'NOT_CAPITAL_READY', '3')}
SET CONSTRAINTS ALL IMMEDIATE;
"""), "READINESS_PASS_GATE_CANNOT_HAVE_GAPS")

G_READY = "gap:a:ready-condition"
bad("CAPITAL_READY_WITH_GAP_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gap_sql(TA, PA, BAD, 2, G_READY, 'G8_IMPACT', 'IMPACT_CONDITION', False)}
{gap_open_sql(TA, PA, BAD, 2, G_READY, '88888888-8888-4888-8888-888888888889')}
{gates_sql(TA, PA, BAD, 2, {'G8_IMPACT': ('PASS_WITH_CONDITIONS', ['evidence:G8_IMPACT'])})}
{assessment_sql(TA, PA, BAD, 2, IA, 'CAPITAL_READY', 'CAPITAL_READY', '4')}
SET CONSTRAINTS ALL IMMEDIATE;
"""), "READINESS_CAPITAL_READY_INCONSISTENT")

bad("CONDITIONAL_WITHOUT_CONDITION_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gates_sql(TA, PA, BAD, 2)}
{assessment_sql(TA, PA, BAD, 2, IA, 'CAPITAL_READY_WITH_CONDITIONS', 'CAPITAL_READY_WITH_CONDITIONS', '5')}
SET CONSTRAINTS ALL IMMEDIATE;
"""), "READINESS_CONDITIONAL_DECISION_INCONSISTENT")

GB = "gap:a:blocker"
GC = "gap:a:condition"
bad("CONDITIONAL_WITH_BLOCKER_DENIED", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gap_sql(TA, PA, BAD, 2, GB, 'G5_MARKET', 'MARKET_BLOCK', True)}
{gap_open_sql(TA, PA, BAD, 2, GB, '88888888-8888-4888-8888-888888888890')}
{gap_sql(TA, PA, BAD, 2, GC, 'G8_IMPACT', 'IMPACT_CONDITION', False)}
{gap_open_sql(TA, PA, BAD, 2, GC, '88888888-8888-4888-8888-888888888891')}
{gates_sql(TA, PA, BAD, 2, {'G5_MARKET': ('BLOCKED', ['evidence:G5_MARKET']), 'G8_IMPACT': ('PASS_WITH_CONDITIONS', ['evidence:G8_IMPACT'])})}
{assessment_sql(TA, PA, BAD, 2, IA, 'CAPITAL_READY_WITH_CONDITIONS', 'CAPITAL_READY_WITH_CONDITIONS', '6')}
SET CONSTRAINTS ALL IMMEDIATE;
"""), "READINESS_CONDITIONAL_DECISION_INCONSISTENT")

# Valid conditional assessment on project C, then gap lifecycle adversarial tests.
AC = "assessment:c:v1"
G1 = "gap:c:impact:1"
G2 = "gap:c:impact:2"
ok("VALID_CONDITIONAL_ASSESSMENT", app(TA, f"""
SET CONSTRAINTS ALL DEFERRED;
{gap_sql(TA, PC, AC, 1, G1, 'G8_IMPACT', 'IMPACT_BASELINE_PARTIAL', False)}
{gap_open_sql(TA, PC, AC, 1, G1, '99999999-9999-4999-8999-999999999901')}
{gap_sql(TA, PC, AC, 1, G2, 'G8_IMPACT', 'IMPACT_METHOD_REVIEW', False)}
{gap_open_sql(TA, PC, AC, 1, G2, '99999999-9999-4999-8999-999999999902')}
{gates_sql(TA, PC, AC, 1, {'G8_IMPACT': ('PASS_WITH_CONDITIONS', ['evidence:G8_IMPACT'])})}
{assessment_sql(TA, PC, AC, 1, IC, 'CAPITAL_READY_WITH_CONDITIONS', 'CAPITAL_READY_WITH_CONDITIONS', '7')}
SET CONSTRAINTS ALL IMMEDIATE;
"""))

bad("GAP_SEQUENCE_JUMP", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999903','{TA}','{PC}','{AC}',1,'{G2}',2,'OPEN','IN_REMEDIATION','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
"""), "READINESS_GAP_TRANSITION_SEQUENCE_NOT_CONTIGUOUS")
bad("GAP_STALE_FROM_STATE", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999904','{TA}','{PC}','{AC}',1,'{G2}',1,'IN_REMEDIATION','EVIDENCE_SUBMITTED','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
"""), "READINESS_GAP_TRANSITION_FROM_STATE_STALE")
bad("GAP_RESOLVE_REQUIRES_EVIDENCE_NOTE", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999905','{TA}','{PC}','{AC}',1,'{G1}',1,'OPEN','RESOLVED','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
"""), "READINESS_GAP_RESOLUTION_REQUIRES_EVIDENCE_AND_NOTE")
ok("GAP_DIRECT_RESOLVE_WITH_EVIDENCE_NOTE", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999906','{TA}','{PC}','{AC}',1,'{G1}',1,'OPEN','RESOLVED','human:test',ARRAY['evidence:resolution']::text[],'Verified remediation','2026-08-12T11:10:00Z');
"""))
bad("RESOLVED_GAP_TERMINAL", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999907','{TA}','{PC}','{AC}',1,'{G1}',2,'RESOLVED','IN_REMEDIATION','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:20:00Z');
"""), "READINESS_GAP_TERMINAL_STATE")
bad("GAP_WAIVER_REQUIRES_NOTE", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999908','{TA}','{PC}','{AC}',1,'{G2}',1,'OPEN','WAIVED','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
"""), "READINESS_GAP_WAIVER_REQUIRES_NOTE")
ok("GAP_WAIVER_HUMAN_NOTE_DB_LAYER", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999909','{TA}','{PC}','{AC}',1,'{G2}',1,'OPEN','WAIVED','human:authorized-placeholder',ARRAY[]::text[],'Human waiver rationale; permission policy remains INT1.7','2026-08-12T11:10:00Z');
"""))
bad("WAIVED_GAP_TERMINAL", app(TA, f"""
INSERT INTO agroway_invest.readiness_gap_transition
  (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
VALUES ('99999999-9999-4999-8999-999999999910','{TA}','{PC}','{AC}',1,'{G2}',2,'WAIVED','IN_REMEDIATION','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:20:00Z');
"""), "READINESS_GAP_TERMINAL_STATE")

# Boundary proof: persistence adds readiness history, not money/custody primitives.
ok("NO_READINESS_WALLET_CUSTODY_PAYMENT_TABLES", """
SELECT count(*) FROM information_schema.tables
WHERE table_schema='agroway_invest'
  AND table_name IN ('wallet','custody','payment','disbursement_authority','investor_balance','kyc_document');
""", "0")
ok("READINESS_TABLE_COUNT_SIX", """
SELECT count(*) FROM information_schema.tables
WHERE table_schema='agroway_invest'
  AND table_name IN ('capital_pilot_intake','capital_pilot_intake_transition','readiness_assessment','readiness_gate_assessment','readiness_gap','readiness_gap_transition');
""", "6")

print("PASS_CAPITAL_READINESS_POSTGRES_INT16_AB")
