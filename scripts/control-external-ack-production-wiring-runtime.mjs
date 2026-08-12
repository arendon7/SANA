import { generateKeyPairSync } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const target=process.argv[2];if(!target)throw new Error('COMPILED_EXTERNAL_GATEWAY_INDEX_REQUIRED');
const mod=await import(pathToFileURL(target).href);
const {createProductionExternalAckWiring,resolveProductionExternalAckConfiguration,PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL,CONTROL_EXTERNAL_ACK_PROTOCOL,HttpsExternalAckTransport}=mod;
const {publicKey}=generateKeyPairSync('ed25519');
const publicKeyPem=publicKey.export({type:'spki',format:'pem'}).toString();
const key={keyId:'ack-key-2026-08',algorithm:'Ed25519',publicKeyPem};
const BASE={
  AGROWAY_EXTERNAL_ACK_PROVIDER_ID:'provider.alpha17',
  AGROWAY_EXTERNAL_ACK_ENDPOINT:'https://ack.example.test/v1/ack',
  AGROWAY_EXTERNAL_ACK_METADATA_URI:'https://ack.example.test/.well-known/agroway-ack-provider',
  AGROWAY_EXTERNAL_ACK_AUTH_MODE:'BEARER',
  AGROWAY_EXTERNAL_ACK_BEARER_TOKEN:'alpha17-runtime-bearer-credential-00000001',
  AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON:JSON.stringify([key]),
  AGROWAY_EXTERNAL_ACK_TIMEOUT_MS:'5000',
  AGROWAY_EXTERNAL_ACK_MAX_RESPONSE_BYTES:'65536',
  AGROWAY_EXTERNAL_ACK_MAX_ACK_AGE_MS:'300000',
  AGROWAY_EXTERNAL_ACK_CLOCK_SKEW_MS:'30000',
  AGROWAY_EXTERNAL_ACK_METADATA_TIMEOUT_MS:'1000',
  AGROWAY_EXTERNAL_ACK_METADATA_MAX_BYTES:'16384'
};
const checks=[];const check=(name,value,detail='')=>{checks.push({name,pass:!!value,detail});console.log(`${value?'PASS':'FAIL'} ${name}${detail?` :: ${detail}`:''}`)};
function expect(name,fn,code){try{fn();check(name,false,'NO_ERROR')}catch(e){check(name,e?.message===code,String(e?.message))}}
async function expectAsync(name,fn,code){try{await fn();check(name,false,'NO_ERROR')}catch(e){check(name,e?.message===code,String(e?.message))}}
const metadata=(overrides={})=>JSON.stringify({protocol:PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL,providerId:'provider.alpha17',ackProtocol:CONTROL_EXTERNAL_ACK_PROTOCOL,verificationKeyIds:['ack-key-2026-08'],status:'READY_FOR_ACK',...overrides});
const headers=(values={})=>({get:name=>values[name.toLowerCase()]??null});
const response=(body=metadata(),opts={})=>({ok:opts.ok??true,status:opts.status??200,headers:headers({'content-type':opts.contentType??'application/json',...(opts.length===undefined?{}:{'content-length':String(opts.length)})}),async text(){return body}});
const conf=resolveProductionExternalAckConfiguration(BASE);
check('config:version',conf.version==='AGROWAY_EXTERNAL_ACK_PRODUCTION_V1');
check('config:provider',conf.providerId==='provider.alpha17');
check('config:https',conf.endpoint.startsWith('https://')&&conf.metadataUri.startsWith('https://'));
check('config:key',conf.verificationKeys.length===1&&conf.verificationKeys[0].keyId==='ack-key-2026-08');
expect('reject:http-endpoint',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_ENDPOINT:'http://ack.example.test/v1/ack'}),'PRODUCTION_EXTERNAL_ACK_HTTPS_URL_INVALID:AGROWAY_EXTERNAL_ACK_ENDPOINT');
expect('reject:loopback',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_ENDPOINT:'https://127.0.0.1/v1/ack',AGROWAY_EXTERNAL_ACK_METADATA_URI:'https://127.0.0.1/meta'}),'PRODUCTION_EXTERNAL_ACK_LOOPBACK_FORBIDDEN:AGROWAY_EXTERNAL_ACK_ENDPOINT');
expect('reject:url-credentials',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_ENDPOINT:'https://u:p@ack.example.test/v1/ack'}),'PRODUCTION_EXTERNAL_ACK_HTTPS_URL_INVALID:AGROWAY_EXTERNAL_ACK_ENDPOINT');
expect('reject:url-query',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_ENDPOINT:'https://ack.example.test/v1/ack?token=x'}),'PRODUCTION_EXTERNAL_ACK_HTTPS_URL_INVALID:AGROWAY_EXTERNAL_ACK_ENDPOINT');
expect('reject:metadata-origin',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_METADATA_URI:'https://metadata.example.test/provider'}),'PRODUCTION_EXTERNAL_ACK_METADATA_ORIGIN_MISMATCH');
expect('reject:auth-mode',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_AUTH_MODE:'BASIC'}),'PRODUCTION_EXTERNAL_ACK_AUTH_MODE_INVALID');
expect('reject:bearer-missing',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_BEARER_TOKEN:undefined}),'PRODUCTION_EXTERNAL_ACK_BEARER_INVALID');
expect('reject:none-with-bearer',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_AUTH_MODE:'NONE'}),'PRODUCTION_EXTERNAL_ACK_BEARER_FORBIDDEN_FOR_NONE_AUTH');
expect('reject:duplicate-key',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON:JSON.stringify([key,key])}),'PRODUCTION_EXTERNAL_ACK_DUPLICATE_KEY_ID');
expect('reject:key-algorithm',()=>resolveProductionExternalAckConfiguration({...BASE,AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON:JSON.stringify([{...key,algorithm:'RSA'}])}),'PRODUCTION_EXTERNAL_ACK_KEY_ALGORITHM_INVALID:0');
let fetchCount=0;let seenInit;
const fetchOk=async(input,init)=>{fetchCount++;seenInit={input,init};return response()};
const wiring=createProductionExternalAckWiring(BASE,fetchOk,()=>1786564800000);
check('wiring:not-certified-before-preflight',wiring.connectivityCertified===false);
expect('wiring:transport-before-preflight',()=>wiring.createTransport(async()=>response()),'PRODUCTION_EXTERNAL_ACK_CONNECTIVITY_CERTIFICATION_REQUIRED');
check('diagnostics:no-bearer-value',!JSON.stringify(wiring.diagnostics).includes(BASE.AGROWAY_EXTERNAL_ACK_BEARER_TOKEN));
check('diagnostics:bearer-present-only',wiring.diagnostics.bearerCredentialConfigured===true&&wiring.diagnostics.credentialsStoredInDiagnostics===false);
const [e1,e2]=await Promise.all([wiring.verifyConnectivity(),wiring.verifyConnectivity()]);
check('metadata:coalesced',fetchCount===1,String(fetchCount));
check('metadata:get-read-only',seenInit.init.method==='GET'&&seenInit.init.redirect==='error'&&seenInit.init.credentials==='omit'&&seenInit.init.cache==='no-store');
check('metadata:bearer-injected',seenInit.init.headers.authorization===`Bearer ${BASE.AGROWAY_EXTERNAL_ACK_BEARER_TOKEN}`);
check('metadata:uri',seenInit.input===BASE.AGROWAY_EXTERNAL_ACK_METADATA_URI);
check('preflight:evidence',e1.state==='EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE'&&e1.providerId==='provider.alpha17'&&e1.realExternalAckObserved===false&&e1.executionState==='NOT_EXECUTED'&&e1.canonicalMutated===false);
check('preflight:idempotent-evidence',e1===e2&&wiring.connectivityCertified===true);
const transport=wiring.createTransport(async()=>{throw new Error('ACK_NETWORK_MUST_NOT_RUN_IN_ALPHA17_RUNTIME')});
check('wiring:transport-materialized',transport instanceof HttpsExternalAckTransport);
async function badMetadata(name,body,code,opts={}){const w=createProductionExternalAckWiring(BASE,async()=>response(body,opts));await expectAsync(name,()=>w.verifyConnectivity(),code)}
await badMetadata('reject:metadata-provider',metadata({providerId:'other.provider'}),'PRODUCTION_EXTERNAL_ACK_METADATA_PROVIDER_MISMATCH');
await badMetadata('reject:metadata-protocol',metadata({protocol:'OTHER'}),'PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL_MISMATCH');
await badMetadata('reject:ack-protocol',metadata({ackProtocol:'OTHER'}),'PRODUCTION_EXTERNAL_ACK_METADATA_ACK_PROTOCOL_MISMATCH');
await badMetadata('reject:key-set',metadata({verificationKeyIds:['other-key']}),'PRODUCTION_EXTERNAL_ACK_METADATA_KEY_SET_MISMATCH');
await badMetadata('reject:not-ready',metadata({status:'DOWN'}),'PRODUCTION_EXTERNAL_ACK_METADATA_NOT_READY');
await badMetadata('reject:unknown-field',JSON.stringify({protocol:PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL,providerId:'provider.alpha17',ackProtocol:CONTROL_EXTERNAL_ACK_PROTOCOL,verificationKeyIds:['ack-key-2026-08'],status:'READY_FOR_ACK',extra:true}),'PRODUCTION_EXTERNAL_ACK_METADATA_FIELDS_INVALID');
await badMetadata('reject:content-type',metadata(),'PRODUCTION_EXTERNAL_ACK_METADATA_CONTENT_TYPE_INVALID',{contentType:'text/plain'});
await badMetadata('reject:declared-too-large',metadata(),'PRODUCTION_EXTERNAL_ACK_METADATA_RESPONSE_TOO_LARGE',{length:20000});
const noneEnv={...BASE,AGROWAY_EXTERNAL_ACK_AUTH_MODE:'NONE',AGROWAY_EXTERNAL_ACK_BEARER_TOKEN:undefined};let noneHeaders;
const noneWiring=createProductionExternalAckWiring(noneEnv,async(_input,init)=>{noneHeaders=init.headers;return response()});
await noneWiring.verifyConnectivity();check('auth:none-no-authorization',noneHeaders.authorization===undefined);
const timeoutWiring=createProductionExternalAckWiring({...BASE,AGROWAY_EXTERNAL_ACK_METADATA_TIMEOUT_MS:'250'},async()=>new Promise(()=>{}));
await expectAsync('reject:metadata-timeout',()=>timeoutWiring.verifyConnectivity(),'PRODUCTION_EXTERNAL_ACK_METADATA_TIMEOUT');
check('authority:no-real-ack',wiring.diagnostics.browserInvocationAllowed===false&&e1.realExternalAckObserved===false&&e1.canonicalMutated===false);
const failed=checks.filter(x=>!x.pass);console.log(`${failed.length?'FAIL':'PASS'}_CONTROL_EXTERNAL_ACK_PRODUCTION_WIRING_RUNTIME ${checks.length-failed.length}/${checks.length}`);if(failed.length){console.error(JSON.stringify(failed,null,2));process.exit(1)}
