BEGIN;

-- UX2B-0 identity persistence hardening.
-- `granted_permissions` was introduced generically by migration 0023. This
-- migration intentionally reasserts that durable column idempotently and adds
-- the stricter membership-array constraints required before Capital Readiness
-- request authority can depend on it.
--
-- Existing memberships receive NO implicit Capital Readiness authority.
-- Explicit grants are stored as data and still remain constrained by the
-- application role ceiling when a request-scoped authorizer is created.

ALTER TABLE agroway_identity.membership
  ADD COLUMN IF NOT EXISTS granted_permissions text[] NOT NULL DEFAULT ARRAY[]::text[];

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='agroway_identity.membership'::regclass
      AND conname='membership_roles_nonblank_ck'
  ) THEN
    ALTER TABLE agroway_identity.membership
      ADD CONSTRAINT membership_roles_nonblank_ck
      CHECK (cardinality(roles) > 0 AND array_position(roles,'') IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='agroway_identity.membership'::regclass
      AND conname='membership_granted_permissions_nonblank_ck'
  ) THEN
    ALTER TABLE agroway_identity.membership
      ADD CONSTRAINT membership_granted_permissions_nonblank_ck
      CHECK (array_position(granted_permissions,'') IS NULL);
  END IF;
END $$;

COMMENT ON COLUMN agroway_identity.membership.granted_permissions IS
  'Explicit permission grants introduced in 0023 and hardened for request authority in 0027. Empty by default; roles alone do not grant Capital Readiness mutation authority.';

COMMIT;
