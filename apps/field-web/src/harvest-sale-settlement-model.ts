export type CommerceCurrency='COP';
export interface CommerceContext {tenantId:string;farmId:string;plotId:string;cropCycleId:string;}
export interface LocalHarvestOutput {id:string;outputLotCode:string;quantityGrams:number;grade:'A'|'B'|'MIXED';operatorId:string;evidenceId:string;evidenceSha256?:string;context:CommerceContext;localOnly:true;canonicalHarvestMutated:false;}
export interface LocalSale {id:string;harvestOutputId:string;quantityGrams:number;pricePerKgMinor:number;totalMinor:number;currency:CommerceCurrency;buyerName:string;poReference:string;context:CommerceContext;localOnly:true;canonicalSaleMutated:false;}
export interface LocalSettlement {id:string;saleId:string;harvestOutputId:string;amountMinor:number;currency:CommerceCurrency;paymentReference:string;context:CommerceContext;localOnly:true;canonicalSettlementMutated:false;}
export const FIELD_HARVEST_COMMERCE_ROUTE='/field/harvest-commerce';
