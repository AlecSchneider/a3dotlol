# pnpm migration — 2026-09-11

Source baseline: `967153a4f0a89f9d468e03b6cdf03633bbdf74a4` (npm 11.19.1).
The single package root now pins pnpm 10.34.5 and retains Node 24.x.

## Resolution and install policy

- Imported the npm lockfile before removing it. All 518 unique registry
  package name/version and integrity pairs are preserved, including optional
  platform packages. No application dependency was upgraded.
- Normalized the `web-vitals-soft-navs` alias to its actual package identity
  (`web-vitals@6.0.0`) when comparing. Six npm `inBundle` entries are carried
  inside the unchanged Tailwind WASM tarball, not separate pnpm resolutions.
- Preserved the PostCSS and Sharp security overrides. A narrow
  `vitest@4.1.11>picomatch` override retains npm's nested 4.0.5 resolution;
  otherwise pnpm import would deduplicate it to the already-present 4.0.7.
- Added Vite 8.2.2 as an exact direct development dependency. It was already
  locked transitively, but pnpm correctly exposed the undeclared `vite/client`
  reference in `convex/test.setup.ts` during type checking.
- Reviewed dependency edges separately from package sets. pnpm explicitly
  links optional peers for ESLint tooling and Sharp using unchanged versions.
  The optional `@napi-rs/wasm-runtime@1.2.3` snapshot binds its runtime peer to
  the WASM resolver parent's 1.10.0, instead of npm's root 1.11.3. Both versions
  already existed and satisfy its peer range; native Mac/Linux release gates
  do not exercise this WASM fallback.
- Translated npm's five version-specific lifecycle decisions to pnpm 10's
  `allowBuilds`: esbuild and unrs-resolver allowed; core-js, fsevents and
  msgpackr-extract denied. Unlisted scripts remain blocked. No broad hoisting
  or blanket script approval was added.

## Verification and release boundary

A fresh dependency tree installed with `pnpm install --frozen-lockfile` under
Node 24.21.0. `pnpm run check` (lint and TypeScript), all 83 tests in 19 files,
format checking and the Next.js production build passed before deleting the
npm lockfile. CI now sets up the manifest-pinned pnpm before store-cache
discovery and uses frozen installs.

Maintained instructions and the public stack page were updated. Historical
audit reports retain their original npm commands as evidence. No Convex
deployment, production promotion, analytics or consent change is part of this
migration. Preview/CI evidence is recorded with the migration PR.

The mapped Vercel project was checked on 2026-09-11: root, install and build
overrides were unset, Node was 24.x and the production branch was `main`.
Verify the actual pnpm version in each new preview's install logs; a manifest
pin alone does not prove the remote builder used it.
