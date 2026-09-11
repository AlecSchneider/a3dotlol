# a3.lol instructions

Never print environment values, credentials or private data; diagnostics may be
visible on the live stream.

## Effect

- The contact action workflow uses Effect `4.0.0-rc.112`, pinned exactly.
- Before writing Effect code, read `node_modules/effect/AGENTS.md` completely,
  follow its relevant examples, and look up APIs in `node_modules/effect/src`.
  Do not use v3 examples for this v4 RC or change release channels implicitly.
- Keep Effect server-side in `convex/lib/contactWorkflow.ts`. Convex owns
  validators, transactions, scheduling and subscriptions; React and PostHog own
  UI and consent lifecycles. Run effects only at the Convex action boundary.
- Never log Schema/HTTP errors, request contents, webhook URLs, or span
  attributes containing personal data. Preserve the no-retry notification policy.

## Task routing and verification

Before changing Next.js code, read the relevant version-matched documentation
in `node_modules/next/dist/docs/`. Next.js 16 uses Turbopack for dev and build;
lint remains a separate required gate.

Follow `/Users/clawdy/AGENTS.md` and its task-selected policies. Read the
applicable references below completely before using or changing those surfaces.
Paths inside the references are relative to this repository root unless stated
otherwise. Historical build/status observations require fresh verification.

For documentation/instruction-only edits, check links, preserved policy/mapping
invariants and `git diff --check`; no app build or deployment is required.
For behavior changes, run focused contract tests and the relevant commands below.
Run the full applicable release gates before an authorized deployment/upload.
Do not widen a review into implementation or repeat passing gates without cause.

- Services, analytics/consent, monitoring, deployment and controller work:
  [project service reference](docs/agent-services.md).

Layout: `src/app` (Next.js), `convex` (backend).
Use Node 24.x and the exact pnpm version in `package.json` (10.34.5).
Install with `pnpm install --frozen-lockfile`; `pnpm-lock.yaml` is authoritative.
Preserve the overrides and explicit dependency-script policy in `pnpm-workspace.yaml`.
Commands: `pnpm run check`, `pnpm run lint`, `pnpm run test:once`,
`pnpm run typecheck`, `pnpm run format:check`, `pnpm run build`.
Update `src/app/stack/page.tsx` when the documented technology stack changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
