import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const target=process.argv[2];if(!target)throw new Error('COMPILED_INVESTMENT_PORTFOLIO_INDEX_REQUIRED');
const api=await import(pathToFileURL(path.resolve(target)).href);
const {createPinnedPostgresJsPoolFactory,createProductionPostgresWiringWithPinnedDriver,resolveProductionPostgresConfig}=api;
const required=name=>{const value=process.env[name];if(!value)throw new Error(`ALPHA14_ENV_REQUIRED:${name}`);return value};
const host=required('ALPHA14_PG_HOST'),password=required('ALPHA14_PG_PASSWORD'),ca=Buffer.from(required('ALPHA14_PG_CA_B64'),'base64').toString('utf8');
const env={AGROWAY_POSTGRES_HOST:host,AGROWAY_POSTGRES_PORT:process.env.ALPHA14_PG_PORT||'5432',AGROWAY_POSTGRES_DATABASE:'agroway_alpha14',AGROWAY_POSTGRES_USER:'agroway_control',AGROWAY_POSTGRES_PASSWORD:password,AGROWAY_POSTGRES_CA_PEM:ca,AGROWAY_POSTGRES_POOL_MAX:'3',AGROWAY_POSTGRES_CONNECT_TIMEOUT_MS:'5000',AGROWAY_POSTGRES_STATEMENT_TIMEOUT_MS:'7000'};
let passed=0;const check=(name,value)=>{assert.ok(value,name);passed++;console.log(`PASS ${name}`)};
const config=resolveProductionPostgresConfig(env);const factory=await createPinnedPostgresJsPoolFactory();check('driver:version',factory.driver.version==='3.4.9');const pool=factory.create(config);const client=await pool.connect();
try{
  await client.query('BEGIN READ ONLY');
  const result=await client.query(`SELECT $1::text AS echo,current_database() AS database,current_setting('application_name') AS application_name,(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS ssl`,['alpha14-parameter']);
  check('postgres16:parameter-roundtrip',result.rows[0]?.echo==='alpha14-parameter');check('postgres16:database',result.rows[0]?.database==='agroway_alpha14');check('postgres16:application-name',result.rows[0]?.application_name==='agroway-control');check('postgres16:tls',result.rows[0]?.ssl===true);check('postgres16:row-count',result.rowCount===1);
  await client.query('ROLLBACK');
}finally{client.release();await factory.close()}
const wiring=await createProductionPostgresWiringWithPinnedDriver(env);check('wiring:configured',wiring.state==='CONFIGURED_NOT_CONNECTED');assert.throws(()=>wiring.createCanonicalUnitOfWorkAfterConnectivityCertification(),/PRODUCTION_POSTGRES_CONNECTIVITY_CERTIFICATION_REQUIRED/);check('wiring:fail-closed-before-probe',true);const evidence=await wiring.verifyConnectivity();check('wiring:read-only-probe',evidence.state==='CONNECTED_READ_ONLY_PROBE'&&evidence.canonicalWriteExecuted===false);check('wiring:no-production-write',wiring.canonicalWriteExecuted===false);await wiring.closeDriver();
console.log(`PASS_CONTROL_POSTGRES_JS_TLS_INTEGRATION ${passed}/${passed}`);
