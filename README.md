# a3.lol

This is a small Next.js site with a Prisma and tRPC-backed newsletter signup
form on the homepage, using Supabase as the hosted Postgres database.

## Newsletter setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Set `DATABASE_URL` to the direct Postgres connection string for that same Supabase project.
5. Generate the Prisma client with `npm install`.
6. Create the table with `npm run db:push`.
7. Start the app with `npm run dev`.

The homepage form now submits to the local tRPC API, and Prisma writes into the
`newsletter_signups` table via the server-side database connection to Supabase
Postgres.
