import type {DemandForecast,PurchaseOrder} from '../../../packages/supply-contracts/src/index.js';
import type {OrderReadiness,TechnicalStatus} from '../../../packages/product-contracts/src/index.js';
export const classifyReadiness=(skuId:string|undefined,technical:TechnicalStatus):OrderReadiness=>!skuId?'SKU_MISSING':technical==='NOT_REVIEWED'?'TECHNICAL_REVIEW_REQUIRED':technical==='APPROVED'?'ORDERABLE':'BLOCKED';
export const demandGap=(f:DemandForecast)=>Math.max(0,f.committed-(f.ordered));
export const approvePurchaseOrder=(po:PurchaseOrder):PurchaseOrder=>{if(po.state!=='DRAFT')throw new Error('PO_NOT_DRAFT');if(po.lines.length===0)throw new Error('PO_EMPTY');return {...po,state:'APPROVED'}};
export const cancelPurchaseOrder=(po:PurchaseOrder):PurchaseOrder=>{if(po.state==='RECEIVED')throw new Error('PO_RECEIVED');return {...po,state:'CANCELLED'}};
