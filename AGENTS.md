We're live streaming vibe coding with you, NEVER print any .env variables or anything else which might be compromisable in clear text.

Always check your code before stopping your task, for e.g. running something like next lint or creating a new build.

If the tech stack changes, keep /stack updated!

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
- Common project commands: `npm run dev`, `npm run build`, `npm run check`, `npm run lint`, `npm run typecheck`, and `npm run format:check`.
- The Next.js app is under `src/app`, server code is under `src/server`, the Prisma schema is under `prisma`, and Supabase migrations are under `supabase/migrations`.
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
