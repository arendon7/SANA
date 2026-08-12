import type {KnowledgeAuthority} from './model.js';
export const KNOWLEDGE_PRIORITY:readonly KnowledgeAuthority[]=['CANONICAL','TECHNICAL','EXPERIMENTAL','HISTORICAL'];
export function authorityRank(a:KnowledgeAuthority):number{const i=KNOWLEDGE_PRIORITY.indexOf(a);if(i<0)throw new Error(`UNKNOWN_AUTHORITY:${a}`);return i;}
