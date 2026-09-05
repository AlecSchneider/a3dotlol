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
Commands: `npm run check`, `npm run lint`, `npm run test:once`,
`npm run typecheck`, `npm run format:check`, `npm run build`.
Update `src/app/stack/page.tsx` when the documented technology stack changes.
