import type {ManifestState,ProductManifest,ProductVersion,SKU} from '../../../packages/product-contracts/src/index.js';
const allowed:Record<ManifestState,readonly ManifestState[]>={STAGED:['VALIDATED'],VALIDATED:['STAGED','APPROVED'],APPROVED:['PUBLISHED'],PUBLISHED:[]};
export const transitionManifest=(m:ProductManifest,to:ManifestState):ProductManifest=>{if(!allowed[m.state].includes(to))throw new Error('INVALID_MANIFEST_TRANSITION');return {...m,state:to}};
export const publishVersion=(v:ProductVersion,at:string):ProductVersion=>{if(v.technicalStatus==='REJECTED')throw new Error('TECHNICAL_REJECTED');return {...v,publishedAt:at}};
export const publishSku=(sku:SKU):SKU=>({...sku});
export const assertSkuOmissionExplicit=(previous:readonly SKU[],next:readonly SKU[]):void=>{const ids=new Set(next.map(x=>x.skuId));for(const old of previous)if(!ids.has(old.skuId)&&old.active)throw new Error('SKU_OMISSION_MUST_DEACTIVATE')};
