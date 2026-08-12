import { createHash } from 'node:crypto';
import type { InvestmentProject } from '@agroway/invest-control-contracts';
import type {
  CanonicalInvestmentTransaction,
  CanonicalInvestmentUnitOfWork,
  CanonicalOutboxEvent,
  CanonicalWriteReceipt
} from './control-write-adapter.js';

export interface PostgresQueryResult<Row=Record<string,unknown>> {
  rows:Row[];
  rowCount?:number|null;
}

export interface PostgresClientLike {
  query<Row=Record<string,unknown>>(text:string,values?:unknown[]):Promise<PostgresQueryResult<Row>>;
  release():void;
}

export interface PostgresPoolLike {
  connect():Promise<PostgresClientLike>;
}

type DbRow=Record<string,unknown>;

const nonEmpty=(value:unknown,code:string):string=>{
  if(typeof value!=='string'||!value.trim()) throw new Error(code);
  return value;
};
const integer=(value:unknown,code:string):number=>{
  const parsed=typeof value==='number'?value:Number(value);
  if(!Number.isSafeInteger(parsed)) throw new Error(code);
  return parsed;
};
const iso=(value:unknown,code:string):string=>{
  const candidate=value instanceof Date?value.toISOString():typeof value==='string'?value:'';
  if(!candidate||!Number.isFinite(Date.parse(candidate))) throw new Error(code);
  return candidate;
};
const stringArray=(value:unknown,code:string):readonly string[]=>{
  if(!Array.isArray(value)||value.some(item=>typeof item!=='string')) throw new Error(code);
  return Object.freeze([...value]);
};

function hydrateProject(row:DbRow):InvestmentProject {
  return {
    projectId:nonEmpty(row.project_id,'POSTGRES_PROJECT_ID_INVALID'),
    tenantId:nonEmpty(row.tenant_id,'POSTGRES_PROJECT_TENANT_INVALID'),
    code:nonEmpty(row.code,'POSTGRES_PROJECT_CODE_INVALID'),
    name:nonEmpty(row.name,'POSTGRES_PROJECT_NAME_INVALID'),
    state:nonEmpty(row.state,'POSTGRES_PROJECT_STATE_INVALID') as InvestmentProject['state'],
    eligibility:nonEmpty(row.eligibility,'POSTGRES_PROJECT_ELIGIBILITY_INVALID') as InvestmentProject['eligibility'],
    productionRef:{
      producerId:nonEmpty(row.producer_id,'POSTGRES_PROJECT_PRODUCER_INVALID'),
      farmId:nonEmpty(row.farm_id,'POSTGRES_PROJECT_FARM_INVALID'),
      plotIds:stringArray(row.plot_ids,'POSTGRES_PROJECT_PLOTS_INVALID'),
      cropCycleIds:stringArray(row.crop_cycle_ids,'POSTGRES_PROJECT_CROP_CYCLES_INVALID')
    },
    currency:nonEmpty(row.currency,'POSTGRES_PROJECT_CURRENCY_INVALID'),
    requiredMinor:integer(row.required_minor,'POSTGRES_PROJECT_REQUIRED_MINOR_INVALID'),
    committedMinor:integer(row.committed_minor,'POSTGRES_PROJECT_COMMITTED_MINOR_INVALID'),
    deployedMinor:integer(row.deployed_minor,'POSTGRES_PROJECT_DEPLOYED_MINOR_INVALID'),
    recoveredMinor:integer(row.recovered_minor,'POSTGRES_PROJECT_RECOVERED_MINOR_INVALID'),
    ...(row.approved_budget_version===null||row.approved_budget_version===undefined?{}:{approvedBudgetVersion:integer(row.approved_budget_version,'POSTGRES_PROJECT_BUDGET_VERSION_INVALID')}),
    createdAt:iso(row.created_at,'POSTGRES_PROJECT_CREATED_AT_INVALID'),
    updatedAt:iso(row.updated_at,'POSTGRES_PROJECT_UPDATED_AT_INVALID')
  };
}

function hydrateReceipt(row:DbRow):CanonicalWriteReceipt {
  if(row.canonical_mutated!==true||row.outbox_appended!==true) throw new Error('POSTGRES_RECEIPT_TRUTH_INVALID');
  const commandKind=nonEmpty(row.command_kind,'POSTGRES_RECEIPT_COMMAND_INVALID');
  const state=nonEmpty(row.state,'POSTGRES_RECEIPT_STATE_INVALID');
  if(commandKind!=='DECLARE_CAPITAL_REQUIREMENT'||state!=='COMMITTED_TO_CANONICAL_PORT') throw new Error('POSTGRES_RECEIPT_STATE_INVALID');
  return {
    receiptId:nonEmpty(row.receipt_id,'POSTGRES_RECEIPT_ID_INVALID'),
    tenantId:nonEmpty(row.tenant_id,'POSTGRES_RECEIPT_TENANT_INVALID'),
    projectId:nonEmpty(row.project_id,'POSTGRES_RECEIPT_PROJECT_INVALID'),
    operationId:nonEmpty(row.operation_id,'POSTGRES_RECEIPT_OPERATION_INVALID'),
    idempotencyKey:nonEmpty(row.idempotency_key,'POSTGRES_RECEIPT_IDEMPOTENCY_INVALID'),
    authorizationContextDigestSha256:nonEmpty(row.authorization_context_digest_sha256,'POSTGRES_RECEIPT_DIGEST_INVALID'),
    commandKind:'DECLARE_CAPITAL_REQUIREMENT',
    state:'COMMITTED_TO_CANONICAL_PORT',
    canonicalMutated:true,
    outboxAppended:true,
    committedAt:iso(row.committed_at,'POSTGRES_RECEIPT_COMMITTED_AT_INVALID')
  };
}

