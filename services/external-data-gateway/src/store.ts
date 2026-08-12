import type { CanonicalExternalFact, CanonicalMeasurement, RawExternalEnvelope, RemoteSensingScene } from '@agroway/external-data-contracts';
export interface RawIngestionStore { reserve(envelope:RawExternalEnvelope):Promise<'ACCEPTED'|'DUPLICATE'>; quarantine(envelope:RawExternalEnvelope,reason:string):Promise<void>; markProcessed(envelope:RawExternalEnvelope):Promise<void>; }
export interface CanonicalStore { saveMeasurement(measurement:CanonicalMeasurement):Promise<void>; saveFact(fact:CanonicalExternalFact):Promise<void>; saveRemoteSensingScene(scene:RemoteSensingScene):Promise<void>; }
export interface EventPublisher { publish(eventName:string,aggregateId:string,tenantId:string,payload:Record<string,unknown>):Promise<void>; }
