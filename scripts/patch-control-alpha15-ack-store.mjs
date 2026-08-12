import fs from 'node:fs';
const path='services/external-data-gateway/src/control-external-ack-adapter.ts';
let source=fs.readFileSync(path,'utf8');
const replacements=[
[`      const result=await client.query<ExternalAckReceiptRow>(\`${'${RECEIPT_SELECT}'} WHERE tenant_id=$1::uuid AND packet_id=$2 LIMIT 1\`,[tenantId,packetId]);
      await client.query('COMMIT');begun=false;
      return result.rows[0]===undefined?undefined:hydrateReceipt(result.rows[0]);`,`      const result=await client.query<ExternalAckReceiptRow>(\`${'${RECEIPT_SELECT}'} WHERE tenant_id=$1::uuid AND packet_id=$2 LIMIT 1\`,[tenantId,packetId]);
      const hydrated=result.rows[0]===undefined?undefined:hydrateReceipt(result.rows[0]);
      await client.query('COMMIT');begun=false;
      return hydrated;`],
[`      if(inserted.rows[0]!==undefined){await client.query('COMMIT');begun=false;return {stored:true,receipt:hydrateReceipt(inserted.rows[0])};}`,`      if(inserted.rows[0]!==undefined){const hydrated=hydrateReceipt(inserted.rows[0]);await client.query('COMMIT');begun=false;return {stored:true,receipt:hydrated};}`],
[`      if(existing.rows[0]===undefined)throw new Error('EXTERNAL_ACK_RECEIPT_CONFLICT_WITHOUT_ROW');
      await client.query('COMMIT');begun=false;
      return {stored:false,existing:hydrateReceipt(existing.rows[0])};`,`      if(existing.rows[0]===undefined)throw new Error('EXTERNAL_ACK_RECEIPT_CONFLICT_WITHOUT_ROW');
      const hydratedExisting=hydrateReceipt(existing.rows[0]);
      await client.query('COMMIT');begun=false;
      return {stored:false,existing:hydratedExisting};`]
];
let changed=0;
for(const [before,after] of replacements){
  if(source.includes(after))continue;
  if(!source.includes(before))throw new Error('ALPHA15_ACK_STORE_EXPECTED_PATTERN_NOT_FOUND');
  source=source.replace(before,after);changed++;
}
fs.writeFileSync(path,source);
for(const marker of ['const hydrated=result.rows[0]===undefined?undefined:hydrateReceipt(result.rows[0]);','const hydrated=hydrateReceipt(inserted.rows[0]);','const hydratedExisting=hydrateReceipt(existing.rows[0]);'])if(!source.includes(marker))throw new Error(`ALPHA15_ACK_STORE_PATCH_MISSING:${marker}`);
console.log(`PASS_ALPHA15_ACK_STORE_PATCH ${3-changed}/3 already ${changed}/3 applied`);
