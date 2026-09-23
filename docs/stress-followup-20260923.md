# Build/test follow-up — 2026-09-23

## Resolved

- Moved the ten existing shortcut redirects from Next.js configuration to a
  narrowly matched Next.js Proxy response. Next 16.3.5's local configuration
  redirect path discards accumulated headers; the explicit response now carries
  the shared security-header policy. Destinations, temporary 307 status,
  GET/HEAD/POST handling, case-insensitive matching, duplicate query values and
  fixed destination query precedence are preserved. No network I/O is added to
  the redirect handler; ordinary pages and assets do not enter it.
- Added 19 unit regressions and a Playwright suite running desktop Chromium,
  mobile Chromium and WebKit. Browser HTTP and WebSocket traffic to services is
  intercepted; tests use synthetic configuration and never submit to the live
  backend. Coverage includes all shortcuts, ordinary pages/404s, hydration and
  navigation, mobile overflow, consent/withdrawal, unchecked signup preferences,
  required-field validation and contact recovery from a simulated backend error.
- CI now runs the browser suite against its own production build. Existing
  Vitest discovery remains intact, with only the separate E2E directory excluded.
- Pinned automatic pnpm runtime selection to the verified Node 24.20.0 and added
  `.nvmrc`. This avoids silently running the project on the shared host's Node 26
  without changing the host's global runtime. Existing application dependency
  versions, overrides and build-script approvals are unchanged; Playwright
  1.63.0 is a new development-only dependency.
- Updated the stack page and contributor/agent instructions.

## Local verification

- Frozen pnpm 10.34.5 installation: passed.
- ESLint and frontend TypeScript: passed.
- Separate Convex TypeScript: passed.
- Vitest: **102 tests in 20 files passed**.
- Formatting: passed.
- Production build and Playwright: **48 checks passed** across three browser
  projects, using two workers and no retries (20.8 seconds including build).
- `git diff --check`: passed.
- `pnpm exec node --version` selected **v24.20.0** despite shell Node 26.7.0.

The verification host was the 32 GiB Mac18,5, macOS 27.0 (26A428), with Xcode
27.0 (27A266a) selected. Memory pressure remained normal and observed swap usage
stayed at 115.38 MiB. No other project's work was interrupted. No Apple targets
exist; native archives and simulator tests remain inapplicable, not blocked.

The primary checkout was safely fast-forwarded from `f3f1247` to existing main
`49096ae`. Its previous instruction refactor was preserved in local stash
`068b64422965901f370a0a1d20e46f6b32050345`, including the untracked service
reference. Main already includes that refactor with newer pnpm/Next guidance;
the stale copy was not reapplied over those improvements.

## Release and remaining boundaries

This follow-up does not authorize production deployment. The PR records the
tested commit and hosted CI results. No Convex code/schema, provider settings,
tracking collection, consent policy or credentials changed. Live provider
delivery and production-adapter behavior are not claimed as locally verified.

Playwright reports are generated in `playwright-report/` and failure traces in
`test-results/`, both ignored. Its `.next` output contains inert test service
configuration: rebuild with the authorized release configuration before any
deployment. The original stress-test report remains outside source control in
the retained task artifact directory.

References: [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy),
[Playwright managed servers](https://playwright.dev/docs/test-webserver).
