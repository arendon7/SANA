export const FIELD_ACCESS_PORTABILITY_ROUTE='account' as const;
export const FIELD_ACCESS_PORTABILITY_TRUST='DEMO_RECONSTRUCTED_TENANT_GOVERNANCE' as const;
export type FieldAccessDecision='ALLOWED'|'ROLE_CEILING_DENIED'|'MEMBERSHIP_INACTIVE'|'NOT_GRANTED';
export type FieldEntitlementState='ENABLED_BY_PLAN'|'ENABLED_BY_ADDON'|'NOT_ENTITLED'|'SUBSCRIPTION_INACTIVE';
export type FieldExportBoundary='LOCAL_DEVICE_EXPORT'|'FULL_TENANT_EXPORT_REQUEST_ONLY';
export const FIELD_ACCESS_PORTABILITY_GUARDRAILS=Object.freeze({invitationSentWithoutServer:false,roleGrantCanExceedCeiling:false,visibleUiImpliesEntitlement:false,fullTenantExportReadyWithoutArtifactDigest:false,localExportClaimsServerCompleteness:false,tenantScopeRequired:true,humanAdminAuthorityRequired:true});
