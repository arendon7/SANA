declare module 'node:crypto' {
  interface Digest { update(data: string): Digest; digest(encoding: 'hex'): string; }
  export function createHash(algorithm: 'sha256'): Digest;
}
