export const CONTROL_CANONICAL_WRITE_ADAPTER=Object.freeze({
  version:'0.22.0-alpha10',
  trust:'DEMO_RECONSTRUCTED',
  route:'/control/write-adapter',
  scope:'INVESTMENT_CAPITAL_REQUIREMENT',
  authorizationInput:'AUTHORIZED_FOR_ADAPTER',
  canonicalCommand:'DECLARE_CAPITAL_REQUIREMENT',
  canonicalEvent:'CapitalRequirementDeclared',
  transactionOrder:['LOAD_FOR_UPDATE','DOMAIN_RULE','SAVE_PROJECT','APPEND_OUTBOX','SAVE_IDEMPOTENCY_RECEIPT'] as const,
  idempotencyRequired:true,
  rollbackOnFailure:true,
  referenceTransactionPortValidated:true,
  postgresTransactionAdapterConnected:false,
  browserCanInvokeAdapter:false,
  productionExecutionAvailable:false,
  approvalAuthority:'HUMAN_ONLY',
  aiAuthority:'ADVISORY_ONLY',
  d10:'PENDING'
});
