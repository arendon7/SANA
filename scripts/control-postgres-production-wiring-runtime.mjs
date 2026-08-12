import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const target=process.argv[2];if(!target)throw new Error('COMPILED_INVESTMENT_PORTFOLIO_INDEX_REQUIRED');
const api=await import(pathToFileURL(path.resolve(target)).href);
const {createProductionPostgresWiring,resolveProductionPostgresConfig}=api;
const CA='-----BEGIN CERTIFICATE-----\nTEST-CA-NOT-A-REAL-SECRET\n-----END CERTIFICATE-----';
const env={AGROWAY_POSTGRES_HOST:'db.prod.example.com',AGROWAY_POSTGRES_PORT:'5432',AGROWAY_POSTGRES_DATABASE:'agroway',AGROWAY_POSTGRES_USER:'agroway_control',AGROWAY_POSTGRES_PASSWORD:'this-is-a-runtime-test-password-1234',AGROWAY_POSTGRES_CA_PEM:CA,AGROWAY_POSTGRES_POOL_MAX:'8',AGROWAY_POSTGRES_CONNECT_TIMEOUT_MS:'4000',AGROWAY_POSTGRES_STATEMENT_TIMEOUT_MS:'9000'};
let passed=0;const check=(name,value)=>{assert.ok(value,name);passed++;console.log(`PASS ${name}`)};
const cfg=resolveProductionPostgresConfig(env);check('config:host',cfg.host==='db.prod.example.com');check('config:tls-reject-unauthorized',cfg.ssl.rejectUnauthorized===true);check('config:tls-servername',cfg.ssl.servername===cfg.host);check('config:pool-bounded',cfg.maxPoolSize===8);check('config:timeouts',cfg.connectionTimeoutMs===4000&&cfg.statementTimeoutMs===9000);
for(const [name,patch,pattern] of [
 ['missing-password',{AGROWAY_POSTGRES_PASSWORD:undefined},/PRODUCTION_POSTGRES_ENV_REQUIRED:AGROWAY_POSTGRES_PASSWORD/],
 ['localhost',{AGROWAY_POSTGRES_HOST:'localhost'},/PRODUCTION_POSTGRES_LOCALHOST_FORBIDDEN/],
 ['short-password',{AGROWAY_POSTGRES_PASSWORD:'short'},/PRODUCTION_POSTGRES_PASSWORD_TOO_SHORT/],
 ['missing-ca',{AGROWAY_POSTGRES_CA_PEM:''},/PRODUCTION_POSTGRES_ENV_REQUIRED:AGROWAY_POSTGRES_CA_PEM/],
 ['bad-ca',{AGROWAY_POSTGRES_CA_PEM:'not-pem'},/PRODUCTION_POSTGRES_CA_PEM_REQUIRED/],
 ['servername-drift',{AGROWAY_POSTGRES_TLS_SERVERNAME:'evil.example.com'},/PRODUCTION_POSTGRES_TLS_SERVERNAME_HOST_MISMATCH/],
 ['oversized-pool',{AGROWAY_POSTGRES_POOL_MAX:'99'},/PRODUCTION_POSTGRES_ENV_RANGE:AGROWAY_POSTGRES_POOL_MAX/]
]){assert.throws(()=>resolveProductionPostgresConfig({...env,...patch}),pattern);check(`reject:${name}`,true)}
class Client{constructor(row){this.row=row;this.released=0;this.queries=[]}async query(sql){this.queries.push(sql);return{rows:[this.row],rowCount:1}}release(){this.released++}}
class Pool{constructor(row){this.client=new Client(row);this.connects=0}async connect(){this.connects++;return this.client}}
let captured;const pool=new Pool({database:'agroway',application_name:'agroway-control'});const wiring=createProductionPostgresWiring(env,{create(c){captured=c;return pool}});
check('wiring:configured-not-connected',wiring.state==='CONFIGURED_NOT_CONNECTED');check('wiring:redacted',wiring.redacted.password==='[REDACTED]'&&!JSON.stringify(wiring.redacted).includes(env.AGROWAY_POSTGRES_PASSWORD));check('wiring:factory-received-secret',captured.password===env.AGROWAY_POSTGRES_PASSWORD);assert.throws(()=>wiring.createCanonicalUnitOfWorkAfterConnectivityCertification(),/PRODUCTION_POSTGRES_CONNECTIVITY_CERTIFICATION_REQUIRED/);check('wiring:uow-before-probe-forbidden',true);
const evidence=await wiring.verifyConnectivity();check('probe:state',evidence.state==='CONNECTED_READ_ONLY_PROBE');check('probe:read-only',pool.client.queries.length===1&&pool.client.queries[0].startsWith('SELECT current_database()'));check('probe:no-write',!/(INSERT|UPDATE|DELETE|BEGIN|COMMIT)/i.test(pool.client.queries.join(' ')));check('probe:released',pool.client.released===1);check('probe:no-canonical-write',evidence.canonicalWriteExecuted===false);
const uow=wiring.createCanonicalUnitOfWorkAfterConnectivityCertification();check('wiring:uow-after-probe',typeof uow.transaction==='function');check('wiring:still-no-canonical-write',wiring.canonicalWriteExecuted===false);
const wrongDb=new Pool({database:'other',application_name:'agroway-control'});const wrongWiring=createProductionPostgresWiring(env,{create(){return wrongDb}});await assert.rejects(()=>wrongWiring.verifyConnectivity(),/PRODUCTION_POSTGRES_DATABASE_IDENTITY_MISMATCH/);assert.throws(()=>wrongWiring.createCanonicalUnitOfWorkAfterConnectivityCertification(),/PRODUCTION_POSTGRES_CONNECTIVITY_CERTIFICATION_REQUIRED/);check('probe:db-mismatch-fails-closed',true);
const wrongApp=new Pool({database:'agroway',application_name:'other'});const appWiring=createProductionPostgresWiring(env,{create(){return wrongApp}});await assert.rejects(()=>appWiring.verifyConnectivity(),/PRODUCTION_POSTGRES_APPLICATION_NAME_MISMATCH/);check('probe:application-mismatch-fails-closed',true);
console.log(`PASS_CONTROL_POSTGRES_PRODUCTION_WIRING_RUNTIME ${passed}/${passed}`);
