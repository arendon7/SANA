import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const compiledArg=process.argv[2];if(!compiledArg)throw new Error('COMPILED_CONTROL_ROOT_REQUIRED');
const releaseVersion=process.argv[3]||'0.22.0-alpha21';
if(!/^0\.22\.0-(?:alpha\d+|initial-rc[1-9]\d*)$/.test(releaseVersion))throw new Error('CONTROL_PRODUCTION_HOST_RELEASE_VERSION_INVALID');
const root=process.cwd(),compiled=path.resolve(root,compiledArg),out=path.join(root,'dist','control-production-host');
if(!compiled.startsWith(root+path.sep))throw new Error('COMPILED_CONTROL_ROOT_OUTSIDE_REPOSITORY');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
const entries=[];const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
async function writeBody(body,to,logical){await fs.mkdir(path.dirname(to),{recursive:true});await fs.writeFile(to,body);entries.push({path:logical,bytes:body.length,sha256:digest(body)})}
async function copyFile(from,to,logical){await writeBody(await fs.readFile(from),to,logical)}
async function copyTree(sourceBase,targetBase,logicalBase){for(const item of await fs.readdir(sourceBase,{withFileTypes:true})){const source=path.join(sourceBase,item.name),target=path.join(targetBase,item.name),logical=path.posix.join(logicalBase,item.name);if(item.isDirectory())await copyTree(source,target,logical);else if(item.isFile()&&item.name.endsWith('.js'))await copyFile(source,target,logical)}}
for(const relative of ['services/identity-access/src','services/investment-portfolio/src','services/external-data-gateway/src','services/pilot-certifier/src'])await copyTree(path.join(compiled,relative),path.join(out,relative),relative);
await copyTree(path.join(root,'vendor','postgres-js-3.4.9'),path.join(out,'vendor','postgres-js-3.4.9'),'vendor/postgres-js-3.4.9');
await copyFile(path.join(root,'scripts','control-production-host.mjs'),path.join(out,'run.mjs'),'run.mjs');
const packageBody=Buffer.from(JSON.stringify({private:true,type:'module'},null,2)+'\n');await writeBody(packageBody,path.join(out,'package.json'),'package.json');
entries.sort((a,b)=>a.path.localeCompare(b.path));
const aggregateSha256=digest(Buffer.from(entries.map(x=>`${x.path}\0${x.sha256}\0${x.bytes}`).join('\n')));
const manifest={schemaVersion:1,artifact:'AGROWAY_CONTROL_PRODUCTION_HOST',version:releaseVersion,entrypoint:'run.mjs',runtime:'node>=22',moduleType:'ESM',networkSurface:'CLI_ONLY',browser:false,httpListener:false,d10Accepted:false,activationCommandAvailable:false,productionExecutionAvailable:false,containsProductionSecrets:false,fileCount:entries.length,aggregateSha256,files:entries};
await fs.writeFile(path.join(out,'HOST_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`PASS_CONTROL_PRODUCTION_HOST_BUILD version=${releaseVersion} files=${entries.length} aggregateSha256=${aggregateSha256}`);
