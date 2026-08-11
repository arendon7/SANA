# AGROWAY real Vitest transition slice

This directory closes the runtime-testing gap while the reconstructed monorepo is progressively persisted as readable GitHub source.

The encoded archive contains the exact 12 observed `.spec.ts` files plus their transitive TypeScript source closure: **14 workspaces / 76 TypeScript files**. CI decodes it, verifies the SHA-256 from `SLICE_LOCK.json`, installs **Vitest 4.1.7**, and executes the real specs.

A PASS is therefore a **real Vitest runtime PASS for those 12 specs**. It is not a claim that the full 41-workspace monorepo is already stored in GitHub or that future tests are covered. `spec-compat` remains a diagnostic fallback and must not be described as Vitest.

The target end state is to remove this transition slice after the same specs execute directly from the fully persisted monorepo and canonical lockfile.
