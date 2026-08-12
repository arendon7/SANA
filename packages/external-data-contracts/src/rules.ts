import type { AlertSeverity, CanonicalExternalFact, MetricDimension, UUID } from './model.js';
export type Comparator='LT'|'LTE'|'GT'|'GTE'|'BETWEEN'|'OUTSIDE';
export interface ThresholdRuleCondition { type:'THRESHOLD'; metric:MetricDimension; comparator:Comparator; a:number; b?:number; minimumConsecutiveBreaches?:number; }
export interface FreshnessRuleCondition { type:'FRESHNESS'; metric:MetricDimension; maxAgeMinutes:number; }
export type AgronomicRuleCondition=ThresholdRuleCondition|FreshnessRuleCondition;
export interface AgronomicRule { ruleId:UUID; tenantId:UUID; version:number; name:string; fieldId?:UUID; plotId?:UUID; severity:AlertSeverity; enabled:boolean; condition:AgronomicRuleCondition; }
export interface RuleEvaluationInput { rule:AgronomicRule; facts:readonly CanonicalExternalFact[]; now:string; }
export interface RuleEvaluationResult { matched:boolean; ruleId:UUID; ruleVersion:number; factIds:readonly string[]; reason:string; fingerprint?:string; }
