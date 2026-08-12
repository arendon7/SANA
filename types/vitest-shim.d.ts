declare module 'vitest' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => unknown | Promise<unknown>) => void;
  export const test: typeof it;
  export const expect: (value: unknown) => any;
}
