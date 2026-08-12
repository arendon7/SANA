#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import sys
from textwrap import dedent

DB = os.environ.get("DATABASE_URL")
if not DB:
    raise SystemExit("DATABASE_URL_REQUIRED")

TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
PROJECT_A = "11111111-1111-4111-8111-111111111111"
PROJECT_B = "22222222-2222-4222-8222-222222222222"
PROJECT_C = "33333333-3333-4333-8333-333333333333"
INTAKE_A = "44444444-4444-4444-8444-444444444441"
INTAKE_B = "44444444-4444-4444-8444-444444444442"
INTAKE_C = "44444444-4444-4444-8444-444444444443"

GATES = [
    "G1_ACTOR",
    "G2_ASSET",
    "G3_AGRONOMY",
    "G4_BUDGET",
    "G5_MARKET",
    "G6_RISK",
    "G7_TRACEABILITY",
    "G8_IMPACT",
    "G9_FINANCIAL_STRUCTURE",
]

READINESS_TABLES = [
    "capital_pilot_intake",
    "capital_pilot_intake_transition",
    "readiness_assessment",
    "readiness_gate_assessment",
    "readiness_gap",
    "readiness_gap_transition",
]


def _run(sql: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["psql", DB, "-X", "-v", "ON_ERROR_STOP=1", "-At"],
        input=dedent(sql),
        text=True,
        capture_output=True,
    )


def passed(name: str) -> None:
    print(f"PASS {name}")


