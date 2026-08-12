export type ManifestState='STAGED'|'VALIDATED'|'APPROVED'|'PUBLISHED';
export type Provenance='DECLARED'|'HUMAN_VERIFIED'|'AUTHENTICATED';
export type TechnicalStatus='NOT_REVIEWED'|'APPROVED'|'RESTRICTED'|'REJECTED';
export type ProductManifest=Readonly<{tenantId:string;manifestId:string;productId:string;state:ManifestState;identity:{brand:string;name:string;category:string};provenance:Provenance;declaredSkuIds:readonly string[];createdAt:string}>;
export type ProductVersion=Readonly<{tenantId:string;productVersionId:string;productId:string;version:number;identitySnapshot:Readonly<Record<string,string>>;technicalStatus:TechnicalStatus;publishedAt?:string}>;
export type SKU=Readonly<{tenantId:string;skuId:string;productVersionId:string;code:string;unit:string;active:boolean}>;
export type OrderReadiness='ORDERABLE'|'SKU_MISSING'|'TECHNICAL_REVIEW_REQUIRED'|'BLOCKED';
