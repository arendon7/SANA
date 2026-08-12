import type { ControlTowerSnapshot } from '@agroway/invest-control-contracts';
export interface ControlTowerSnapshotStore { save(snapshot:ControlTowerSnapshot):Promise<void>; latest(tenantId:string):Promise<ControlTowerSnapshot|undefined>; }
export interface ProjectionCheckpointStore { get(tenantId:string,projector:string):Promise<string|undefined>; advance(tenantId:string,projector:string,offset:string):Promise<void>; }