def expect_success(name: str, sql: str, expected_output: str | None = None) -> str:
    result = _run(sql)
    if result.returncode != 0:
        raise AssertionError(
            f"{name}: expected success\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )
    output = result.stdout.strip()
    if expected_output is not None and output.splitlines()[-1:] != [expected_output]:
        raise AssertionError(
            f"{name}: expected final output {expected_output!r}, got {output!r}"
        )
    passed(name)
    return output


def expect_failure(name: str, sql: str, contains: str | None = None) -> None:
    result = _run(sql)
    if result.returncode == 0:
        raise AssertionError(f"{name}: expected failure but SQL succeeded\n{result.stdout}")
    combined = result.stdout + "\n" + result.stderr
    if contains and contains not in combined:
        raise AssertionError(
            f"{name}: expected error containing {contains!r}\nOUTPUT:\n{combined}"
        )
    passed(name)


def tenant_tx(tenant_id: str, sql: str) -> str:
    return f"""
    BEGIN;
    SET LOCAL ROLE agroway_app_test;
    SET LOCAL app.tenant_id = '{tenant_id}';
    {sql}
    COMMIT;
    """


def gate_insert_sql(
    tenant_id: str,
    project_id: str,
    assessment_id: str,
    version: int,
    overrides: dict[str, tuple[str, list[str]]] | None = None,
    only: list[str] | None = None,
) -> str:
    overrides = overrides or {}
    selected = only or GATES
    rows: list[str] = []
    for gate in selected:
        result, evidence_refs = overrides.get(gate, ("PASS", [f"evidence:{gate}"]))
        evidence = "ARRAY[]::text[]" if not evidence_refs else "ARRAY[" + ",".join(f"'{x}'" for x in evidence_refs) + "]::text[]"
        rows.append(
            f"('{tenant_id}','{project_id}','{assessment_id}',{version},'{gate}','{result}',"
            f"'{gate} deterministic basis',{evidence},9000,'2026-08-12T10:50:00Z','human:reviewer','method-v1')"
        )
    return """
    INSERT INTO agroway_invest.readiness_gate_assessment
      (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version)
    VALUES
    """ + ",\n".join(rows) + ";"


def assessment_insert_sql(
    tenant_id: str,
    project_id: str,
    assessment_id: str,
    version: int,
    intake_id: str,
    decision: str,
    deterministic_maximum: str,
    digest_char: str,
    reviewed_at: str = "2026-08-12T11:00:00Z",
    created_at: str = "2026-08-12T11:01:00Z",
    manifest_digest: str | None = None,
) -> str:
    manifest = manifest_digest or ("a" * 64)
    return f"""
    INSERT INTO agroway_invest.readiness_assessment
      (assessment_id,tenant_id,project_id,version,intake_id,intake_version,policy_version,methodology_version,project_snapshot_ref,
       approved_budget_version,evidence_manifest_as_of,risk_profile_as_of,evidence_manifest_digest_sha256,risk_profile_digest_sha256,
       source_risk_digest_sha256,evidence_coverage_bps,decision,deterministic_maximum_decision,rationale,reviewer_ref,reviewed_at,digest_sha256,created_at)
    VALUES
      ('{assessment_id}','{tenant_id}','{project_id}',{version},'{intake_id}',1,'policy-v1','method-v1','snapshot:{assessment_id}',
       NULL,'2026-08-12T10:00:00Z','2026-08-12T10:00:00Z','{manifest}','{'b' * 64}','{'c' * 64}',10000,
       '{decision}','{deterministic_maximum}','Human final readiness review','human:reviewer','{reviewed_at}','{digest_char * 64}','{created_at}');
    """


def gap_insert_sql(
    tenant_id: str,
    project_id: str,
    assessment_id: str,
    version: int,
    gap_id: str,
    gate_id: str,
    code: str,
    blocking: bool,
    severity: str,
) -> str:
    return f"""
    INSERT INTO agroway_invest.readiness_gap
      (gap_id,tenant_id,project_id,assessment_id,assessment_version,gate_id,code,severity,blocking,description,source_ref,owner_ref,due_at,required_evidence_roles,opened_at)
    VALUES
      ('{gap_id}','{tenant_id}','{project_id}','{assessment_id}',{version},'{gate_id}','{code}','{severity}',{'true' if blocking else 'false'},
       '{code} description','gate:{gate_id}','human:owner','2026-08-13T10:00:00Z',ARRAY['ROLE:{gate_id}']::text[],'2026-08-12T10:30:00Z');
    """


def gap_initial_transition_sql(
    tenant_id: str,
    project_id: str,
    assessment_id: str,
    version: int,
    gap_id: str,
    transition_id: str,
) -> str:
    return f"""
    INSERT INTO agroway_invest.readiness_gap_transition
      (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
    VALUES
      ('{transition_id}','{tenant_id}','{project_id}','{assessment_id}',{version},'{gap_id}',0,NULL,'OPEN','human:reviewer',ARRAY[]::text[],NULL,'2026-08-12T10:30:00Z');
    """


def intake_setup_sql(tenant_id: str, project_id: str, intake_id: str, created_at: str = "2026-08-12T09:00:00Z") -> str:
    states = [
        "CREATED",
        "CANONICAL_REUSE_SCAN",
        "DATA_COMPLETION",
        "EVIDENCE_VALIDATION",
        "ASSESSMENT_READY",
        "UNDER_ASSESSMENT",
        "HUMAN_REVIEW",
    ]
    lines = [
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake
          (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,originator_ref,consent_set_ref,data_pack_version,created_at)
        VALUES
          ('{intake_id}','{tenant_id}','{project_id}',1,'SANA_DIAGNOSTIC','diagnostic:{project_id}','sana:test','consent:test','datapack-v1','{created_at}');
        """
    ]
    for index, state in enumerate(states):
        from_state = "NULL" if index == 0 else f"'{states[index-1]}'"
        at = f"2026-08-12T09:{index:02d}:00Z"
        transition_uuid = f"55555555-5555-4555-8555-{index+1:012d}"
        if intake_id == INTAKE_B:
            transition_uuid = f"66666666-6666-4666-8666-{index+1:012d}"
        elif intake_id == INTAKE_C:
            transition_uuid = f"77777777-7777-4777-8777-{index+1:012d}"
        lines.append(
            f"""
            INSERT INTO agroway_invest.capital_pilot_intake_transition
              (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
            VALUES
              ('{transition_uuid}','{tenant_id}','{project_id}','{intake_id}',1,{index},{from_state},'{state}','human:test','{at}');
            """
        )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Role and canonical project fixtures
# ---------------------------------------------------------------------------

expect_success(
    "POSTGRES_TEST_ROLE_AND_FIXTURES",
    f"""
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
      ('{PROJECT_A}','{TENANT_A}','INT16-A','Readiness project A','UNDER_REVIEW','NOT_EVALUATED','aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000002','["aaaaaaaa-0000-4000-8000-000000000003"]'::jsonb,'["aaaaaaaa-0000-4000-8000-000000000004"]'::jsonb,'COP',100000000,0,0,0,'2026-08-12T08:00:00Z','2026-08-12T08:00:00Z'),
      ('{PROJECT_B}','{TENANT_B}','INT16-B','Readiness project B','UNDER_REVIEW','NOT_EVALUATED','bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002','["bbbbbbbb-0000-4000-8000-000000000003"]'::jsonb,'["bbbbbbbb-0000-4000-8000-000000000004"]'::jsonb,'COP',100000000,0,0,0,'2026-08-12T08:00:00Z','2026-08-12T08:00:00Z'),
      ('{PROJECT_C}','{TENANT_A}','INT16-C','Readiness project C','UNDER_REVIEW','NOT_EVALUATED','cccccccc-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000002','["cccccccc-0000-4000-8000-000000000003"]'::jsonb,'["cccccccc-0000-4000-8000-000000000004"]'::jsonb,'COP',100000000,0,0,0,'2026-08-12T08:00:00Z','2026-08-12T08:00:00Z');
    """,
)

expect_success(
    "FORCE_RLS_ENABLED_SIX_TABLES",
    """
    SELECT count(*)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='agroway_invest'
      AND c.relname IN ('capital_pilot_intake','capital_pilot_intake_transition','readiness_assessment','readiness_gate_assessment','readiness_gap','readiness_gap_transition')
      AND c.relrowsecurity AND c.relforcerowsecurity;
    """,
    "6",
)

# Create tenant A/C through the real non-owner app role. Tenant B is owner fixture
# used to prove cross-tenant invisibility.
expect_success("TENANT_A_INTAKE_TO_HUMAN_REVIEW", tenant_tx(TENANT_A, intake_setup_sql(TENANT_A, PROJECT_A, INTAKE_A)))
expect_success("TENANT_C_INTAKE_TO_HUMAN_REVIEW", tenant_tx(TENANT_A, intake_setup_sql(TENANT_A, PROJECT_C, INTAKE_C)))
expect_success(
    "TENANT_B_INTAKE_OWNER_FIXTURE",
    intake_setup_sql(TENANT_B, PROJECT_B, INTAKE_B),
)

# ---------------------------------------------------------------------------
# RLS / tenant isolation / immutable privileges
# ---------------------------------------------------------------------------

expect_success(
    "RLS_TENANT_A_SEES_ONLY_OWN_INTAKES",
    tenant_tx(TENANT_A, "SELECT count(*) FROM agroway_invest.capital_pilot_intake;"),
    "2",
)

expect_success(
    "RLS_UNSET_TENANT_FAILS_CLOSED_SELECT",
    """
    BEGIN;
    SET LOCAL ROLE agroway_app_test;
    SELECT count(*) FROM agroway_invest.capital_pilot_intake;
    COMMIT;
    """,
    "0",
)

expect_failure(
    "RLS_MALFORMED_TENANT_FAILS_CLOSED",
    """
    BEGIN;
    SET LOCAL ROLE agroway_app_test;
    SET LOCAL app.tenant_id='not-a-uuid';
    SELECT count(*) FROM agroway_invest.capital_pilot_intake;
    COMMIT;
    "invalid input syntax for type uuid",
)

expect_failure(
    "RLS_CROSS_TENANT_INSERT_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake
          (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
        VALUES
          ('88888888-8888-4888-8888-888888888881','{TENANT_B}','{PROJECT_B}',2,'SANA_DIAGNOSTIC','cross-tenant','v1','2026-08-12T09:00:00Z');
        """,
    ),
    "row-level security policy",
)

expect_failure(
    "COMPOSITE_SCOPE_FORGED_TENANT_PROJECT_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake
          (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
        VALUES
          ('88888888-8888-4888-8888-888888888882','{TENANT_A}','{PROJECT_B}',1,'SANA_DIAGNOSTIC','forged-project','v1','2026-08-12T09:00:00Z');
        """,
    ),
    "foreign key constraint",
)

expect_failure(
    "APP_ROLE_UPDATE_NOT_GRANTED",
    tenant_tx(TENANT_A, f"UPDATE agroway_invest.capital_pilot_intake SET source_ref='tamper' WHERE intake_id='{INTAKE_A}';"),
    "permission denied",
)
expect_failure(
    "APP_ROLE_DELETE_NOT_GRANTED",
    tenant_tx(TENANT_A, f"DELETE FROM agroway_invest.capital_pilot_intake WHERE intake_id='{INTAKE_A}';"),
    "permission denied",
)
expect_failure(
    "OWNER_UPDATE_BLOCKED_BY_APPEND_ONLY_TRIGGER",
    f"UPDATE agroway_invest.capital_pilot_intake SET source_ref='tamper' WHERE intake_id='{INTAKE_A}';",
    "READINESS_APPEND_ONLY",
)
expect_failure(
    "OWNER_DELETE_BLOCKED_BY_APPEND_ONLY_TRIGGER",
    f"DELETE FROM agroway_invest.capital_pilot_intake WHERE intake_id='{INTAKE_A}';",
    "READINESS_APPEND_ONLY",
)

# ---------------------------------------------------------------------------
# Intake version and transition-chain integrity
# ---------------------------------------------------------------------------

expect_failure(
    "INTAKE_DUPLICATE_VERSION_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake
          (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
        VALUES
          ('88888888-8888-4888-8888-888888888883','{TENANT_A}','{PROJECT_A}',1,'SANA_DIAGNOSTIC','duplicate-version','v1','2026-08-12T09:10:00Z');
        """,
    ),
    "INTAKE_VERSION_CHAIN_EXPECTED_NEXT_VERSION",
)

expect_failure(
    "INTAKE_VERSION_JUMP_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake
          (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,data_pack_version,created_at)
        VALUES
          ('88888888-8888-4888-8888-888888888884','{TENANT_A}','{PROJECT_A}',3,'SANA_DIAGNOSTIC','version-jump','v3','2026-08-12T09:10:00Z');
        """,
    ),
    "INTAKE_VERSION_CHAIN_PREVIOUS_MISSING",
)

expect_failure(
    "INTAKE_TRANSITION_SEQUENCE_JUMP_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake_transition
          (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
        VALUES
          ('88888888-8888-4888-8888-888888888885','{TENANT_A}','{PROJECT_A}','{INTAKE_A}',1,8,'HUMAN_REVIEW','CAPITAL_READY','human:test','2026-08-12T09:20:00Z');
        """,
    ),
    "INTAKE_TRANSITION_SEQUENCE_NOT_CONTIGUOUS",
)

expect_failure(
    "INTAKE_TRANSITION_STALE_FROM_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake_transition
          (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
        VALUES
          ('88888888-8888-4888-8888-888888888886','{TENANT_A}','{PROJECT_A}','{INTAKE_A}',1,7,'UNDER_ASSESSMENT','CAPITAL_READY','human:test','2026-08-12T09:20:00Z');
        """,
    ),
    "INTAKE_TRANSITION_FROM_STATE_STALE",
)

expect_failure(
    "INTAKE_TRANSITION_TIME_REGRESSION_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.capital_pilot_intake_transition
          (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,occurred_at)
        VALUES
          ('88888888-8888-4888-8888-888888888887','{TENANT_A}','{PROJECT_A}','{INTAKE_A}',1,7,'HUMAN_REVIEW','CAPITAL_READY','human:test','2026-08-12T09:01:00Z');
        """,
    ),
    "INTAKE_TRANSITION_TIME_REGRESSION",
)

# ---------------------------------------------------------------------------
# Valid immutable final assessment A — all nine gates PASS / CAPITAL_READY
# Child rows are inserted before the final parent so no child can be appended
# after finalization.
# ---------------------------------------------------------------------------

assessment_a = "assessment:a:v1"
expect_success(
    "VALID_CAPITAL_READY_ASSESSMENT_ATOMIC",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gate_insert_sql(TENANT_A, PROJECT_A, assessment_a, 1)}
        {assessment_insert_sql(TENANT_A, PROJECT_A, assessment_a, 1, INTAKE_A, 'CAPITAL_READY', 'CAPITAL_READY', 'd')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
)

expect_success(
    "VALID_ASSESSMENT_HAS_EXACTLY_NINE_GATES",
    tenant_tx(TENANT_A, f"SELECT count(*) FROM agroway_invest.readiness_gate_assessment WHERE assessment_id='{assessment_a}';"),
    "9",
)

expect_failure(
    "FINALIZED_ASSESSMENT_REJECTS_LATE_GAP",
    tenant_tx(
        TENANT_A,
        gap_insert_sql(TENANT_A, PROJECT_A, assessment_a, 1, "late-gap", "G5_MARKET", "LATE_GAP", False, "WARNING"),
    ),
    "READINESS_ASSESSMENT_ALREADY_FINALIZED",
)

expect_failure(
    "FINALIZED_ASSESSMENT_REJECTS_LATE_GATE",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gate_assessment
          (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version)
        VALUES
          ('{TENANT_A}','{PROJECT_A}','{assessment_a}',1,'G1_ACTOR','PASS','late',ARRAY['x']::text[],9000,'2026-08-12T10:50:00Z','human:test','method-v1');
        """,
    ),
    "READINESS_ASSESSMENT_ALREADY_FINALIZED",
)

# ---------------------------------------------------------------------------
# Adversarial final-assessment integrity transactions. Each expected failure
# rolls back, so version 2 can be reused safely.
# ---------------------------------------------------------------------------

bad_assessment = "assessment:a:v2-bad"
expect_failure(
    "EIGHT_GATE_FINAL_ASSESSMENT_DENIED_AT_CONSTRAINT_CHECK",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, only=GATES[:8])}
        {assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, 'NOT_CAPITAL_READY', 'NOT_CAPITAL_READY', 'e')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
    "READINESS_ASSESSMENT_REQUIRES_EXACTLY_NINE_GATES",
)

