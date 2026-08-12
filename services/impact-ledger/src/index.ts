import type {CircularityEntry,ImpactMetric} from '../../../packages/impact-contracts/src/index.js';
export const recordImpact=(m:ImpactMetric)=>{if(!Number.isFinite(m.value))throw new Error('INVALID_IMPACT_VALUE');if(m.evidenceRefs.length===0)throw new Error('IMPACT_EVIDENCE_REQUIRED');return m};
export const recordCircularity=(e:CircularityEntry)=>{if(!(e.quantity>=0))throw new Error('INVALID_QUANTITY');return e};
