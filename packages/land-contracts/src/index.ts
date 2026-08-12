export type GeoJSONPolygon=Readonly<{type:'Polygon';coordinates:readonly (readonly (readonly [number,number])[])[]}>;
export type Producer=Readonly<{tenantId:string;producerId:string;name:string}>;
export type Farm=Readonly<{tenantId:string;farmId:string;producerId:string;name:string}>;
export type Plot=Readonly<{tenantId:string;plotId:string;farmId:string;name:string;areaHa:number;geometry?:GeoJSONPolygon}>;
export type CropCycleState='PLANNED'|'ACTIVE'|'PAUSED'|'HARVESTED'|'CLOSED';
export type CropCycle=Readonly<{tenantId:string;cropCycleId:string;plotId:string;crop:string;variety?:string;state:CropCycleState;startedAt?:string}>;
