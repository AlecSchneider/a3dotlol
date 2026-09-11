# Stable dependency upgrades — 2026-09-11

Scope: upgrade dependencies and prepare a PR from `staging` to `main`. This work
does not authorize a production merge or backend deployment. Baseline:
`11e7b2cf328459516a12218b2430b66e42f99ae5` (the completed pnpm migration).

## Version changes

| Package | Before | After |
| --- | --- | --- |
| Next.js / eslint-config-next | 15.5.24 | 16.3.5 |
| React / React DOM | 19.2.8 | 19.3.0 |
| @types/react | 19.2.18 | 19.3.0 |
| @types/react-dom | 19.2.5 | 19.3.0 |
| PostHog JS | 1.422.5 | 1.430.2 |
| Zod | 4.5.4 | 4.6.2 |
| @types/node | 24.13.3 | 24.13.4 |
| convex-test | 0.0.56 | 0.0.58 |
| PostCSS | 8.5.26 | 8.5.28 |
| TypeScript | 5.9.3 | 6.0.3 |
| typescript-eslint | 8.68.0 | 8.70.0 |
| Vite | 8.2.2 | 8.3.0 |
| Vitest | 4.1.11 | 5.0.0 |

Registry metadata was checked on the date above. Convex 1.45.0, its rate limiter
0.3.2, env-nextjs 0.13.11, Tailwind 4.3.3, Prettier 3.9.6, its Tailwind plugin
0.8.1, Edge Runtime VM 5.0.0 and the sharp override 0.35.4 were already current
stable releases. Transitive dependencies were refreshed within supported ranges.

CI actions are pinned to verified release SHAs: checkout 7.0.1, setup-node 7.0.0,
and pnpm/action-setup 6.1.0. The legacy `@eslint/eslintrc` direct dependency was
removed because Next.js now supplies native flat configuration.

## Explicit version holds

- **ESLint 9.39.5:** latest stable is 10.10.0, but the React 7.37.5, import
  2.32.0 and jsx-a11y 6.10.2 plugins used by Next's configuration declare support
  only through ESLint 9. ESLint 9 is deprecated upstream; migrate when the plugin
  ecosystem supports 10, rather than ignoring peers or dropping lint coverage.
- **TypeScript 6.0.3:** latest stable is 7.0.2. typescript-eslint 8.70.0 supports
  `>=4.8.4 <6.1.0`. The manifest uses `~6.0.3` to preserve that verified boundary.
- **Effect 4.0.0-rc.112:** retained exactly as required by repository policy.
  The registry's stable channel is 3.22.2; moving there is a downgrade, while
  rc.115 is not stable. This is an intentional existing prerelease exception.
- **Node types 24.13.4:** match the Node 24 runtime; newer major declarations do
  not imply the corresponding APIs exist in production.
- **Node 24.x / pnpm 10.34.5:** retain the just-verified production toolchain.
  pnpm's latest stable is 12.4.1, but Vercel's documented supported list currently
  goes through 10. This PR does not claim a pnpm 12 migration was tested or is
  impossible; it keeps the documented hosting path and reports the hold.

## Migrations and preserved boundaries

- Next.js 16 uses Turbopack for both development and production builds. The
  redundant development flag was removed. The official 16.3.5 async-request-API
  codemod inspected 41 files and changed none; no applicable synchronous request
  APIs required migration.
- Replace FlatCompat with Next's native flat core-web-vitals configuration while
  retaining typed recommended and stylistic lint rules.
- Remove TypeScript's deprecated `baseUrl`; existing relative path aliases still
  work. Explicit Node ambient types are declared in both application and Convex
  configurations. CI also checks the standalone Convex TypeScript configuration.
- Retain Next-generated `react-jsx`, development route types and its managed
  agent-instruction block. The stack page documents the new major versions.
- Vitest 5 clears mock histories by default. Three sanitizer tests exposed a
  cached analytics singleton whose initialization call history had been cleared.
  Reset modules before initialization instead of weakening assertions or turning
  the runner's isolation defaults off. All original contract assertions remain.
- Refresh explicit denied core-js script version and remove the obsolete Vitest
  4 picomatch override. No new blanket install-script approval was introduced.
- Convex functions, schema, Effect code, contact delivery, collection settings,
  analytics consent and personal-data filtering are unchanged.

## Verification

- Local lint/application type checks and separate Convex type check passed.
- All **83 tests across 19 files** passed on Vitest 5.
- Next.js 16.3.5 production build passed with Turbopack and 12 static routes.
- `pnpm audit` reported **0 known vulnerabilities** across 543 dependencies at
  review time; this is not a guarantee against unknown vulnerabilities.
- Chrome smoke checks passed for home, contact, cookies/preferences and stack;
  declining analytics dismissed the banner across navigation, and an empty
  contact submission was blocked by native required-field validation. No real
  backend submission was made. The owned test tab and local server were closed.
- A fresh `pnpm install --frozen-lockfile` passed using Node 24.21.0 and pnpm
  10.34.5, followed by lint, application/backend type checks, all 83 tests,
  formatting and the production build. Hosted CI/preview results are recorded
  in the PR so they can be tied to its exact head commit.

## Sources and follow-up

- [Next.js 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [TypeScript 6 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
- [Vitest migration guide](https://main.vitest.dev/guide/migration/)
- [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Vercel package-manager support](https://vercel.com/docs/package-managers)

Follow up on ESLint 10 plugin support and TypeScript 7 parser support. Reassess
the explicitly pinned Effect release channel separately. A reusable shared
`$upgrade-stable-dependencies` skill captures this compatibility-led workflow
without embedding this repository's provider IDs or version pins.