function deterministicEventUuid(eventKey:string):string {
  const hex=createHash('sha256').update(eventKey).digest('hex').slice(0,32);
  const variant=['8','9','a','b'][Number.parseInt(hex[16]!,16)%4]!;
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-${variant}${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

class PostgresCanonicalInvestmentTransaction implements CanonicalInvestmentTransaction {
  private tenantId?:string;
  constructor(private readonly client:PostgresClientLike) {}

  private async bindTenant(tenantId:string):Promise<void>{
    if(this.tenantId&&this.tenantId!==tenantId) throw new Error('POSTGRES_TRANSACTION_TENANT_SWITCH_FORBIDDEN');
    if(this.tenantId) return;
    await this.client.query("SELECT set_config('app.tenant_id',$1,true)",[tenantId]);
    this.tenantId=tenantId;
  }

  async findReceipt(tenantId:string,idempotencyKey:string):Promise<CanonicalWriteReceipt|undefined>{
    await this.bindTenant(tenantId);
    await this.client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${tenantId}:${idempotencyKey}`]);
    const result=await this.client.query<DbRow>(`SELECT receipt_id,tenant_id,project_id,operation_id,idempotency_key,authorization_context_digest_sha256,command_kind,state,canonical_mutated,outbox_appended,committed_at
      FROM agroway_invest.control_write_receipt
      WHERE tenant_id=$1::uuid AND idempotency_key=$2`,[tenantId,idempotencyKey]);
    return result.rows[0]?hydrateReceipt(result.rows[0]):undefined;
  }

  async loadProjectForUpdate(tenantId:string,projectId:string):Promise<InvestmentProject|undefined>{
    await this.bindTenant(tenantId);
    const result=await this.client.query<DbRow>(`SELECT project_id,tenant_id,code,name,state,eligibility,producer_id,farm_id,plot_ids,crop_cycle_ids,currency,required_minor,committed_minor,deployed_minor,recovered_minor,approved_budget_version,created_at,updated_at
      FROM agroway_invest.project
      WHERE tenant_id=$1::uuid AND project_id=$2::uuid
      FOR UPDATE`,[tenantId,projectId]);
    return result.rows[0]?hydrateProject(result.rows[0]):undefined;
  }

  async saveProject(project:InvestmentProject):Promise<void>{
    await this.bindTenant(project.tenantId);
    const result=await this.client.query(`UPDATE agroway_invest.project
      SET required_minor=$1,updated_at=$2::timestamptz
      WHERE tenant_id=$3::uuid AND project_id=$4::uuid`,[project.requiredMinor,project.updatedAt,project.tenantId,project.projectId]);
    if(result.rowCount!==1) throw new Error('POSTGRES_PROJECT_UPDATE_LOST');
  }

  async appendOutbox(event:CanonicalOutboxEvent):Promise<void>{
    await this.bindTenant(event.tenantId);
    const result=await this.client.query(`INSERT INTO agroway_core.outbox(event_id,tenant_id,event_name,aggregate_id,payload,occurred_at)
      VALUES($1::uuid,$2::uuid,$3,$4,$5::jsonb,$6::timestamptz)`,[
      deterministicEventUuid(event.eventKey),event.tenantId,event.eventName,event.aggregateId,JSON.stringify(event.payload),event.occurredAt
    ]);
    if(result.rowCount!==1) throw new Error('POSTGRES_OUTBOX_APPEND_FAILED');
  }

  async saveReceipt(receipt:CanonicalWriteReceipt):Promise<void>{
    await this.bindTenant(receipt.tenantId);
    const result=await this.client.query(`INSERT INTO agroway_invest.control_write_receipt(
      receipt_id,tenant_id,project_id,operation_id,idempotency_key,authorization_context_digest_sha256,command_kind,state,canonical_mutated,outbox_appended,committed_at
    ) VALUES($1,$2::uuid,$3::uuid,$4,$5,$6,$7,$8,$9,$10,$11::timestamptz)`,[
      receipt.receiptId,receipt.tenantId,receipt.projectId,receipt.operationId,receipt.idempotencyKey,receipt.authorizationContextDigestSha256,
      receipt.commandKind,receipt.state,receipt.canonicalMutated,receipt.outboxAppended,receipt.committedAt
    ]);
    if(result.rowCount!==1) throw new Error('POSTGRES_RECEIPT_INSERT_FAILED');
  }
}

export function createPostgresCanonicalInvestmentUnitOfWork(pool:PostgresPoolLike):CanonicalInvestmentUnitOfWork {
  return {
    async transaction<T>(work:(tx:CanonicalInvestmentTransaction)=>Promise<T>):Promise<T>{
      const client=await pool.connect();
      try{
        await client.query('BEGIN');
        const value=await work(new PostgresCanonicalInvestmentTransaction(client));
        await client.query('COMMIT');
        return value;
      }catch(error){
        try{await client.query('ROLLBACK');}catch{ /* preserve the original transaction failure */ }
        throw error;
      }finally{
        client.release();
      }
    }
  };
}
