export const V017_DOMAIN_EVENTS = [
  'ExternalProviderRegistered', 'ExternalSourceRegistered', 'ExternalSourceDisabled',
  'ExternalDeviceRegistered', 'ExternalDeviceIdentityResolved', 'ExternalIngestionReceived',
  'ExternalIngestionDeduplicated', 'ExternalPayloadQuarantined', 'ObservationNormalized',
  'MeasurementRecorded', 'MeasurementRejected', 'ObservationQualityAssessed',
  'SourceFreshnessDegraded', 'SourceFreshnessRestored', 'CalibrationExpired',
  'RemoteSensingSceneIngested', 'AgronomicAlertRaised', 'AgronomicAlertStateChanged',
] as const;
export type V017DomainEventName = typeof V017_DOMAIN_EVENTS[number];
export interface V017DomainEvent<T = Record<string, unknown>> { eventId:string; eventName:V017DomainEventName; occurredAt:string; tenantId:string; aggregateId:string; payload:T; schemaVersion:1; }
