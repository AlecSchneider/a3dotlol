# Effect adoption — contact workflows

Base: `0056ee685be6acab84d3ad5a45201a47f9400845` (`origin/main`).
This migration is prepared on `feature/effect-contact-20260905`; it is not a
production release.

## Version and ownership

Effect is pinned to `4.0.0-rc.112`, the npm `rc` resolved on 2026-09-05 and
confirmed against the [official release](https://github.com/Effect-TS/effect/releases/tag/effect%404.0.0-rc.112).
The upstream setup skill targets v4 RC; this is explicitly a prerelease, not
stable v3. Node 24.20.0, npm 11.19.1 and TypeScript 5.9.3 were used for checks.
No existing package versions changed. The optional msgpackr native extraction
install script is denied in `allowScripts`; this workflow does not use it.

`convex/lib/contactWorkflow.ts` owns normalized Schema validation, quota
sequencing, typed failures, Discord delivery and compensating deletion when
retention recording fails. The `DiscordContact` service supplies send/delete
policies through a request-local Layer backed by Effect's fetch HttpClient.
The retention action uses the same deletion service and continues processing
after recoverable failures, leaving failed records for the next scheduled run.

Convex still owns argument/return validators, transactions, indexes, rate-limit
storage and daily scheduling. React state, subscriptions, newsletter mutations,
PostHog's lazy SDK and consent lifecycle remain native. No new API server,
schema, table, exporter, reactive runtime or background task was added. Stream
and ManagedRuntime are unnecessary for this bounded, non-streaming workflow.

Effects execute only at the Convex action boundary. Known validation, quota and
non-2xx public messages are preserved. Other failures remain generic errors;
raw provider/Schema/database errors, submitted fields and credentials are not
retained in domain errors or logged. Tracing is disabled at the action boundary.
The cached native webhook validator remains in place.

## I/O and failure policy

- POST: eight seconds total through receipt-body consumption. A request scope
  owns the AbortController; success, rejection and timeout release it. Tests
  verify abort during stalled headers and a stalled body, not merely rejection.
- DELETE: eight seconds through response status. 2xx/404 count as removed;
  other statuses keep the retention record. URLs strip query parameters and
  encode the message ID; invalid Unicode becomes a sanitized typed failure.
- No automatic HTTP, notification, quota or persistence retries. The existing
  daily cron remains the retry owner for expired-message cleanup.
- Delivery is followed by retention recording. A recording rejection causes
  one best-effort deletion, preserving the original failure category even if
  cleanup fails. It does not guarantee rollback: an upstream write may have
  succeeded before a timeout or ambiguous database rejection.
- No inbound cancellation signal is supplied by this Convex action interface.
  The HTTP deadline does not cancel or impose a new deadline on Convex SDK
  calls. There is no claim of cancellation/rollback of accepted database writes.

## Verification and tradeoffs

Baseline: 45 tests. Characterization: 19 contact-action tests passed before
implementation replacement, covering existing normalization, limits, honeypot,
quota and receipt rules. Candidate: 66 tests, including service-layer failures,
compensation, scoped HTTP, timeout abort and actual in-memory retention actions.
The old standalone compensation helper/tests were replaced by workflow tests;
successful retention is covered through the real action and in-memory database.

Required gates: clean `npm ci`, `npm run check`, `npm run test:once`,
`npm run format:check`, and an isolated `npm run build`. Convex's
`codegen --typecheck enable` also bundled/analyzed the modules and regenerated
bindings successfully. Codegen uploads modules for analysis but does not activate
them; no production/dev deployment was activated by this migration.

Matched Next App Router build-manifest measurements use the unique union of
layout/route JS files, raw bytes and per-file gzip with Node zlib:

| Route | Initial raw bytes, before = after | Gzip bytes, before = after |
| --- | ---: | ---: |
| `/` | 457,527 | 134,751 |
| `/contact` | 453,981 | 133,760 |
| `/cookies` | 368,386 | 110,046 |

No browser Effect module or new lazy chunk is introduced, so there is no new
client first-interaction download. A matched esbuild browser-platform, minified
ESM bundle of `convex/contact.ts` grows from **44,404 to 368,993 bytes raw** and
**12,893 to 114,617 bytes gzip**. This is a reproducible bundle proxy, not the
provider's deployed byte count. The larger contact module also contains the
native retention functions; cold-start CPU/memory and live latency were not
measured. Adoption improves explicit failure/resource ownership, not proven
performance.

Local production-build browser checks used loopback Convex and disabled
analytics. Empty contact submission stays blocked by native required-field
validation. The required `/stack` Effect entry was inspected at mobile width;
candidate screenshots are retained in `/tmp/a3-effect-iRm8kM`. Contact markup
is unchanged; no new screenshot-parity claim is made. Successful browser writes
and live Discord delivery were not tested; success/failure backend contracts
use an in-memory Convex database and mocked HTTP instead.

Before release, test on an isolated Convex deployment and deploy the backend
and corresponding website through staging. A Vercel frontend preview alone
does not deploy this backend. Restore disk headroom (about 3.2 GiB at setup)
before parallel builds. Separately remediate the existing moderate
[`@humanfs/node` advisory](https://github.com/advisories/GHSA-p498-v437-472g)
and unsupported ESLint 9 warning; neither was introduced by Effect.