expect_failure(
    "DUPLICATE_GATE_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, only=['G1_ACTOR'])}
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, only=['G1_ACTOR'])}
        """,
    ),
    "duplicate key value",
)

expect_failure(
    "UNKNOWN_GATE_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        INSERT INTO agroway_invest.readiness_gate_assessment
          (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version)
        VALUES
          ('{TENANT_A}','{PROJECT_A}','{bad_assessment}',2,'G10_MAGIC','PASS','invalid',ARRAY[]::text[],9000,'2026-08-12T10:50:00Z','human:test','method-v1');
        """,
    ),
    "readiness_gate_assessment_gate_id_check",
)

expect_failure(
    "DECISION_CANNOT_EXCEED_DETERMINISTIC_MAXIMUM",
    tenant_tx(
        TENANT_A,
        assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, "CAPITAL_READY", "NOT_CAPITAL_READY", "f"),
    ),
    "readiness_assessment_decision_ceiling_ck",
)

expect_failure(
    "ASSESSMENT_VERSION_JUMP_DENIED",
    tenant_tx(
        TENANT_A,
        assessment_insert_sql(TENANT_A, PROJECT_A, "assessment:a:v3", 3, INTAKE_A, "NOT_CAPITAL_READY", "NOT_CAPITAL_READY", "1"),
    ),
    "READINESS_VERSION_CHAIN_PREVIOUS_MISSING",
)

