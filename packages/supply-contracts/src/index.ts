export type InventoryItem=Readonly<{tenantId:string;itemId:string;skuId?:string;name:string;unit:string;onHand:number;reserved:number}>;
export type ForecastHorizon=30|60|90;
export type DemandForecast=Readonly<{tenantId:string;forecastId:string;productId:string;skuId?:string;horizonDays:ForecastHorizon;pipeline:number;committed:number;ordered:number;projectedAt:string}>;
export type PurchaseOrderState='DRAFT'|'APPROVED'|'ORDERED'|'PARTIALLY_RECEIVED'|'RECEIVED'|'CANCELLED';
export type PurchaseOrder=Readonly<{tenantId:string;purchaseOrderId:string;currency:string;state:PurchaseOrderState;lines:readonly {skuId:string;quantity:number;unitPriceMinor:number}[]}>;
