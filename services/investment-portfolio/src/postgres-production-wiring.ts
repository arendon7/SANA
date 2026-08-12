import type { CanonicalInvestmentUnitOfWork } from './control-write-adapter.js';
import { createPostgresCanonicalInvestmentUnitOfWork, type PostgresPoolLike } from './postgres-control-write-adapter.js';

export interface ProductionPostgresConfig {
  readonly host:string;
  readonly port:number;
  readonly database:string;
  readonly user:string;
  readonly password:string;
  readonly ssl:{readonly rejectUnauthorized:true;readonly ca:string;readonly servername:string};
  readonly applicationName:'agroway-control';
  readonly maxPoolSize:number;
  readonly connectionTimeoutMs:number;
  readonly statementTimeoutMs:number;
}

export interface RedactedProductionPostgresConfig {
  readonly host:string;
  readonly port:number;
  readonly database:string;
  readonly user:string;
  readonly password:'[REDACTED]';
  readonly tls:'VERIFY_CA_AND_HOSTNAME';
  readonly applicationName:'agroway-control';
  readonly maxPoolSize:number;
  readonly connectionTimeoutMs:number;
  readonly statementTimeoutMs:number;
}

export interface ProductionPostgresPoolFactory {
  create(config:ProductionPostgresConfig):PostgresPoolLike;
}

export interface ProductionPostgresConnectivityEvidence {
  readonly state:'CONNECTED_READ_ONLY_PROBE';
  readonly database:string;
  readonly applicationName:'agroway-control';
  readonly tlsRequired:true;
  readonly canonicalWriteExecuted:false;
}

export interface ProductionPostgresWiring {
  readonly state:'CONFIGURED_NOT_CONNECTED';
  readonly redacted:RedactedProductionPostgresConfig;
  readonly canonicalWriteExecuted:false;
  verifyConnectivity():Promise<ProductionPostgresConnectivityEvidence>;
  createCanonicalUnitOfWorkAfterConnectivityCertification():CanonicalInvestmentUnitOfWork;
}

const required=(env:Readonly<Record<string,string|undefined>>,key:string):string=>{
  const value=env[key]?.trim();
  if(!value) throw new Error(`PRODUCTION_POSTGRES_ENV_REQUIRED:${key}`);
  return value;
};
const boundedInt=(raw:string,key:string,min:number,max:number):number=>{
  if(!/^\d+$/.test(raw)) throw new Error(`PRODUCTION_POSTGRES_ENV_INTEGER:${key}`);
  const value=Number(raw);
  if(!Number.isSafeInteger(value)||value<min||value>max) throw new Error(`PRODUCTION_POSTGRES_ENV_RANGE:${key}`);
  return value;
};
const safeIdentifier=(value:string,key:string):string=>{
  if(!/^[A-Za-z0-9_.-]{1,128}$/.test(value)) throw new Error(`PRODUCTION_POSTGRES_ENV_INVALID:${key}`);
  return value;
};
const validateHost=(host:string):string=>{
  const lower=host.toLowerCase();
  if(['localhost','127.0.0.1','::1'].includes(lower)||lower.endsWith('.local')) throw new Error('PRODUCTION_POSTGRES_LOCALHOST_FORBIDDEN');
  if(!/^[A-Za-z0-9.-]{1,253}$/.test(host)||host.startsWith('.')||host.endsWith('.')) throw new Error('PRODUCTION_POSTGRES_HOST_INVALID');
  return host;
};
const validateCa=(ca:string):string=>{
  if(!ca.includes('-----BEGIN CERTIFICATE-----')||!ca.includes('-----END CERTIFICATE-----')) throw new Error('PRODUCTION_POSTGRES_CA_PEM_REQUIRED');
  return ca;
};