expect_failure(
    "MALFORMED_MANIFEST_DIGEST_DENIED",
    tenant_tx(
        TENANT_A,
        assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, "NOT_CAPITAL_READY", "NOT_CAPITAL_READY", "2", manifest_digest="not-a-digest"),
    ),
    "readiness_assessment_evidence_manifest_digest_sha256_check",
)

# PASS gate + condition gap contradiction.
gap_bad = "gap:a:bad-pass"
expect_failure(
    "PASS_GATE_WITH_GAP_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gap_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, gap_bad, 'G5_MARKET', 'UNEXPECTED_CONDITION', False, 'WARNING')}
        {gap_initial_transition_sql(TENANT_A, PROJECT_A, bad_assessment, 2, gap_bad, '88888888-8888-4888-8888-888888888888')}
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2)}
        {assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, 'NOT_CAPITAL_READY', 'NOT_CAPITAL_READY', '3')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
    "READINESS_PASS_GATE_CANNOT_HAVE_GAPS",
)

# CAPITAL_READY + condition is forbidden even if max says READY.
gap_ready = "gap:a:ready-condition"
expect_failure(
    "CAPITAL_READY_WITH_ANY_GAP_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gap_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, gap_ready, 'G8_IMPACT', 'IMPACT_CONDITION', False, 'WARNING')}
        {gap_initial_transition_sql(TENANT_A, PROJECT_A, bad_assessment, 2, gap_ready, '88888888-8888-4888-8888-888888888889')}
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, overrides={'G8_IMPACT': ('PASS_WITH_CONDITIONS', ['evidence:G8_IMPACT'])})}
        {assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, 'CAPITAL_READY', 'CAPITAL_READY', '4')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
    "READINESS_CAPITAL_READY_INCONSISTENT",
)

