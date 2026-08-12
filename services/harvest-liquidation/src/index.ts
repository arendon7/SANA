import type {HarvestLot,Settlement} from '../../../packages/harvest-contracts/src/index.js';
export const registerHarvest=(h:HarvestLot)=>{if(!(h.quantity>0))throw new Error('INVALID_HARVEST_QUANTITY');return h};
export const settle=(s:Settlement)=>{if(s.netMinor!==s.grossMinor-s.deductionsMinor)throw new Error('SETTLEMENT_MISMATCH');return s};
