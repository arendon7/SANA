import type {GatewayRequest,ModelPolicy,ProviderInput,ProviderOutput,GatewayResult} from './model.js';
export interface ProviderAdapter {readonly providerKey:string;generate(input:ProviderInput):Promise<ProviderOutput>;}
export interface ModelPolicyPort {getPolicy(tenantId:string,mode:GatewayRequest['mode']):Promise<ModelPolicy|null>;}
export interface GatewayAuditPort {requestAccepted(request:GatewayRequest,policy:ModelPolicy):Promise<void>;responseRecorded(request:GatewayRequest,result:GatewayResult):Promise<void>;}
export interface IdempotencyPort {get(tenantId:string,key:string):Promise<GatewayResult|null>;put(tenantId:string,key:string,result:GatewayResult):Promise<void>;}
