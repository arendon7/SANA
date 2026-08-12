export type HarvestLot=Readonly<{tenantId:string;harvestLotId:string;cropCycleId:string;quantity:number;unit:string;harvestedAt:string;qualityGrade?:string}>;
export type Settlement=Readonly<{tenantId:string;settlementId:string;harvestLotId:string;currency:string;grossMinor:number;deductionsMinor:number;netMinor:number;settledAt:string}>;
