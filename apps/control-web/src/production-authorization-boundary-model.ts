import type {ProductionAuthorizationDecision} from '@agroway/identity-access';

export type ControlAuthorizationSurfaceState='REVIEW_ONLY'|'AUTHORIZED_FOR_ADAPTER'|'DENIED';
export const CONTROL_PRODUCTION_AUTHORIZATION_BOUNDARY=Object.freeze({
  version:'0.22.0-alpha9',
  trust:'DEMO_RECONSTRUCTED',
  route:'/control/authorization',
  environment:'PRODUCTION',
  surfaceState:'REVIEW_ONLY' as ControlAuthorizationSurfaceState,
  approvalAuthority:'HUMAN_ONLY',
  aiAuthority:'ADVISORY_ONLY',
  requiredSessionAssurance:'AAL2_MFA',
  requiredScopes:['TENANT','PROJECT','ACTOR','PERMISSION','PROPOSAL_DIGEST','AUTHORIZATION_CONTEXT_DIGEST','IDEMPOTENCY_KEY'] as const,
  adapterBoundary:'AUTHORIZED_FOR_ADAPTER',
  executionState:'NOT_EXECUTED',
  canonicalMutated:false,
  financialMutationAvailable:false,
  realIdentityProviderConnected:false,
  d10:'PENDING'
});

export function assertControlProductionAuthorizationDecision(decision:ProductionAuthorizationDecision):void{
  if(decision.state!=='AUTHORIZED_FOR_ADAPTER')throw new Error('CONTROL_AUTHORIZATION_STATE_INVALID');
  if(decision.approvalAuthority!=='HUMAN_ONLY')throw new Error('CONTROL_AUTHORIZATION_HUMAN_ONLY_REQUIRED');
  if(decision.aiAuthority!=='ADVISORY_ONLY')throw new Error('CONTROL_AUTHORIZATION_AI_ADVISORY_ONLY_REQUIRED');
  if(decision.executionState!=='NOT_EXECUTED'||decision.canonicalMutated!==false||decision.financialMutationAvailable!==false)throw new Error('CONTROL_AUTHORIZATION_EXECUTION_BOUNDARY_BREACH');
}
