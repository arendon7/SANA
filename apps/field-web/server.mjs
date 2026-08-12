import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DevRuntimeStore } from './dev-runtime.mjs';
import { materializeCanonicalFieldPublic } from './public-bundle.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(here,'public');
await materializeCanonicalFieldPublic();
const runtimeDir=process.env.AGROWAY_RUNTIME_DIR||path.join(here,'.runtime');
const store=await new DevRuntimeStore(runtimeDir).init();
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};

function json(res,status,value,extra={}){const body=Buffer.from(JSON.stringify(value));res.writeHead(status,{...headers,...extra,'content-type':'application/json; charset=utf-8','content-length':body.length});res.end(body);}
async function readJson(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw new Error('BODY_TOO_LARGE');chunks.push(chunk);}if(!chunks.length)return{};return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function errorStatus(code){return ['TENANT_SCOPE_MISMATCH','ACTOR_NOT_AUTHORIZED'].includes(code)?403:['INVITATION_PERMISSION_EXCEEDS_ROLE','SEAT_LIMIT_REACHED','IDEMPOTENCY_KEY_MISMATCH'].includes(code)?409:400;}

async function handleApi(req,res,url){
  if(req.method==='GET'&&url.pathname==='/api/dev/status')return json(res,200,store.status());
  if(req.method==='POST'&&url.pathname==='/api/dev/invitations'){const body=await readJson(req);const out=await store.createInvitation(body);return json(res,out.duplicate?200:201,out);}
  if(req.method==='POST'&&url.pathname==='/api/dev/exports'){const body=await readJson(req);const out=await store.createFullTenantExport(body);return json(res,out.duplicate?200:201,out);}
  const exportMatch=url.pathname.match(/^\/api\/dev\/exports\/([^/]+)$/);
  if(req.method==='GET'&&exportMatch){const request=store.exportById(decodeURIComponent(exportMatch[1]));return request?json(res,200,{request}):json(res,404,{error:'EXPORT_NOT_FOUND'});}
  const downloadMatch=url.pathname.match(/^\/api\/dev\/exports\/([^/]+)\/download$/);
  if(req.method==='GET'&&downloadMatch){const id=decodeURIComponent(downloadMatch[1]);const request=store.exportById(id);if(!request)return json(res,404,{error:'EXPORT_NOT_FOUND'});const bytes=await store.exportBytes(id);res.writeHead(200,{...headers,'content-type':'application/json; charset=utf-8','content-disposition':`attachment; filename="agroway-full-${id}.json"`,'x-agroway-sha256':request.digestSha256,'content-length':bytes.length});return res.end(bytes);}
  if(req.method==='POST'&&url.pathname==='/api/dev/sync/envelopes'){const body=await readJson(req);const out=await store.submitEnvelope({tenantId:body.tenantId,actorId:body.actorId,idempotencyKey:req.headers['idempotency-key']||body.idempotencyKey,envelope:body.envelope});return json(res,out.httpStatus,out);}
  if(req.method==='POST'&&url.pathname==='/api/dev/_test/reset'&&process.env.AGROWAY_DEV_ALLOW_RESET==='1'){await store.reset();return json(res,200,{ok:true});}
  return json(res,404,{error:'DEV_API_ROUTE_NOT_FOUND'});
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/',`http://${req.headers.host||'127.0.0.1'}`);
    if(url.pathname.startsWith('/api/dev/'))return await handleApi(req,res,url);
    if(!['GET','HEAD'].includes(req.method||''))return json(res,405,{error:'METHOD_NOT_ALLOWED'});
    const safe=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    let target=path.resolve(root,safe||'index.html');
    if(!target.startsWith(path.resolve(root)))throw new Error('PATH_REJECTED');
    try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');}catch{target=path.join(root,'index.html');}
    const body=await readFile(target);
    res.writeHead(200,{...headers,'content-type':types[path.extname(target)]||'application/octet-stream','content-length':body.length});
    if(req.method==='HEAD')return res.end();
    res.end(body);
  }catch(error){json(res,errorStatus(error.message),{error:error.message,trust:'LOCAL_DEV_BACKEND_NOT_PRODUCTION'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`AGROWAY FIELD + LOCAL_DEV_BACKEND http://127.0.0.1:${port}`));
