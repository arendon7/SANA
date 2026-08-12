import type {TraceabilityPassport} from '../../../packages/traceability-contracts/src/index.js';
export const issuePassport=(p:TraceabilityPassport)=>{if(!/^[0-9a-f]{64}$/.test(p.eventDigestSha256))throw new Error('INVALID_EVENT_DIGEST');if(p.harvestLotIds.length===0)throw new Error('HARVEST_REQUIRED');return p};
