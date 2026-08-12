import type { CanonicalUnit, GeoPoint, MetricDimension, ProviderKind, RawExternalEnvelope, SourceRef } from './model.js';
export interface ProviderPollCursor { cursor?:string; since?:string; }
export interface ProviderPollResult { envelopes:readonly RawExternalEnvelope[]; next?:ProviderPollCursor; }
export interface ProviderHealth { ok:boolean; checkedAt:string; latencyMs?:number; detail?:string; }
export interface ExternalDataProvider { readonly kind:ProviderKind; readonly providerKey:string; health():Promise<ProviderHealth>; poll(source:SourceRef,cursor:ProviderPollCursor):Promise<ProviderPollResult>; }
export interface ProviderMetricSample { externalDeviceKey?:string; observedAt:string; metric:MetricDimension; value:number; unit:CanonicalUnit; location?:GeoPoint; providerFlagged?:boolean; }
export interface ProviderNormalizer { readonly providerKey:string; samples(envelope:RawExternalEnvelope):readonly ProviderMetricSample[]; }
export interface PinealFieldMapping { externalField:string; metric:MetricDimension; sourceUnit:string; canonicalUnit:CanonicalUnit; scale?:number; offset?:number; }
