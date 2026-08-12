export type AgronomicPlan=Readonly<{tenantId:string;planId:string;cropCycleId:string;version:number;state:'DRAFT'|'APPROVED'|'SUPERSEDED';activities:readonly PlannedActivity[]}>;
export type PlannedActivity=Readonly<{activityId:string;kind:'IRRIGATION'|'NUTRITION'|'PHYTOSANITARY'|'CULTURAL'|'SAMPLING'|'OTHER';dueAt:string;instructions:string}>;
