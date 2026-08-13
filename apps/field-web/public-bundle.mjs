import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'../..');
const bundleRoot=path.join(repoRoot,'ci/field-http-playwright');
const lockPath=path.join(bundleRoot,'BUNDLE_LOCK.json');
const chunkNames=['public.part00.b64','public.part01.b64','public.part02.b64','public.part03.b64'];

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function tarString(buffer,start,length){return buffer.subarray(start,start+length).toString('utf8').replace(/\0.*$/s,'').trim();}
function tarSize(buffer,start,length){const raw=tarString(buffer,start,length).replace(/\s/g,'');if(!raw)return 0;const value=Number.parseInt(raw,8);if(!Number.isSafeInteger(value)||value<0)throw new Error('FIELD_PUBLIC_TAR_SIZE_INVALID');return value;}
function parseTarFiles(tar){
  const files=new Map();
  for(let offset=0;offset+512<=tar.length;){
    const header=tar.subarray(offset,offset+512);offset+=512;
    if(header.every(byte=>byte===0))break;
    const name=tarString(header,0,100);const prefix=tarString(header,345,155);const rel=prefix?`${prefix}/${name}`:name;
    const size=tarSize(header,124,12);const type=String.fromCharCode(header[156]||48);
    const data=tar.subarray(offset,offset+size);offset+=Math.ceil(size/512)*512;
    if(type==='0'||type==='\0')files.set(rel,Buffer.from(data));
  }
  return files;
}

export async function materializeCanonicalFieldPublic(){
  const lock=JSON.parse(await readFile(lockPath,'utf8'));
  if(lock.archiveEncoding!=='base64')throw new Error('FIELD_PUBLIC_ARCHIVE_ENCODING_UNSUPPORTED');
  if(lock.productionEquivalent!==false||lock.serverTrust!=='LOCAL_DEV_BACKEND_NOT_PRODUCTION')throw new Error('FIELD_PUBLIC_TRUST_LOCK_INVALID');
  const chunks=await Promise.all(chunkNames.map(name=>readFile(path.join(bundleRoot,name),'utf8')));
  const archive=Buffer.from(chunks.join('').replace(/\s+/g,''),'base64');
  const digest=sha256(archive);
  if(digest!==lock.archiveDecodedSha256)throw new Error('FIELD_PUBLIC_ARCHIVE_SHA256_MISMATCH');
  const files=parseTarFiles(gunzipSync(archive));
  const expected=[...lock.archiveFiles].sort();
  const actual=[...files.keys()].filter(name=>name.startsWith('public/')).sort();
  if(actual.length!==lock.expectedFileCount||JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('FIELD_PUBLIC_ARCHIVE_INVENTORY_MISMATCH');
  const publicRoot=path.resolve(here,'public');
  await rm(publicRoot,{recursive:true,force:true});await mkdir(publicRoot,{recursive:true});
  for(const rel of expected){
    const target=path.resolve(publicRoot,rel.replace(/^public\//,''));
    if(!(target===publicRoot||target.startsWith(publicRoot+path.sep)))throw new Error('FIELD_PUBLIC_ARCHIVE_PATH_REJECTED');
    const bytes=files.get(rel);if(!bytes)throw new Error(`FIELD_PUBLIC_ARCHIVE_FILE_MISSING:${rel}`);
    await writeFile(target,bytes);
  }
  return Object.freeze({status:'MATERIALIZED_CANONICAL_FIELD_PUBLIC',archiveSha256:digest,fileCount:expected.length,trust:lock.serverTrust,productionEquivalent:false});
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await materializeCanonicalFieldPublic(),null,2));
