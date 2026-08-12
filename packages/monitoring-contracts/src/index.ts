export type Observation=Readonly<{tenantId:string;observationId:string;cropCycleId:string;kind:'PEST'|'DISEASE'|'WATER'|'NUTRITION'|'GROWTH'|'OTHER';severity?:number;observedAt:string;notes?:string}>;
export type AgronomicAlert=Readonly<{tenantId:string;alertId:string;cropCycleId:string;severity:'INFO'|'WATCH'|'CRITICAL';code:string;raisedAt:string;state:'OPEN'|'ACKNOWLEDGED'|'CLOSED'}>;
