# a3.lol

This is a small Next.js site with a Convex-backed newsletter signup form on the
homepage.

## Newsletter setup

1. Create or select a Convex project.
2. Copy `.env.example` to `.env`.
3. Set `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` by running
   `npm run convex:dev`.
4. Start the app with `npm run dev`.

The homepage form calls the `newsletter.subscribe` Convex mutation. Newsletter
records are stored in the indexed `newsletterSignups` table.

The production backend belongs to Convex team `473998` (`alec-schneider`) and
runs in US East.