expect_failure(
    "CONDITIONAL_WITHOUT_CONDITION_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2)}
        {assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, 'CAPITAL_READY_WITH_CONDITIONS', 'CAPITAL_READY_WITH_CONDITIONS', '5')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
    "READINESS_CONDITIONAL_DECISION_INCONSISTENT",
)

blocking_gap = "gap:a:blocking"
condition_gap = "gap:a:condition"
expect_failure(
    "CONDITIONAL_WITH_BLOCKER_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gap_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, blocking_gap, 'G5_MARKET', 'MARKET_BLOCK', True, 'CRITICAL')}
        {gap_initial_transition_sql(TENANT_A, PROJECT_A, bad_assessment, 2, blocking_gap, '88888888-8888-4888-8888-888888888890')}
        {gap_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, condition_gap, 'G8_IMPACT', 'IMPACT_CONDITION', False, 'WARNING')}
        {gap_initial_transition_sql(TENANT_A, PROJECT_A, bad_assessment, 2, condition_gap, '88888888-8888-4888-8888-888888888891')}
        {gate_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, overrides={'G5_MARKET': ('BLOCKED', ['evidence:G5_MARKET']), 'G8_IMPACT': ('PASS_WITH_CONDITIONS', ['evidence:G8_IMPACT'])})}
        {assessment_insert_sql(TENANT_A, PROJECT_A, bad_assessment, 2, INTAKE_A, 'CAPITAL_READY_WITH_CONDITIONS', 'CAPITAL_READY_WITH_CONDITIONS', '6')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
    "READINESS_CONDITIONAL_DECISION_INCONSISTENT",
)

