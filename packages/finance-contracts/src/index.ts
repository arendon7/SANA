export type CurrencyCode='COP'|'USD'|'EUR';
export type Money=Readonly<{currency:CurrencyCode;amountMinor:number}>;
export type FinancialEntry=Readonly<{tenantId:string;entryId:string;cropCycleId?:string;kind:'INCOME'|'EXPENSE'|'COMMITMENT';money:Money;occurredAt:string;evidenceRef?:string}>;
