import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const target=process.argv[2];
if(!target) throw new Error('COMPILED_INVESTMENT_PORTFOLIO_INDEX_REQUIRED');
const api=await import(pathToFileURL(path.resolve(target)).href);
const {applyCapitalRequirementCanonicalWrite,computeCapitalRequirementAuthorizationContextDigest,createPostgresCanonicalInvestmentUnitOfWork}=api;

const tenantId='11111111-1111-4111-8111-111111111111';
const projectId='22222222-2222-4222-8222-222222222222';
const at='2026-08-12T13:45:00.000Z';
const baseProject=()=>({
  project_id:projectId,tenant_id:tenantId,code:'INV-YAR-001',name:'Yarumal regenerative cycle',state:'APPROVED',eligibility:'ELIGIBLE',
  producer_id:'33333333-3333-4333-8333-333333333333',farm_id:'44444444-4444-4444-8444-444444444444',plot_ids:['55555555-5555-4555-8555-555555555555'],crop_cycle_ids:['66666666-6666-4666-8666-666666666666'],
  currency:'COP',required_minor:'1000',committed_minor:'500',deployed_minor:'250',recovered_minor:'0',approved_budget_version:1,
  created_at:'2026-08-01T00:00:00.000Z',updated_at:'2026-08-10T00:00:00.000Z'
});

class FakeClient{
  constructor(state,options={}){this.state=state;this.options=options;this.log=[];this.snapshot=null;this.boundTenant=undefined;this.released=0;}
  async query(text,values=[]){
    const sql=text.replace(/\s+/g,' ').trim();this.log.push({sql,values:[...values]});
    if(sql==='BEGIN'){this.snapshot=structuredClone(this.state);return {rows:[],rowCount:null};}
    if(sql==='COMMIT'){this.snapshot=null;return {rows:[],rowCount:null};}
    if(sql==='ROLLBACK'){if(this.snapshot){this.state.project=this.snapshot.project;this.state.receipts=this.snapshot.receipts;this.state.outbox=this.snapshot.outbox;}this.snapshot=null;return {rows:[],rowCount:null};}
    if(sql.startsWith("SELECT set_config('app.tenant_id'")){this.boundTenant=values[0];return {rows:[{set_config:values[0]}],rowCount:1};}
    if(sql.startsWith('SELECT pg_advisory_xact_lock')) return {rows:[{}],rowCount:1};
    if(sql.includes('FROM agroway_invest.control_write_receipt')){
      const [tenant,key]=values;const row=this.state.receipts.get(`${tenant}:${key}`);return {rows:row?[structuredClone(row)]:[],rowCount:row?1:0};
    }
    if(sql.includes('FROM agroway_invest.project')&&sql.includes('FOR UPDATE')){
      const [tenant,project]=values;const row=this.state.project;
      return {rows:row&&row.tenant_id===tenant&&row.project_id===project?[structuredClone(row)]:[],rowCount:row&&row.tenant_id===tenant&&row.project_id===project?1:0};
    }
    if(sql.startsWith('UPDATE agroway_invest.project')){
      const [required,updated,tenant,project]=values;const row=this.state.project;
      if(!row||row.tenant_id!==tenant||row.project_id!==project)return {rows:[],rowCount:0};
      row.required_minor=String(required);row.updated_at=String(updated);return {rows:[],rowCount:1};
    }
    if(sql.startsWith('INSERT INTO agroway_core.outbox')){
      if(this.options.failOutbox) throw new Error('SIMULATED_OUTBOX_FAILURE');
      this.state.outbox.push({event_id:values[0],tenant_id:values[1],event_name:values[2],aggregate_id:values[3],payload:JSON.parse(String(values[4])),occurred_at:values[5]});
      return {rows:[],rowCount:1};
    }
    if(sql.startsWith('INSERT INTO agroway_invest.control_write_receipt')){
      const [receipt_id,tenant_id,project_id_value,operation_id,idempotency_key,authorization_context_digest_sha256,command_kind,state,canonical_mutated,outbox_appended,committed_at]=values;
      const row={receipt_id,tenant_id,project_id:project_id_value,operation_id,idempotency_key,authorization_context_digest_sha256,command_kind,state,canonical_mutated,outbox_appended,committed_at};
      this.state.receipts.set(`${tenant_id}:${idempotency_key}`,row);return {rows:[],rowCount:1};
    }
    throw new Error(`UNEXPECTED_SQL:${sql}`);
  }
  release(){this.released+=1;}
}
class FakePool{
  constructor(state,options={}){this.state=state;this.options=options;this.clients=[];}
  async connect(){const client=new FakeClient(this.state,this.options);this.clients.push(client);return client;}
}

const command={projectId,tenantId,amountMinor:1500,currency:'COP',at};
const digest=computeCapitalRequirementAuthorizationContextDigest(command);
const authorization={state:'AUTHORIZED_FOR_ADAPTER',tenantId,projectId,actorId:'human:finance-approver-01',operationId:'op-capital-0001',requiredPermission:'finance:update',authorizationContextDigestSha256:digest,idempotencyKey:'ctrl:capital:op-capital-0001',adapterInvocationAllowed:true,executionState:'NOT_EXECUTED',canonicalMutated:false,approvalAuthority:'HUMAN_ONLY',aiAuthority:'ADVISORY_ONLY'};