# ---------------------------------------------------------------------------
# Valid conditional assessment C with two gaps, then append-only remediation.
# ---------------------------------------------------------------------------

assessment_c = "assessment:c:v1"
gap_c1 = "gap:c:impact:1"
gap_c2 = "gap:c:impact:2"
expect_success(
    "VALID_CONDITIONAL_ASSESSMENT_WITH_TWO_GAPS",
    tenant_tx(
        TENANT_A,
        f"""
        SET CONSTRAINTS ALL DEFERRED;
        {gap_insert_sql(TENANT_A, PROJECT_C, assessment_c, 1, gap_c1, 'G8_IMPACT', 'IMPACT_BASELINE_PARTIAL', False, 'WARNING')}
        {gap_initial_transition_sql(TENANT_A, PROJECT_C, assessment_c, 1, gap_c1, '99999999-9999-4999-8999-999999999901')}
        {gap_insert_sql(TENANT_A, PROJECT_C, assessment_c, 1, gap_c2, 'G8_IMPACT', 'IMPACT_METHOD_REVIEW', False, 'WARNING')}
        {gap_initial_transition_sql(TENANT_A, PROJECT_C, assessment_c, 1, gap_c2, '99999999-9999-4999-8999-999999999902')}
        {gate_insert_sql(TENANT_A, PROJECT_C, assessment_c, 1, overrides={'G8_IMPACT': ('PASS_WITH_CONDITIONS', ['evidence:G8_IMPACT'])})}
        {assessment_insert_sql(TENANT_A, PROJECT_C, assessment_c, 1, INTAKE_C, 'CAPITAL_READY_WITH_CONDITIONS', 'CAPITAL_READY_WITH_CONDITIONS', '7')}
        SET CONSTRAINTS ALL IMMEDIATE;
        """,
    ),
)

