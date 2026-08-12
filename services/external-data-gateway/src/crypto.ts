import { createHash } from 'node:crypto';
export function stableHash(input:string):string{return createHash('sha256').update(input).digest('hex');}
export function stableId(prefix:string,...parts:readonly string[]):string{return `${prefix}_${stableHash(JSON.stringify(parts)).slice(0,32)}`;}
