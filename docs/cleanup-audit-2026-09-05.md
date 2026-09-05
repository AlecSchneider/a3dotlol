# Web cleanup audit — 2026-09-05

Base: `origin/main` at `7a5e6879ab59a196b0bab4aac13aa4537f751baa`.
Candidate: the commit containing this report, on `audit/web-cleanup-20260905`.

## Changes and measurements

- Reuse precomputed property allowlists in the final PostHog event sanitizer.
  It previously rebuilt a Set even though the manual capture path already cached
  its allowlists. The measured fixture goes from one per-event Set to zero.
- Sanitize click ancestry once when producing both `$elements` and
  `$elements_chain`. For the same 20-link fixture, URL constructions fall from
  40 to 20. Both property orders preserve the sanitized output; query strings,
  fragments, arbitrary text, and unknown/prototype event names remain blocked.
- Replace the test-local copy of the Discord webhook validator with seven tests
  invoking the real Convex contact action: five invalid/missing configurations,
  successful delivery with mentions disabled and retention bookkeeping, and
  unsuccessful delivery without retention bookkeeping. All use an in-memory
  database and mocked fetch; no Discord message or production record is created.
- Runtime source: 13 added / 23 removed lines (net -10). Tests: 202 added /
  26 removed lines (net +176), separately from this report. No dependency,
  technology-stack, UI, schema, or consent-setting changes.

## Verification

Both baseline and candidate ran with Node 24.20.0 and npm 11.19.1:
`npm run check`, `npm run test:once`, `npm run format:check`, `npm run build`.
All passed. Baseline: 35 tests across 13 files. Candidate: 45 across 15 files.
New characterization tests were first run against the unchanged base, including
the one-Set/40-URL measurement, before changing runtime code.

Next.js 15.5.24 production-build route sizes remained unchanged at displayed
precision: home 133 kB first-load JS, contact/support 132 kB, cookies/privacy
107 kB, about/impressum 106 kB, stack 111 kB, shared JS 103 kB.
These are build-reported figures, not measured transfer size or LCP improvement.

Sequential fresh production servers used loopback port 4317. At build time,
Convex pointed to loopback port 4399 and the public PostHog token was empty.
Browser checks exercised email-purpose validation and both analytics-choice
buttons without contacting production services. The changed sanitizer was
exercised through the real SDK initialization callback with an SDK mock.

Matched screenshots cover home/signup validation and cookies at viewports
390×844 and 1280×900. Synthetic email: `cleanup-test@example.com`; neither email
purpose selected. Both mobile pairs are pixel-identical. Desktop differences
are confined to button focus/hover regions (home 6,559 pixels; cookies 2,584),
with unchanged dimensions, content, and layout. Images were visually inspected.
Eight PNGs are retained locally at `/tmp/a3-cleanup-audit-8NY7Pv`, named
`{base,candidate}-{home,cookies}-{mobile,desktop}.png`.

## Limits and follow-ups

- No live PostHog ingestion, deployed Convex mutation, or Discord delivery test;
  isolated contract tests do not prove production configuration or delivery.
- No claimed LCP, server-cost, or real-user latency improvement. The measured
  benefit is less synchronous work in each qualifying analytics callback.
- Keep the existing consent-gated SDK import and cached webhook validation;
  neither needs another abstraction. No measured lifecycle defect justified
  changing the Convex provider.
- Only about 2.7 GiB of disk headroom was available at setup. Restore headroom
  before parallel builds. A disposable seeded backend would enable broader
  successful-submit browser QA without touching production.
- No production merge or deployment is part of this cleanup. CI currently runs
  for PRs targeting staging (or manual dispatch), not ordinary branch pushes.
