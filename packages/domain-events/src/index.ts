export type DomainEvent<T extends string = string, P = unknown> = Readonly<{eventId:string;tenantId:string;aggregateId:string;name:T;occurredAt:string;payload:P}>;
export const assertIsoDate=(value:string):void=>{if(!Number.isFinite(Date.parse(value))) throw new Error('INVALID_ISO_DATE')};