expect_failure(
    "GAP_TRANSITION_SEQUENCE_JUMP_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999903','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c2}',2,'OPEN','IN_REMEDIATION','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
        """,
    ),
    "READINESS_GAP_TRANSITION_SEQUENCE_NOT_CONTIGUOUS",
)

expect_failure(
    "GAP_TRANSITION_STALE_FROM_DENIED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999904','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c2}',1,'IN_REMEDIATION','EVIDENCE_SUBMITTED','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
        """,
    ),
    "READINESS_GAP_TRANSITION_FROM_STATE_STALE",
)

expect_failure(
    "GAP_DIRECT_RESOLVE_REQUIRES_EVIDENCE_NOTE",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999905','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c1}',1,'OPEN','RESOLVED','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
        """,
    ),
    "READINESS_GAP_RESOLUTION_REQUIRES_EVIDENCE_AND_NOTE",
)

expect_success(
    "GAP_DIRECT_RESOLVE_WITH_EVIDENCE_NOTE_ALLOWED",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999906','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c1}',1,'OPEN','RESOLVED','human:test',ARRAY['evidence:resolution']::text[],'Resolved after verified evidence','2026-08-12T11:10:00Z');
        """,
    ),
)

expect_failure(
    "RESOLVED_GAP_IS_TERMINAL",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999907','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c1}',2,'RESOLVED','IN_REMEDIATION','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:20:00Z');
        """,
    ),
    "READINESS_GAP_TERMINAL_STATE",
)

expect_failure(
    "GAP_WAIVER_REQUIRES_NOTE",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999908','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c2}',1,'OPEN','WAIVED','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:10:00Z');
        """,
    ),
    "READINESS_GAP_WAIVER_REQUIRES_NOTE",
)

expect_success(
    "GAP_WAIVER_WITH_HUMAN_NOTE_ALLOWED_AT_DB_LAYER",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999909','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c2}',1,'OPEN','WAIVED','human:authorized-placeholder',ARRAY[]::text[],'Explicit human waiver rationale; application permission remains INT1.7','2026-08-12T11:10:00Z');
        """,
    ),
)

expect_failure(
    "WAIVED_GAP_IS_TERMINAL",
    tenant_tx(
        TENANT_A,
        f"""
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES
          ('99999999-9999-4999-8999-999999999910','{TENANT_A}','{PROJECT_C}','{assessment_c}',1,'{gap_c2}',2,'WAIVED','IN_REMEDIATION','human:test',ARRAY[]::text[],NULL,'2026-08-12T11:20:00Z');
        """,
    ),
    "READINESS_GAP_TERMINAL_STATE",
)

# ---------------------------------------------------------------------------
# Schema boundary / no accidental authority objects.
# ---------------------------------------------------------------------------

expect_success(
    "NO_READINESS_WALLET_CUSTODY_PAYMENT_TABLES",
    """
    SELECT count(*)
    FROM information_schema.tables
    WHERE table_schema='agroway_invest'
      AND table_name IN ('wallet','custody','payment','disbursement_authority','investor_balance','kyc_document');
    """,
    "0",
)

expect_success(
    "READINESS_TABLE_COUNT_SIX",
    """
    SELECT count(*)
    FROM information_schema.tables
    WHERE table_schema='agroway_invest'
      AND table_name IN ('capital_pilot_intake','capital_pilot_intake_transition','readiness_assessment','readiness_gate_assessment','readiness_gap','readiness_gap_transition');
    """,
    "6",
)

print("PASS_CAPITAL_READINESS_POSTGRES_INT16_AB")
