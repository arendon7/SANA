declare module 'node:crypto' {
  interface Digest { update(data:string):Digest; digest(encoding:'hex'):string; }
  interface PublicKeyObject {}
  export function createHash(algorithm:'sha256'):Digest;
  export function createPublicKey(key:string):PublicKeyObject;
  export function verify(algorithm:null,data:Uint8Array,key:PublicKeyObject,signature:Uint8Array):boolean;
}
