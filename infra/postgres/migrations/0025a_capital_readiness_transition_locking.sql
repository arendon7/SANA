BEGIN;

-- INT1.6A concurrency correction.
-- Append-only transition writers must not require SQL UPDATE privilege merely to
-- serialize their next-sequence read. Transaction-scoped advisory locks provide
-- per-object serialization while keeping the runtime privilege contract at
-- SELECT + INSERT only.

CREATE OR REPLACE FUNCTION agroway_invest.assert_intake_transition_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior_sequence integer;
  prior_to_state text;
  prior_occurred_at timestamptz;
  paused_from_state text;
  intake_created_at timestamptz;
  legal boolean := false;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'capital-readiness:intake:' || NEW.tenant_id::text || ':' || NEW.project_id::text || ':' || NEW.intake_id::text,
      0
    )
  );

  SELECT created_at INTO intake_created_at
  FROM agroway_invest.capital_pilot_intake
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND intake_id = NEW.intake_id
    AND intake_version = NEW.intake_version;

  IF intake_created_at IS NULL THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_PARENT_MISSING'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.occurred_at < intake_created_at THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_BEFORE_INTAKE_CREATION'
      USING ERRCODE = '23514';
  END IF;

  SELECT sequence, to_state, occurred_at
  INTO prior_sequence, prior_to_state, prior_occurred_at
  FROM agroway_invest.capital_pilot_intake_transition
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND intake_id = NEW.intake_id
  ORDER BY sequence DESC
  LIMIT 1;

  IF NOT FOUND THEN
    IF NEW.sequence <> 0 OR NEW.from_state IS NOT NULL OR NEW.to_state <> 'CREATED' THEN
      RAISE EXCEPTION 'INTAKE_INITIAL_TRANSITION_MUST_BE_NULL_TO_CREATED_SEQUENCE_0'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.sequence <> prior_sequence + 1 THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_SEQUENCE_NOT_CONTIGUOUS'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.from_state IS DISTINCT FROM prior_to_state THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_FROM_STATE_STALE'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.occurred_at < prior_occurred_at THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_TIME_REGRESSION'
      USING ERRCODE = '23514';
  END IF;

  IF prior_to_state = 'WITHDRAWN' THEN
    RAISE EXCEPTION 'WITHDRAWN_INTAKE_IS_TERMINAL'
      USING ERRCODE = '23514';
  END IF;

  IF prior_to_state = 'PAUSED' THEN
    IF NEW.to_state = 'WITHDRAWN' THEN
      legal := true;
    ELSE
      SELECT to_state INTO paused_from_state
      FROM agroway_invest.capital_pilot_intake_transition
      WHERE tenant_id = NEW.tenant_id
        AND project_id = NEW.project_id
        AND intake_id = NEW.intake_id
        AND sequence = prior_sequence - 1;

      IF NOT FOUND OR NEW.to_state IS DISTINCT FROM paused_from_state THEN
        RAISE EXCEPTION 'INVALID_INTAKE_RESUME_TARGET'
          USING ERRCODE = '23514';
      END IF;
      legal := true;
    END IF;
  ELSE
    legal := CASE prior_to_state
      WHEN 'CREATED' THEN NEW.to_state IN ('CANONICAL_REUSE_SCAN','PAUSED','WITHDRAWN')
      WHEN 'CANONICAL_REUSE_SCAN' THEN NEW.to_state IN ('DATA_COMPLETION','PAUSED','WITHDRAWN')
      WHEN 'DATA_COMPLETION' THEN NEW.to_state IN ('EVIDENCE_VALIDATION','PAUSED','WITHDRAWN')
      WHEN 'EVIDENCE_VALIDATION' THEN NEW.to_state IN ('DATA_COMPLETION','ASSESSMENT_READY','PAUSED','WITHDRAWN')
      WHEN 'ASSESSMENT_READY' THEN NEW.to_state IN ('UNDER_ASSESSMENT','PAUSED','WITHDRAWN')
      WHEN 'UNDER_ASSESSMENT' THEN NEW.to_state IN ('GAP_REMEDIATION','HUMAN_REVIEW','PAUSED','WITHDRAWN')
      WHEN 'GAP_REMEDIATION' THEN NEW.to_state IN ('EVIDENCE_VALIDATION','UNDER_ASSESSMENT','HUMAN_REVIEW','PAUSED','WITHDRAWN')
      WHEN 'HUMAN_REVIEW' THEN NEW.to_state IN ('CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED','GAP_REMEDIATION','PAUSED','WITHDRAWN')
      WHEN 'CAPITAL_READY' THEN NEW.to_state IN ('REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN')
      WHEN 'READY_WITH_CONDITIONS' THEN NEW.to_state IN ('GAP_REMEDIATION','REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN')
      WHEN 'NOT_READY' THEN NEW.to_state IN ('GAP_REMEDIATION','REASSESSMENT_REQUIRED','WITHDRAWN')
      WHEN 'REASSESSMENT_REQUIRED' THEN NEW.to_state IN ('DATA_COMPLETION','EVIDENCE_VALIDATION','UNDER_ASSESSMENT','PAUSED','WITHDRAWN')
      ELSE false
    END;
  END IF;

  IF NOT legal THEN
    RAISE EXCEPTION 'INVALID_INTAKE_TRANSITION:%:%', prior_to_state, NEW.to_state
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION agroway_invest.assert_gap_transition_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior_sequence integer;
  prior_to_state text;
  prior_occurred_at timestamptz;
  gap_opened_at timestamptz;
  legal boolean := false;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'capital-readiness:gap:' || NEW.tenant_id::text || ':' || NEW.project_id::text || ':' || NEW.assessment_id || ':' || NEW.gap_id,
      0
    )
  );

  SELECT opened_at INTO gap_opened_at
  FROM agroway_invest.readiness_gap
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND assessment_id = NEW.assessment_id
    AND assessment_version = NEW.assessment_version
    AND gap_id = NEW.gap_id;

  IF gap_opened_at IS NULL THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_PARENT_MISSING'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.occurred_at < gap_opened_at THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_BEFORE_OPENED'
      USING ERRCODE = '23514';
  END IF;

  SELECT sequence, to_state, occurred_at
  INTO prior_sequence, prior_to_state, prior_occurred_at
  FROM agroway_invest.readiness_gap_transition
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND assessment_id = NEW.assessment_id
    AND assessment_version = NEW.assessment_version
    AND gap_id = NEW.gap_id
  ORDER BY sequence DESC
  LIMIT 1;

  IF NOT FOUND THEN
    IF NEW.sequence <> 0 OR NEW.from_state IS NOT NULL OR NEW.to_state <> 'OPEN' THEN
      RAISE EXCEPTION 'READINESS_GAP_INITIAL_TRANSITION_MUST_BE_NULL_TO_OPEN_SEQUENCE_0'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.sequence <> prior_sequence + 1 THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_SEQUENCE_NOT_CONTIGUOUS'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.from_state IS DISTINCT FROM prior_to_state THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_FROM_STATE_STALE'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.occurred_at < prior_occurred_at THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_TIME_REGRESSION'
      USING ERRCODE = '23514';
  END IF;

  IF prior_to_state IN ('RESOLVED','WAIVED','SUPERSEDED') THEN
    RAISE EXCEPTION 'READINESS_GAP_TERMINAL_STATE'
      USING ERRCODE = '23514';
  END IF;

  legal := CASE prior_to_state
    WHEN 'OPEN' THEN NEW.to_state IN ('IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED')
    WHEN 'IN_REMEDIATION' THEN NEW.to_state IN ('EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED')
    WHEN 'EVIDENCE_SUBMITTED' THEN NEW.to_state IN ('IN_REMEDIATION','RESOLVED','WAIVED','SUPERSEDED')
    ELSE false
  END;

  IF NOT legal THEN
    RAISE EXCEPTION 'INVALID_READINESS_GAP_TRANSITION:%:%', prior_to_state, NEW.to_state
      USING ERRCODE = '23514';
  END IF;

  IF NEW.to_state = 'RESOLVED' THEN
    IF cardinality(NEW.resolution_evidence_refs) = 0 OR NEW.note IS NULL OR length(btrim(NEW.note)) = 0 THEN
      RAISE EXCEPTION 'READINESS_GAP_RESOLUTION_REQUIRES_EVIDENCE_AND_NOTE'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.to_state = 'WAIVED' THEN
    IF NEW.note IS NULL OR length(btrim(NEW.note)) = 0 THEN
      RAISE EXCEPTION 'READINESS_GAP_WAIVER_REQUIRES_NOTE'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION agroway_invest.assert_intake_transition_chain() IS
  'Serializes append-only intake transitions with a transaction advisory lock; does not require UPDATE privilege on readiness tables.';
COMMENT ON FUNCTION agroway_invest.assert_gap_transition_chain() IS
  'Serializes append-only gap transitions with a transaction advisory lock; does not require UPDATE privilege on readiness tables.';

COMMIT;
