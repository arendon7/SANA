import type {FieldExecution,FieldTask} from '../../../packages/field-contracts/src/index.js';
export const startTask=(t:FieldTask):FieldTask=>{if(t.state!=='PLANNED')throw new Error('TASK_NOT_PLANNED');return {...t,state:'IN_PROGRESS'}};
export const completeTask=(t:FieldTask,e:FieldExecution):FieldTask=>{if(e.taskId!==t.taskId||t.state!=='IN_PROGRESS')throw new Error('TASK_EXECUTION_SCOPE');return {...t,state:'DONE'}};
