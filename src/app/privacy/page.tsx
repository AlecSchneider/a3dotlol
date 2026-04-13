import Link from "next/link";

import { AnalyticsPreferences } from "~/components/analytics-preferences";

export const metadata = {
  title: "Privacy Policy | a3.lol",
  description: "Privacy information for a3.lol",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--page)] px-6 py-12 text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl">
        <Link
          className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          href="/"
        >
          ← Back
        </Link>

        <header className="mt-8">
          <p className="text-sm tracking-[0.3em] text-[var(--text-muted)] uppercase">
            Privacy Policy
          </p>
          <h1 className="mt-3 text-3xl tracking-tight">Privacy notice</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-subtle)]">
            This page explains how analytics and newsletter signups are handled
            on a3.lol. The setup is intentionally conservative: Vercel Web
            Analytics loads only after explicit consent and newsletter signups
            collect only the details needed to keep a contact list.
          </p>
        </header>

        <section className="mt-10 space-y-4 text-sm leading-7 text-[var(--text-subtle)]">
          <h2 className="text-base text-[var(--text-primary)]">
            1. Controller
          </h2>
          <p>
            Contact for privacy requests regarding this website:
            <br />
            Alec Schneider
            <br />
            <a
              className="text-[var(--text-primary)] underline decoration-white/30 underline-offset-4"
              href="mailto:alec@a3.lol"
            >
              alec@a3.lol
            </a>
          </p>
          <p>
            If you operate this site commercially, you should also add your full
            postal address and an imprint ({`Impressum`}) page before relying on
            this notice in production.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-7 text-[var(--text-subtle)]">
          <h2 className="text-base text-[var(--text-primary)]">2. Analytics</h2>
          <p>
            This site uses Vercel Web Analytics. According to Vercel&apos;s
            documentation, the service is cookie-free and works with anonymized,
            aggregated data. On this site, analytics are additionally blocked
            until you actively opt in.
          </p>
          <p>
            Before any analytics event is sent, query parameters and URL
            fragments are removed. That reduces the risk of transmitting tokens,
            IDs, or other personal data in URLs.
          </p>
          <p>
            If you consent, the processing is intended to measure basic reach
            and usage of the site.
          </p>
          <AnalyticsPreferences />
        </section>

        <section className="mt-10 space-y-4 text-sm leading-7 text-[var(--text-subtle)]">
          <h2 className="text-base text-[var(--text-primary)]">
            3. Newsletter signups
          </h2>
          <p>
            If you submit your email address through the newsletter form, the
            site stores that address in Supabase so future product updates can
            be sent directly by this site. The stored data includes your email
            address, submission timestamp, and form source.
          </p>
          <p>
            This information is collected only for maintaining the newsletter
            list and sending updates about products or projects associated with
            a3.lol. It is not sold, rented, or handed over to other parties for
            their own marketing or independent use.
          </p>
          <p>
            The legal basis for storing this information is your consent when
            you voluntarily submit the form. You can request deletion at any
            time using the contact address above.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-7 text-[var(--text-subtle)]">
          <h2 className="text-base text-[var(--text-primary)]">
            4. Recipient and transfer
          </h2>
          <p>
            Analytics data is processed via Vercel. Newsletter signup data is
            stored via Supabase as the hosting infrastructure for the database.
            Outside of those service providers acting on behalf of this site,
            newsletter data is not disclosed to third parties.
          </p>
          <p>
            Both providers publish GDPR and data processing information for
            customers. If you use either service in production, review their
            terms and complete any required data processing agreements in your
            accounts.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-7 text-[var(--text-subtle)]">
          <h2 className="text-base text-[var(--text-primary)]">
            5. Your rights
          </h2>
          <p>
            Under the GDPR, you may have rights to access, rectification,
            erasure, restriction, objection, and complaint to a supervisory
            authority. For requests about this site, use the contact address
            above.
          </p>
        </section>
      </div>
    </main>
  );
}
