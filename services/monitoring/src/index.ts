import type {AgronomicAlert,Observation} from '../../../packages/monitoring-contracts/src/index.js';
export const recordObservation=(o:Observation)=>{if(!Number.isFinite(Date.parse(o.observedAt)))throw new Error('INVALID_OBSERVATION_DATE');return o};
export const raiseAlert=(a:AgronomicAlert)=>a;
