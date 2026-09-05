# Project service and controller reference

These project-specific mappings supplement the global Service Access Registry.
Read this complete file for provider, monitoring, analytics, consent, deployment,
or controller work. Paths are relative to the repository root. Recorded status
is historical evidence, not a substitute for a live check.

## Vercel access

- Owning account: `alecschneider@me.com`; immutable Vercel user ID:
  `UpVSbMVfSAenFCuppH6jeasj`; expected CLI user: `alecschneider`.
- Before changing Vercel state, verify the exact user ID using the safe command
  in `/Users/clawdy/AGENTS.md`; stop on a mismatch and never use GitHub login
  for Vercel.
- Workspace/project: `alec-schneider/a3dotlol`.
- Linked directory: `/Users/clawdy/code/a3dotlol`.
- Link explicitly with
  `vercel link --yes --project a3dotlol --scope alec-schneider`.
- `.vercel` and `.env*` are ignored. Never expose the local OIDC token or
  Vercel environment values.


## Codex Discord controller

- Checkout: `/Users/clawdy/code/a3dotlol`
- Discord: `a3dotlol/#codex` in the `alec apps` server
- Discord channel ID: `1529403995167129641`
- Controller checkout: `/Users/clawdy/code/codex-discord`
- The controller database maps this channel to this checkout with auto-approve enabled.
- Common project commands: `npm run dev`, `npm run build`, `npm run check`, `npm run lint`, `npm run test:once`, `npm run typecheck`, and `npm run format:check`.
- The Next.js app is under `src/app`; the backend, schema, rate limits, and retention jobs are under `convex`.
- Convex project: `a3dotlol`; production deployment: `vivid-leopard-322`; team: `alec-schneider` (numeric ID `473998`, Pro); region: US East.
- PostHog uses EU Cloud shared project `229866`; every event from this repository must include `app_name: "a3dotlol"`.
- Contact-form delivery targets the private `a3dotlol/#contact` channel
  (`1530160745331949669`) in the `alec apps` server. The server-side Convex
  webhook must route only contact submissions there; never expose or document
  the webhook URL itself.
- Preserve the existing rule to update `src/app/stack/page.tsx` whenever the documented technology stack changes.
- Never print, commit, paste into Discord, or otherwise expose `.env` values, database URLs, Supabase credentials, deploy keys, tokens, or other secrets. Use configured local secret stores and ignored environment files.


## Google Search Console

- Google account: `alec@a3.lol`.
- Canonical property: domain property `a3.lol`
  (`sc-domain:a3.lol`).
- Ownership was auto-verified through the existing DNS provider record on
  2026-07-27. Preserve that verification record.
- Use the authenticated Chrome session for Search Console work and verify both
  the Google account and exact property selector before changing state.
- Production exposes `/sitemap.xml` and `/robots.txt`. The sitemap was submitted
  on 2026-07-27; its initial Search Console status was `Couldn't fetch` even
  though the live XML and robots responses returned HTTP 200, so allow Google
  time to retry before treating that first status as a production defect.
