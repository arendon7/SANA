import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));const publicDir=path.join(here,'public');const port=Number(process.env.PORT||4273);const host=process.env.HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cache-Control':'no-store'};
function safePath(urlPath){const clean=decodeURIComponent(urlPath.split('?')[0]);const candidate=path.normalize(path.join(publicDir,clean));return candidate.startsWith(publicDir)?candidate:null;}
const server=http.createServer(async(req,res)=>{try{let pathname=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`).pathname;if(pathname==='/'||pathname==='/control')pathname='/index.html';let file=safePath(pathname);if(!file)throw new Error('INVALID_PATH');const s=await stat(file).catch(()=>null);if(!s?.isFile()){file=path.join(publicDir,'index.html');}const bytes=await readFile(file);res.writeHead(200,{...headers,'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch(error){res.writeHead(404,{...headers,'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}});
server.listen(port,host,()=>console.log(`GREENATICS_CONTROL_REVIEW http://${host}:${port}/control`));
