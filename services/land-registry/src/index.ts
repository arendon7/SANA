import type {CropCycle,Farm,Plot,Producer} from '../../../packages/land-contracts/src/index.js';
export const registerProducer=(x:Producer)=>x; export const registerFarm=(x:Farm)=>x; export const registerPlot=(x:Plot)=>{if(!(x.areaHa>0)) throw new Error('INVALID_AREA'); return x};
export const startCropCycle=(cycle:CropCycle,at:string):CropCycle=>{if(cycle.state!=='PLANNED') throw new Error('INVALID_CYCLE_STATE');if(!Number.isFinite(Date.parse(at)))throw new Error('INVALID_DATE');return {...cycle,state:'ACTIVE',startedAt:at}};