export function resolveProductionPostgresConfig(env:Readonly<Record<string,string|undefined>>):ProductionPostgresConfig {
  const host=validateHost(required(env,'AGROWAY_POSTGRES_HOST'));
  const servername=validateHost(env.AGROWAY_POSTGRES_TLS_SERVERNAME?.trim()||host);
  if(servername!==host) throw new Error('PRODUCTION_POSTGRES_TLS_SERVERNAME_HOST_MISMATCH');
  const port=boundedInt(env.AGROWAY_POSTGRES_PORT?.trim()||'5432','AGROWAY_POSTGRES_PORT',1,65535);
  const database=safeIdentifier(required(env,'AGROWAY_POSTGRES_DATABASE'),'AGROWAY_POSTGRES_DATABASE');
  const user=safeIdentifier(required(env,'AGROWAY_POSTGRES_USER'),'AGROWAY_POSTGRES_USER');
  const password=required(env,'AGROWAY_POSTGRES_PASSWORD');
  if(password.length<20) throw new Error('PRODUCTION_POSTGRES_PASSWORD_TOO_SHORT');
  const ca=validateCa(required(env,'AGROWAY_POSTGRES_CA_PEM'));
  const maxPoolSize=boundedInt(env.AGROWAY_POSTGRES_POOL_MAX?.trim()||'10','AGROWAY_POSTGRES_POOL_MAX',1,20);
  const connectionTimeoutMs=boundedInt(env.AGROWAY_POSTGRES_CONNECT_TIMEOUT_MS?.trim()||'5000','AGROWAY_POSTGRES_CONNECT_TIMEOUT_MS',500,15000);
  const statementTimeoutMs=boundedInt(env.AGROWAY_POSTGRES_STATEMENT_TIMEOUT_MS?.trim()||'10000','AGROWAY_POSTGRES_STATEMENT_TIMEOUT_MS',1000,30000);
  return Object.freeze({host,port,database,user,password,ssl:Object.freeze({rejectUnauthorized:true,ca,servername}),applicationName:'agroway-control',maxPoolSize,connectionTimeoutMs,statementTimeoutMs});
}

export function redactProductionPostgresConfig(config:ProductionPostgresConfig):RedactedProductionPostgresConfig {
  return Object.freeze({host:config.host,port:config.port,database:config.database,user:config.user,password:'[REDACTED]',tls:'VERIFY_CA_AND_HOSTNAME',applicationName:'agroway-control',maxPoolSize:config.maxPoolSize,connectionTimeoutMs:config.connectionTimeoutMs,statementTimeoutMs:config.statementTimeoutMs});
}

export function createProductionPostgresWiring(env:Readonly<Record<string,string|undefined>>,factory:ProductionPostgresPoolFactory):ProductionPostgresWiring {
  const config=resolveProductionPostgresConfig(env);
  const pool=factory.create(config);
  return Object.freeze({
    state:'CONFIGURED_NOT_CONNECTED' as const,
    redacted:redactProductionPostgresConfig(config),
    canonicalWriteExecuted:false as const,
    async verifyConnectivity():Promise<ProductionPostgresConnectivityEvidence>{
      const client=await pool.connect();
      try{
        const result=await client.query<{database:unknown;application_name:unknown}>('SELECT current_database() AS database, current_setting(\'application_name\') AS application_name');
        const row=result.rows[0];
        if(!row||row.database!==config.database) throw new Error('PRODUCTION_POSTGRES_DATABASE_IDENTITY_MISMATCH');
        if(row.application_name!==config.applicationName) throw new Error('PRODUCTION_POSTGRES_APPLICATION_NAME_MISMATCH');
        return Object.freeze({state:'CONNECTED_READ_ONLY_PROBE',database:config.database,applicationName:'agroway-control',tlsRequired:true,canonicalWriteExecuted:false});
      }finally{client.release();}
    },
    createCanonicalUnitOfWorkAfterConnectivityCertification():CanonicalInvestmentUnitOfWork{
      return createPostgresCanonicalInvestmentUnitOfWork(pool);
    }
  });
}
