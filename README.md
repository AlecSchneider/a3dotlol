# a3.lol

This is a small Next.js site with a Supabase-backed newsletter signup form on
the homepage.

## Newsletter setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/20260413_create_newsletter_signups.sql`.
3. Copy `.env.example` to `.env`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Start the app with `npm run dev`.

The homepage form writes directly to Supabase REST using the publishable key.
Anonymous insert access is limited by the row-level security policy in the SQL
migration.
