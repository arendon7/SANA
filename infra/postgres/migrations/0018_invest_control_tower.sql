BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_invest;
CREATE SCHEMA IF NOT EXISTS agroway_control;

CREATE TABLE IF NOT EXISTS agroway_invest.project (
  project_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, code text NOT NULL, name text NOT NULL,
  state text NOT NULL CHECK(state IN ('DRAFT','UNDER_REVIEW','APPROVED','ACTIVE','PAUSED','COMPLETED','CANCELLED')),
  eligibility text NOT NULL CHECK(eligibility IN ('NOT_EVALUATED','ELIGIBLE','INELIGIBLE')),
  producer_id uuid NOT NULL, farm_id uuid NOT NULL, plot_ids jsonb NOT NULL, crop_cycle_ids jsonb NOT NULL,
  currency varchar(3) NOT NULL, required_minor bigint NOT NULL DEFAULT 0 CHECK(required_minor>=0), committed_minor bigint NOT NULL DEFAULT 0 CHECK(committed_minor>=0),
  deployed_minor bigint NOT NULL DEFAULT 0 CHECK(deployed_minor>=0), recovered_minor bigint NOT NULL DEFAULT 0 CHECK(recovered_minor>=0),
  approved_budget_version integer, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CONSTRAINT project_commitment_bound CHECK(committed_minor<=required_minor), CONSTRAINT project_deployment_bound CHECK(deployed_minor<=committed_minor),
  UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS agroway_invest.capital_commitment (
  commitment_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES agroway_invest.project(project_id),
  amount_minor bigint NOT NULL CHECK(amount_minor>0), cancelled_minor bigint NOT NULL DEFAULT 0 CHECK(cancelled_minor>=0 AND cancelled_minor<=amount_minor), currency varchar(3) NOT NULL,
  source_ref text NOT NULL, committed_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_invest.capital_deployment (
  deployment_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES agroway_invest.project(project_id), commitment_id uuid NOT NULL REFERENCES agroway_invest.capital_commitment(commitment_id),
  amount_minor bigint NOT NULL CHECK(amount_minor>0), currency varchar(3) NOT NULL, purpose_code text NOT NULL, evidence_ref text NOT NULL, deployed_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_invest.capital_recovery (
  recovery_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES agroway_invest.project(project_id), amount_minor bigint NOT NULL CHECK(amount_minor>0), currency varchar(3) NOT NULL,
  kind text NOT NULL CHECK(kind IN ('PRINCIPAL','RETURN','OTHER')), evidence_ref text NOT NULL, received_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_invest.budget_version (
  project_id uuid NOT NULL REFERENCES agroway_invest.project(project_id), tenant_id uuid NOT NULL, version integer NOT NULL CHECK(version>0), currency varchar(3) NOT NULL,
  total_minor bigint NOT NULL CHECK(total_minor>=0), state text NOT NULL CHECK(state IN ('DRAFT','APPROVED','SUPERSEDED')), created_at timestamptz NOT NULL, approved_at timestamptz,
  PRIMARY KEY(project_id,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS invest_one_approved_budget_uq ON agroway_invest.budget_version(project_id) WHERE state='APPROVED';
CREATE TABLE IF NOT EXISTS agroway_invest.budget_line (
  project_id uuid NOT NULL, tenant_id uuid NOT NULL, version integer NOT NULL, line_id uuid NOT NULL, category_code text NOT NULL, description text NOT NULL, amount_minor bigint NOT NULL CHECK(amount_minor>=0),
  PRIMARY KEY(project_id,version,line_id), FOREIGN KEY(project_id,version) REFERENCES agroway_invest.budget_version(project_id,version)
);
CREATE TABLE IF NOT EXISTS agroway_invest.risk (
  risk_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES agroway_invest.project(project_id), code text NOT NULL, title text NOT NULL,
  severity text NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')), state text NOT NULL CHECK(state IN ('OPEN','MITIGATED','ACCEPTED','CLOSED')),
  mitigation text, owner_ref text, opened_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_invest.evidence_link (
  link_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES agroway_invest.project(project_id), kind text NOT NULL CHECK(kind IN ('AGRONOMIC','FINANCIAL','MARKET','LEGAL','FIELD','IMPACT')),
  evidence_ref text NOT NULL, linked_at timestamptz NOT NULL, UNIQUE(tenant_id,project_id,evidence_ref)
);
CREATE TABLE IF NOT EXISTS agroway_control.snapshot (
  snapshot_id text PRIMARY KEY, tenant_id uuid NOT NULL, as_of timestamptz NOT NULL, network jsonb NOT NULL, capital jsonb NOT NULL, agronomy jsonb NOT NULL,
  operations jsonb NOT NULL, supply jsonb NOT NULL, demand jsonb NOT NULL, impact jsonb NOT NULL, exceptions jsonb NOT NULL, watermarks jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agroway_control.exception (
  exception_id text PRIMARY KEY, tenant_id uuid NOT NULL, code text NOT NULL, severity text NOT NULL CHECK(severity IN ('INFO','WARNING','CRITICAL')),
  state text NOT NULL CHECK(state IN ('OPEN','ACKNOWLEDGED','RESOLVED','SUPPRESSED')), subject_ref text NOT NULL, reason text NOT NULL, fingerprint text NOT NULL,
  opened_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS control_exception_active_fingerprint_uq ON agroway_control.exception(tenant_id,fingerprint) WHERE state IN ('OPEN','ACKNOWLEDGED');
CREATE TABLE IF NOT EXISTS agroway_control.projector_checkpoint (
  tenant_id uuid NOT NULL, projector text NOT NULL, source text NOT NULL, source_offset text NOT NULL, advanced_at timestamptz NOT NULL, PRIMARY KEY(tenant_id,projector,source)
);

DO $$ DECLARE sch text; t text; BEGIN
  FOR sch,t IN SELECT * FROM (VALUES
    ('agroway_invest','project'),('agroway_invest','capital_commitment'),('agroway_invest','capital_deployment'),('agroway_invest','capital_recovery'),
    ('agroway_invest','budget_version'),('agroway_invest','budget_line'),('agroway_invest','risk'),('agroway_invest','evidence_link'),
    ('agroway_control','snapshot'),('agroway_control','exception'),('agroway_control','projector_checkpoint')
  ) AS x(schema_name,table_name)
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',sch,t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=sch AND tablename=t AND policyname=t||'_tenant_rls') THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', t||'_tenant_rls',sch,t);
    END IF;
  END LOOP;
END $$;

COMMENT ON TABLE agroway_invest.project IS 'Investment twin referencing canonical AGROWAY producer/farm/plot/crop-cycle identities; not an agronomic master.';
COMMENT ON TABLE agroway_control.snapshot IS 'Rebuildable projection. Never a transactional source of truth.';
COMMIT;
