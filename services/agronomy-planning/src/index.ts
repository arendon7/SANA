import type {AgronomicPlan} from '../../../packages/agronomy-contracts/src/index.js';
export const approvePlan=(p:AgronomicPlan):AgronomicPlan=>{if(p.state!=='DRAFT')throw new Error('PLAN_NOT_DRAFT');if(p.activities.length===0)throw new Error('PLAN_EMPTY');return {...p,state:'APPROVED'}};
