import type { PostgresClientLike, PostgresPoolLike, PostgresQueryResult } from './postgres-control-write-adapter.js';
import type { ProductionPostgresConfig, ProductionPostgresPoolFactory, ProductionPostgresWiring } from './postgres-production-wiring.js';
import { createProductionPostgresWiring } from './postgres-production-wiring.js';

export const PINNED_POSTGRES_JS_VERSION='3.4.9' as const;
export const PINNED_POSTGRES_JS_COMMIT='e7dfa14519f363229ccc3ead7b1b2f2051937efb' as const;
export const PINNED_POSTGRES_JS_LICENSE='Unlicense' as const;

interface PostgresJsResult<Row> extends Array<Row> { count?:number|null }
interface PostgresJsReserved {
  unsafe<Row=Record<string,unknown>>(text:string,args?:unknown[],options?:{prepare?:boolean}):Promise<PostgresJsResult<Row>>;
  release():void|Promise<void>;
}
interface PostgresJsSql {
  reserve():Promise<PostgresJsReserved>;
  end(options?:{timeout?:number}):Promise<void>;
}
interface PostgresJsOptions {
  host:string;
  port:number;
  database:string;
  username:string;
  password:string;
  max:number;
  ssl:{rejectUnauthorized:true;ca:string;servername:string};
  connect_timeout:number;
  prepare:true;
  fetch_types:false;
  connection:{application_name:'agroway-control';statement_timeout:string};
}
type PostgresJsConstructor=(options:PostgresJsOptions)=>PostgresJsSql;
type PostgresJsModule={default:PostgresJsConstructor};
export type PostgresJsModuleLoader=()=>Promise<PostgresJsModule>;

export interface PinnedPostgresJsPoolFactory extends ProductionPostgresPoolFactory {
  readonly driver:{readonly name:'postgres.js';readonly version:'3.4.9';readonly commit:string;readonly license:'Unlicense';readonly dependencyCount:0};
  close():Promise<void>;
}

export interface PinnedPostgresProductionWiring extends ProductionPostgresWiring {
  readonly driver:PinnedPostgresJsPoolFactory['driver'];
  closeDriver():Promise<void>;
}

const defaultModuleUrl=()=>new URL('../../../vendor/postgres-js-3.4.9/src/index.js',import.meta.url).href;
export const loadPinnedPostgresJsModule:PostgresJsModuleLoader=async()=>{
  const specifier=defaultModuleUrl();
  const loaded=await import(specifier) as unknown as PostgresJsModule;
  if(typeof loaded.default!=='function') throw new Error('POSTGRES_JS_VENDOR_MODULE_INVALID');
  return loaded;
};

class PostgresJsClientBridge implements PostgresClientLike {
  private released=false;
  constructor(private readonly reserved:PostgresJsReserved){}
  async query<Row=Record<string,unknown>>(text:string,values:unknown[]=[]):Promise<PostgresQueryResult<Row>>{
    if(this.released) throw new Error('POSTGRES_JS_CLIENT_ALREADY_RELEASED');
    const result=await this.reserved.unsafe<Row>(text,values,{prepare:values.length>0});
    return {rows:Array.from(result),rowCount:typeof result.count==='number'?result.count:result.length};
  }
  release():void{
    if(this.released) return;
    this.released=true;
    void this.reserved.release();
  }
}

class PostgresJsPoolBridge implements PostgresPoolLike {
  private destroyed=false;
  constructor(readonly sql:PostgresJsSql,private readonly connectTimeoutMs:number){}
  async connect():Promise<PostgresClientLike>{
    if(this.destroyed) throw new Error('POSTGRES_JS_POOL_DESTROYED');
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{
      const reserved=await Promise.race([
        this.sql.reserve(),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('POSTGRES_JS_CONNECT_TIMEOUT')),this.connectTimeoutMs+250)})
      ]);
      return new PostgresJsClientBridge(reserved);
    }catch(error){
      this.destroyed=true;
      await this.sql.end({timeout:0}).catch(()=>undefined);
      throw error;
    }finally{
      if(timer!==undefined) clearTimeout(timer);
    }
  }
  async close():Promise<void>{
    if(this.destroyed) return;
    this.destroyed=true;
    await this.sql.end({timeout:5});
  }
}

export function postgresJsOptionsFromProductionConfig(config:ProductionPostgresConfig):PostgresJsOptions {
  return Object.freeze({
    host:config.host,
    port:config.port,
    database:config.database,
    username:config.user,
    password:config.password,
    max:config.maxPoolSize,
    ssl:Object.freeze({rejectUnauthorized:true,ca:config.ssl.ca,servername:config.ssl.servername}),
    connect_timeout:Math.max(1,Math.ceil(config.connectionTimeoutMs/1000)),
    prepare:true,
    fetch_types:false,
    connection:Object.freeze({application_name:'agroway-control',statement_timeout:String(config.statementTimeoutMs)})
  });
}

export async function createPinnedPostgresJsPoolFactory(loader:PostgresJsModuleLoader=loadPinnedPostgresJsModule):Promise<PinnedPostgresJsPoolFactory>{
  const module=await loader();
  if(typeof module.default!=='function') throw new Error('POSTGRES_JS_VENDOR_MODULE_INVALID');
  const pools=new Set<PostgresJsPoolBridge>();
  return Object.freeze({
    driver:Object.freeze({name:'postgres.js' as const,version:PINNED_POSTGRES_JS_VERSION,commit:PINNED_POSTGRES_JS_COMMIT,license:PINNED_POSTGRES_JS_LICENSE,dependencyCount:0 as const}),
    create(config:ProductionPostgresConfig):PostgresPoolLike{
      const pool=new PostgresJsPoolBridge(module.default(postgresJsOptionsFromProductionConfig(config)),config.connectionTimeoutMs);
      pools.add(pool);
      return pool;
    },
    async close():Promise<void>{
      await Promise.all([...pools].map(pool=>pool.close()));
      pools.clear();
    }
  });
}

export async function createProductionPostgresWiringWithPinnedDriver(env:Readonly<Record<string,string|undefined>>,loader:PostgresJsModuleLoader=loadPinnedPostgresJsModule):Promise<PinnedPostgresProductionWiring>{
  const factory=await createPinnedPostgresJsPoolFactory(loader);
  const wiring=createProductionPostgresWiring(env,factory);
  return Object.freeze({...wiring,driver:factory.driver,closeDriver:()=>factory.close()});
}