let passed=0;const check=(name,value)=>{assert.ok(value,name);passed+=1;console.log(`PASS ${name}`);};

const state={project:baseProject(),receipts:new Map(),outbox:[]};
const pool=new FakePool(state);const uow=createPostgresCanonicalInvestmentUnitOfWork(pool);
const first=await applyCapitalRequirementCanonicalWrite(authorization,command,uow);
check('commit:receipt-state',first.state==='COMMITTED_TO_CANONICAL_PORT');
check('commit:project-mutated',state.project.required_minor==='1500');
check('commit:outbox-one',state.outbox.length===1&&state.outbox[0].event_name==='CapitalRequirementDeclared');
check('commit:receipt-one',state.receipts.size===1);
const firstSql=pool.clients[0].log.map(x=>x.sql);
check('transaction:begin-first',firstSql[0]==='BEGIN');
check('transaction:tenant-rls-bound',firstSql.some(x=>x.startsWith("SELECT set_config('app.tenant_id'")));
check('transaction:idempotency-lock',firstSql.some(x=>x.startsWith('SELECT pg_advisory_xact_lock')));
check('transaction:project-for-update',firstSql.some(x=>x.includes('agroway_invest.project')&&x.includes('FOR UPDATE')));
check('transaction:canonical-update',firstSql.some(x=>x.startsWith('UPDATE agroway_invest.project')));
check('transaction:outbox-same-client',firstSql.some(x=>x.startsWith('INSERT INTO agroway_core.outbox')));
check('transaction:receipt-same-client',firstSql.some(x=>x.startsWith('INSERT INTO agroway_invest.control_write_receipt')));
check('transaction:commit-last',firstSql.at(-1)==='COMMIT');
check('transaction:released',pool.clients[0].released===1);

const replay=await applyCapitalRequirementCanonicalWrite(authorization,command,uow);
check('idempotency:same-receipt',replay.receiptId===first.receiptId);
check('idempotency:no-second-outbox',state.outbox.length===1);
check('idempotency:no-second-mutation',pool.clients[1].log.every(x=>!x.sql.startsWith('UPDATE agroway_invest.project')));
check('idempotency:replay-commits',pool.clients[1].log.at(-1).sql==='COMMIT');

const failedState={project:baseProject(),receipts:new Map(),outbox:[]};
const failedPool=new FakePool(failedState,{failOutbox:true});
await assert.rejects(()=>applyCapitalRequirementCanonicalWrite(authorization,command,createPostgresCanonicalInvestmentUnitOfWork(failedPool)),/SIMULATED_OUTBOX_FAILURE/);
check('rollback:on-outbox-failure',failedPool.clients[0].log.at(-1).sql==='ROLLBACK');
check('rollback:project-restored',failedState.project.required_minor==='1000');
check('rollback:no-receipt',failedState.receipts.size===0);
check('rollback:no-outbox',failedState.outbox.length===0);
check('rollback:released',failedPool.clients[0].released===1);

const otherTenant='77777777-7777-4777-8777-777777777777';
const otherCommand={...command,tenantId:otherTenant};
const otherAuth={...authorization,tenantId:otherTenant,authorizationContextDigestSha256:computeCapitalRequirementAuthorizationContextDigest(otherCommand),idempotencyKey:'ctrl:capital:other-000001'};
const scopePool=new FakePool({project:baseProject(),receipts:new Map(),outbox:[]});
await assert.rejects(()=>applyCapitalRequirementCanonicalWrite(otherAuth,otherCommand,createPostgresCanonicalInvestmentUnitOfWork(scopePool)),/CANONICAL_WRITE_PROJECT_NOT_FOUND/);
check('scope:cross-tenant-fails-closed',scopePool.clients[0].log.at(-1).sql==='ROLLBACK');

const conflictState={project:baseProject(),receipts:new Map(),outbox:[]};
conflictState.receipts.set(`${tenantId}:${authorization.idempotencyKey}`,{receipt_id:'cwr:conflict',tenant_id:tenantId,project_id:projectId,operation_id:'different-operation',idempotency_key:authorization.idempotencyKey,authorization_context_digest_sha256:digest,command_kind:'DECLARE_CAPITAL_REQUIREMENT',state:'COMMITTED_TO_CANONICAL_PORT',canonical_mutated:true,outbox_appended:true,committed_at:at});
const conflictPool=new FakePool(conflictState);
await assert.rejects(()=>applyCapitalRequirementCanonicalWrite(authorization,command,createPostgresCanonicalInvestmentUnitOfWork(conflictPool)),/CANONICAL_WRITE_IDEMPOTENCY_CONFLICT/);
check('idempotency:conflict-rolls-back',conflictPool.clients[0].log.at(-1).sql==='ROLLBACK');

console.log(`PASS_CONTROL_POSTGRES_WRITE_RUNTIME ${passed}/${passed}`);
