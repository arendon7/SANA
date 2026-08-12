declare module 'node:crypto' {
  interface Hash { update(data: string | Uint8Array): Hash; digest(encoding: 'hex'): string; }
  interface KeyObject {}
  interface PublicKeyInput { key: Readonly<Record<string, unknown>>; format: 'jwk'; }
  interface VerifyKeyInput { key: KeyObject; dsaEncoding?: 'der'|'ieee-p1363'; }
  export function createHash(algorithm: 'sha256'): Hash;
  export function createPublicKey(input: PublicKeyInput): KeyObject;
  export function verify(algorithm: string | null, data: Uint8Array, key: KeyObject | VerifyKeyInput, signature: Uint8Array): boolean;
}
