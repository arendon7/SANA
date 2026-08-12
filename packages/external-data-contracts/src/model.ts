export type UUID = string;
export type ISODateTime = string;
export type ProviderKind = 'WEATHER' | 'IOT' | 'REMOTE_SENSING';
export type SourceStatus = 'ACTIVE' | 'DEGRADED' | 'DISABLED';
export type QualityLevel = 'GOOD' | 'DEGRADED' | 'REJECTED';
export type CalibrationStatus = 'VALID' | 'DUE_SOON' | 'EXPIRED' | 'NOT_APPLICABLE' | 'UNKNOWN';
export type IdentityConfidence = 'EXACT' | 'MAPPED' | 'HEURISTIC' | 'UNRESOLVED';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertState = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED';
export type MetricDimension = 'AIR_TEMPERATURE'|'RELATIVE_HUMIDITY'|'RAINFALL'|'WIND_SPEED'|'WIND_DIRECTION'|'SOLAR_RADIATION'|'SOIL_TEMPERATURE'|'SOIL_MOISTURE'|'LEAF_WETNESS'|'BATTERY_VOLTAGE'|'NDVI'|'EVI'|'NDRE'|'LAI';
export type CanonicalUnit = 'Cel' | '%' | 'mm' | 'm/s' | 'deg' | 'W/m2' | 'V' | '1';
export interface GeoPoint { lat:number; lon:number; }
export interface SourceRef { tenantId:UUID; providerId:UUID; sourceId:UUID; providerKind:ProviderKind; externalSourceKey:string; }
export interface DeviceIdentity { deviceId:UUID; externalDeviceKey:string; fieldId?:UUID; plotId?:UUID; location?:GeoPoint; confidence:IdentityConfidence; calibrationStatus:CalibrationStatus; }
export interface RawExternalEnvelope { ingestionId:UUID; source:SourceRef; providerEventId:string; receivedAt:ISODateTime; observedAt?:ISODateTime; externalDeviceKey?:string; contentType:string; payload:unknown; payloadSha256:string; }
export interface QualityReason { code:'MISSING_TIMESTAMP'|'INVALID_ASSESSMENT_TIME'|'FUTURE_TIMESTAMP'|'STALE'|'IDENTITY_UNRESOLVED'|'CALIBRATION_EXPIRED'|'OUT_OF_RANGE'|'NON_FINITE'|'UNIT_UNSUPPORTED'|'GEOMETRY_MISSING'|'PROVIDER_FLAGGED'; message:string; }
export interface QualityAssessment { level:QualityLevel; score:number; assessedAt:ISODateTime; reasons:readonly QualityReason[]; }
export interface CanonicalMeasurement { measurementId:UUID; tenantId:UUID; observationId:UUID; sourceId:UUID; deviceId?:UUID; fieldId?:UUID; plotId?:UUID; metric:MetricDimension; value:number; unit:CanonicalUnit; observedAt:ISODateTime; normalizedAt:ISODateTime; quality:QualityAssessment; lineage:{ingestionId:UUID;providerEventId:string;transformationVersion:string}; }
export interface CanonicalObservation { observationId:UUID; tenantId:UUID; sourceId:UUID; deviceId?:UUID; fieldId?:UUID; plotId?:UUID; observedAt:ISODateTime; measurements:readonly CanonicalMeasurement[]; quality:QualityAssessment; }
export interface CanonicalExternalFact { factId:string; tenantId:UUID; sourceId:UUID; fieldId?:UUID; plotId?:UUID; metric:MetricDimension; value:number; unit:CanonicalUnit; observedAt:ISODateTime; qualityLevel:Exclude<QualityLevel,'REJECTED'>; measurementId:UUID; }
export interface RemoteSensingScene { sceneId:UUID; tenantId:UUID; sourceId:UUID; providerSceneId:string; acquiredAt:ISODateTime; cloudCoverPct?:number; footprintGeoJson:unknown; fieldId?:UUID; plotId?:UUID; }
