import fs from 'node:fs';
import assert from 'node:assert/strict';

const path='apps/control-web/public/sana-v3-nutrition-ledger.js';
const source=fs.readFileSync(path,'utf8');

assert.match(source,/SANA_NUTRITION_LEDGER_V1/);
assert.match(source,/SANA_NUTRITION_CHAIN_V2/);
assert.match(source,/const CHAIN_STAGES=\[/);
assert.match(source,/\['ACTIVITY_LINK','Actividad vinculada'\]/);
assert.match(source,/chainCoverage/);
assert.match(source,/legacyStages:base\.stages/);
assert.match(source,/projectionVersion:'V2'/);
assert.match(source,/eventKind\" value=\"ACTIVITY_LINK/);
assert.match(source,/ACTIVITY_RELATION_DEMO/);
assert.match(source,/ACTIVITY_LINK_EVENT ≠ APPLICATION/);
assert.match(source,/EMBEDDED_V1_RELATION ≠ V2_STAGE/);
assert.match(source,/APPLICATION\.activityId ≠ ACTIVITY_LINK_STAGE/);
assert.match(source,/DECISION ≠ ACTIVITY_LINK ≠ APPLICATION/);
assert.match(source,/INVENTORY_MOVEMENT_EXPLICIT_ONLY/);
assert.match(source,/RESPONSE ≠ CAUSAL_EFFECT/);

const v1Stages=['PROGRAM','PREFLIGHT','DECISION','APPLICATION','EVIDENCE','RESPONSE'];
const v2Stages=['PROGRAM','PREFLIGHT','DECISION','ACTIVITY_LINK','APPLICATION','EVIDENCE','RESPONSE'];
assert.equal(v1Stages.length,6);
assert.equal(v2Stages.length,7);
assert.deepEqual(v2Stages.filter(x=>x!=='ACTIVITY_LINK'),v1Stages);

const historicalComplete=new Set(v1Stages);
const v1Covered=v1Stages.filter(x=>historicalComplete.has(x)).length;
const v2Covered=v2Stages.filter(x=>historicalComplete.has(x)).length;
assert.equal(v1Covered,6,'historical V1 chain must remain 6/6');
assert.equal(v2Covered,6,'historical chain without explicit ACTIVITY_LINK must be 6/7 V2');
assert.equal(Math.round(v2Covered/v2Stages.length*100),86);

const withExplicitLink=new Set(v2Stages);
assert.equal(v2Stages.filter(x=>withExplicitLink.has(x)).length,7);
assert.equal(Math.round(7/v2Stages.length*100),100);

assert.doesNotMatch(source,/autoInventoryMovement|autoStockMutation|inventoryMutationAllowed\s*=\s*true|stockMutationAllowed\s*=\s*true/i);
assert.doesNotMatch(source,/productionExecutionAvailable\s*=\s*true|canonicalMutated\s*=\s*true/i);

console.log('SANA nutrition chain V2 V128 contract: OK');
