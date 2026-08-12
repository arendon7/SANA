import type {FinancialEntry} from '../../../packages/finance-contracts/src/index.js';
export const recordEntry=(e:FinancialEntry):FinancialEntry=>{if(!Number.isSafeInteger(e.money.amountMinor))throw new Error('INVALID_MINOR_UNITS');return e};
export const netMinor=(entries:readonly FinancialEntry[],currency:string)=>entries.filter(e=>e.money.currency===currency).reduce((a,e)=>a+(e.kind==='INCOME'?e.money.amountMinor:-e.money.amountMinor),0);
