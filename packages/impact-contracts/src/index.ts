export type ImpactMetric=Readonly<{tenantId:string;metricId:string;scopeRef:string;code:string;value:number;unit:string;measuredAt:string;methodRef:string;evidenceRefs:readonly string[]}>;
export type CircularityEntry=Readonly<{tenantId:string;entryId:string;material:string;direction:'INPUT'|'RECOVERED'|'OUTPUT';quantity:number;unit:string;occurredAt:string}>;
