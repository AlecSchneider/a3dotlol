# a3.lol

This is a small Next.js site with a Convex-backed, consented email-update form
on the homepage.

## Install and verify

Use Node 24.x and pnpm 10.34.5, pinned in `package.json`. pnpm automatically
selects Node 24.20.0 via `useNodeVersion` in `pnpm-workspace.yaml`; this does
not change the host's global Node installation. `.nvmrc` also records that
version for nvm users. With pnpm or
Corepack available, verify `pnpm --version` from this directory, then run:

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:once
pnpm run format:check
pnpm run build
pnpm exec playwright install chromium webkit
pnpm run test:e2e
```

The build requires `NEXT_PUBLIC_CONVEX_URL`; CI uses a non-production placeholder.
`pnpm-lock.yaml` is the only dependency lockfile. `pnpm-workspace.yaml` preserves
security overrides and reviewed dependency-script approvals; do not approve all
scripts or enable broad hoisting to work around install failures. Vite is a direct
development dependency because the Convex test setup references `vite/client`.
Backend deployment is separate from installing or building the website.

Browser tests cover desktop Chromium, mobile Chromium and WebKit. They build
and start their own local production server on port 4317 (override with
`E2E_PORT`), refuse to reuse another process, and stop their server on exit.
They use an inert Convex URL and synthetic analytics token; browser HTTP and
WebSocket transports are intercepted so no form data or analytics reaches a
provider. The suite covers redirect status/headers/query handling, navigation,
consent and withdrawal, signup validation, and contact error recovery.
Reports are in `playwright-report/`; failure traces are in `test-results/`.
The E2E build replaces local `.next` output: never deploy that test artifact;
release builds must be rebuilt with the authorized deployment configuration.
CI runs the same checks and browser matrix. Live backend delivery is not
validated by these local tests.

## Email signup setup

1. Create or select a Convex project.
2. Copy `.env.example` to `.env`.
3. Set `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` by running
   `pnpm run convex:dev`.
4. Start the app with `pnpm run dev`.

The homepage form calls the `newsletter.subscribe` and `newsletter.withdraw`
Convex mutations. New records use private `emailContacts`, `emailPreferences`,
and `emailConsentEvents` tables with normalized-address deduplication, separate
purpose state, consent history, rate limits, and 12-month retention cleanup.
There is no public subscriber-list query.

Signup collection is active, but email sending is not. New records remain
unverified until double opt-in, purpose-aware delivery, and unsubscribe
infrastructure is implemented and separately authorized. The older
`newsletterSignups` table is retained only for isolated legacy records.

The production backend belongs to Convex team `473998` (`alec-schneider`) and
runs in US East.
