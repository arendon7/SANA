import type { AgronomySnapshot, ControlTowerSnapshot, DemandWindow, ImpactMetric, NetworkSnapshot, OperationsSnapshot, PortfolioProjectSummary, ProjectionWatermark, ReadinessGap, SupplySnapshot, TowerThresholds } from '@agroway/invest-control-contracts';
import { aggregateCapital } from '@agroway/investment-portfolio';
import { deriveExceptions } from './exceptions.js';
import { deriveReadinessGapExceptions } from './readiness-exceptions.js';
export interface ControlTowerProjectionInput {snapshotId:string;tenantId:string;asOf:string;network:NetworkSnapshot;projects:readonly PortfolioProjectSummary[];agronomy:AgronomySnapshot;operations:OperationsSnapshot;supply:SupplySnapshot;demand:readonly DemandWindow[];impact:readonly ImpactMetric[];watermarks:readonly ProjectionWatermark[];thresholds:TowerThresholds;readinessGaps?:readonly ReadinessGap[];}
export function projectControlTower(input:ControlTowerProjectionInput):ControlTowerSnapshot{
  assertProjectorWatermarks(input.watermarks);
  const existing=deriveExceptions(input.tenantId,input.projects,input.agronomy,input.operations,input.supply,input.demand,input.thresholds,input.asOf);
  const readiness=deriveReadinessGapExceptions(input.tenantId,input.readinessGaps??[],input.asOf);
  const exceptions=Object.freeze([...existing,...readiness].sort((a,b)=>a.fingerprint.localeCompare(b.fingerprint)));
  return {snapshotId:input.snapshotId,tenantId:input.tenantId,asOf:input.asOf,network:input.network,capital:aggregateCapital(input.projects),agronomy:input.agronomy,operations:input.operations,supply:input.supply,demand:input.demand,impact:input.impact,exceptions,watermarks:input.watermarks};
}
export function assertProjectorWatermarks(watermarks:readonly ProjectionWatermark[]):void {const seen=new Set<string>();for(const w of watermarks){if(!w.source||!w.offset) throw new Error('PROJECTOR_WATERMARK_REQUIRED');if(seen.has(w.source)) throw new Error('PROJECTOR_WATERMARK_DUPLICATE');seen.add(w.source);}}
