\set ON_ERROR_STOP on
DO $$ DECLARE ta uuid := '30000000-0000-0000-0000-000000000001';tb uuid := '30000000-0000-0000-0000-000000000002'; BEGIN
INSERT INTO agroway_identity.membership(tenant_id,actor_id,roles,granted_permissions,active) VALUES(ta,'admin-a',ARRAY['ADMIN'],ARRAY['identity:manage','export:create'],true),(tb,'admin-b',ARRAY['ADMIN'],ARRAY['identity:manage','export:create'],true) ON CONFLICT DO NOTHING;
BEGIN INSERT INTO agroway_identity.invitation(tenant_id,invitation_id,email,invited_by_actor_id,roles,granted_permissions,created_at,expires_at) VALUES(ta,'30000000-0000-0000-0000-000000000010','x@example.com','admin-b',ARRAY['OPERATOR'],ARRAY['field:execute'],now(),now()+interval '1 day');RAISE EXCEPTION 'expected cross-tenant invitation creator FK rejection';EXCEPTION WHEN foreign_key_violation THEN NULL;END;
INSERT INTO agroway_identity.subscription_entitlement(tenant_id,plan_tier,add_ons,status,seat_limit,effective_from) VALUES(ta,'PRO',ARRAY['PASSPORT'],'ACTIVE',8,now()-interval '1 day') ON CONFLICT (tenant_id) DO UPDATE SET plan_tier=EXCLUDED.plan_tier;
BEGIN INSERT INTO agroway_identity.data_export_request(tenant_id,export_request_id,requested_by_actor_id,format,scope,state,requested_at) VALUES(ta,'30000000-0000-0000-0000-000000000020','admin-a','JSON','FULL_TENANT_DATA','READY',now());RAISE EXCEPTION 'expected READY export without digest/artifact rejection';EXCEPTION WHEN check_violation THEN NULL;END;
END $$;
SELECT 'PASS v0.21 access entitlements portability relational invariants' AS result;
