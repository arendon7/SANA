\set ON_ERROR_STOP on
BEGIN;
-- Constraint boundary: provider storage can never be enabled.
INSERT INTO agroway_ai.model_policy(tenant_id,policy_id,provider,model,enabled,allowed_modes,store_provider_data,structured_outputs,max_output_tokens)
VALUES ('11111111-1111-1111-1111-111111111111','p','mock','m',true,ARRAY['READ','DRAFT'],false,false,100);
DO $$ BEGIN
  BEGIN
    INSERT INTO agroway_ai.model_policy(tenant_id,policy_id,provider,model,enabled,allowed_modes,store_provider_data,structured_outputs,max_output_tokens)
    VALUES ('11111111-1111-1111-1111-111111111111','bad-store','mock','m',true,ARRAY['READ'],true,false,100);
    RAISE EXCEPTION 'expected store_provider_data CHECK failure';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO agroway_knowledge.knowledge_document(tenant_id,document_id,title,authority,source_kind,lifecycle,current_revision)
VALUES ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Canonical agronomy','CANONICAL','AGRONOMY_PROTOCOL','PUBLISHED',1);
INSERT INTO agroway_knowledge.knowledge_revision(tenant_id,document_id,revision,canonical_text,content_sha256,published_at)
VALUES ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',1,'Use governed deterministic agronomy rules.','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',now());
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM agroway_knowledge.knowledge_revision WHERE search_vector @@ websearch_to_tsquery('simple','deterministic agronomy');
 IF n<>1 THEN RAISE EXCEPTION 'expected FTS hit'; END IF;
END $$;

INSERT INTO agroway_ai.request_audit(tenant_id,request_id,policy_id,actor_id,mode,idempotency_key,context_hash_sha256,evidence_ids)
VALUES ('11111111-1111-1111-1111-111111111111','r1','p','actor','DRAFT','idem-1','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','[]');
INSERT INTO agroway_ai.copilot_suggestion(tenant_id,suggestion_id,request_id,context_hash_sha256,title,body)
VALUES ('11111111-1111-1111-1111-111111111111','s1','r1','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','Draft','Advisory only');
DO $$ BEGIN
  BEGIN
    UPDATE agroway_ai.copilot_suggestion SET state='APPROVED' WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND suggestion_id='s1';
    RAISE EXCEPTION 'expected draft-only CHECK failure';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;
