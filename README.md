# a3.lol

This is a small Next.js site with a Convex-backed, consented email-update form
on the homepage.

## Email signup setup

1. Create or select a Convex project.
2. Copy `.env.example` to `.env`.
3. Set `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` by running
   `npm run convex:dev`.
4. Start the app with `npm run dev`.

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
