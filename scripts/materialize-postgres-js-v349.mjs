import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const VERSION='3.4.9';
const TAG='v3.4.9';
const COMMIT='e7dfa14519f363229ccc3ead7b1b2f2051937efb';
const UPSTREAM='https://github.com/porsager/postgres';
const DEFAULT_DEST='vendor/postgres-js-3.4.9';
const FILES=Object.freeze({
  'package.json':'c3b76a1a611bf014898c1c002981973bcae6a8cc',
  'UNLICENSE':'efb98088164f5786b17e83ed384971fc3c74f93c',
  'src/bytes.js':'fa48786744aa6f890700a3a83872700bc054a7f8',
  'src/connection.js':'1b1cccde43b4570d5d071d6ffaab2669b3c2065a',
  'src/errors.js':'0ff83c428bec774e11417b8e1f033dc3305c18cf',
  'src/index.js':'c7fba3dace20173f4cb13f3f138bb6d213b43683',
  'src/large.js':'f46329677cfba356d447ad163c9c1502d8d16370',
  'src/query.js':'0d44a15cd9e42beaf11d4be6ccde60223e09508a',
  'src/queue.js':'c4ef97164f057db99dce1b9af3401dbb1af37e31',
  'src/result.js':'3101428471a4fd7c4fb62de8c014bc2b15202e30',
  'src/subscribe.js':'4f8934cc8277fc58d2c37838cfb1afc315bc0744',
  'src/types.js':'7c7c2b93094a1bced2b9dc387edc5c403e2c5864'
});

const arg=(name, fallback)=>{
  const prefix=`--${name}=`;
  const found=process.argv.find(x=>x.startsWith(prefix));
  return found?found.slice(prefix.length):fallback;
};
const refresh=process.argv.includes('--refresh');
const destination=path.resolve(arg('dest',DEFAULT_DEST));

function gitBlobSha1(bytes){
  const header=Buffer.from(`blob ${bytes.byteLength}\0`);
  return createHash('sha1').update(header).update(bytes).digest('hex');
}

async function readVerified(file,expected){
  const bytes=await fs.readFile(file);
  const actual=gitBlobSha1(bytes);
  if(actual!==expected) throw new Error(`POSTGRES_JS_VENDOR_INTEGRITY_MISMATCH:${file}:${actual}:${expected}`);
  return bytes;
}

async function verifyExisting(){
  for(const [relative,expected] of Object.entries(FILES)) await readVerified(path.join(destination,relative),expected);
  const provenance=JSON.parse(await fs.readFile(path.join(destination,'PROVENANCE.json'),'utf8'));
  if(provenance.version!==VERSION||provenance.tag!==TAG||provenance.commit!==COMMIT||provenance.upstream!==UPSTREAM) throw new Error('POSTGRES_JS_VENDOR_PROVENANCE_MISMATCH');
  if(provenance.integrity!=='GIT_BLOB_SHA1'||provenance.dependencyCount!==0) throw new Error('POSTGRES_JS_VENDOR_PROVENANCE_INTEGRITY_MISMATCH');
  for(const [relative,expected] of Object.entries(FILES)) if(provenance.files?.[relative]!==expected) throw new Error(`POSTGRES_JS_VENDOR_PROVENANCE_FILE_MISMATCH:${relative}`);
  console.log(`PASS_POSTGRES_JS_VENDOR_VERIFY ${VERSION} ${COMMIT} ${Object.keys(FILES).length}/${Object.keys(FILES).length}`);
}

async function refreshFromUpstream(){
  await fs.rm(destination,{recursive:true,force:true});
  for(const [relative,expected] of Object.entries(FILES)){
    const url=`https://raw.githubusercontent.com/porsager/postgres/${COMMIT}/${relative}`;
    const response=await fetch(url,{redirect:'follow'});
    if(!response.ok) throw new Error(`POSTGRES_JS_VENDOR_FETCH_FAILED:${relative}:${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    const actual=gitBlobSha1(bytes);
    if(actual!==expected) throw new Error(`POSTGRES_JS_VENDOR_UPSTREAM_INTEGRITY_MISMATCH:${relative}:${actual}:${expected}`);
    const target=path.join(destination,relative);
    await fs.mkdir(path.dirname(target),{recursive:true});
    await fs.writeFile(target,bytes);
  }
  const provenance={
    component:'postgres.js',version:VERSION,tag:TAG,commit:COMMIT,upstream:UPSTREAM,license:'Unlicense',
    dependencyCount:0,integrity:'GIT_BLOB_SHA1',files:FILES
  };
  await fs.writeFile(path.join(destination,'PROVENANCE.json'),JSON.stringify(provenance,null,2)+'\n','utf8');
  await verifyExisting();
  console.log(`PASS_POSTGRES_JS_VENDOR_REFRESHED ${destination}`);
}

if(refresh) await refreshFromUpstream();
else await verifyExisting();
