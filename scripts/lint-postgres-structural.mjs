#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dir=path.resolve('infra/postgres/migrations');const failures=[];let checks=0;const check=(ok,msg)=>{checks++;if(!ok)failures.push(msg);};
check(fs.existsSync(dir),'missing migrations directory');const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith('.sql')).sort():[];check(files.length>0,'no SQL migrations');
let previous=-1;const seenNames=new Set();
for(const file of files){check(/^\d{4}_[a-z0-9_]+\.sql$/.test(file),`invalid migration filename ${file}`);const prefix=Number(file.slice(0,4));check(Number.isInteger(prefix),`invalid migration prefix ${file}`);check(prefix>=previous,`migration order regression ${file}`);previous=prefix;check(!seenNames.has(file),`duplicate migration filename ${file}`);seenNames.add(file);const sql=fs.readFileSync(path.join(dir,file),'utf8');check(sql.trim().length>0,`empty migration ${file}`);check(sql.includes(';'),`migration without SQL terminator ${file}`);check(!sql.includes('\0'),`NUL byte in ${file}`);check(!/(?:CREATE|ALTER)\s+ROLE[^;]*\bBYPASSRLS\b/i.test(sql),`BYPASSRLS forbidden ${file}`);check(!/\bDROP\s+DATABASE\b/i.test(sql),`DROP DATABASE forbidden ${file}`);check(!/^(?:<{7}|={7}|>{7})/m.test(sql),`merge conflict marker ${file}`);}
for(const required of ['0001_extensions.sql','0021_tenant_integrity_hardening.sql','0023_access_entitlements_portability.sql','0024_sync_ingress_ack.sql','0025_control_write_receipt.sql','0026_control_external_ack_receipt.sql'])check(files.includes(required),`required migration missing ${required}`);
if(failures.length){console.error(JSON.stringify({status:'FAIL_POSTGRES_STRUCTURAL',checks,migrations:files.length,failures},null,2));process.exit(1);}console.log(JSON.stringify({status:'PASS_POSTGRES_STRUCTURAL',checks,migrations:files.length,bypassRlsForbidden:true,dropDatabaseForbidden:true},null,2));
