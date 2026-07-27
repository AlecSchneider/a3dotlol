import { AnalyticsPreferences } from "~/components/analytics-preferences";
import { LegalPage } from "~/components/legal-page";
import { createPageMetadata } from "~/lib/seo";

export const metadata = createPageMetadata({
  title: "Cookies and Analytics Preferences",
  description:
    "Review and manage optional PostHog analytics preferences for a3.lol, including local storage, consent, and withdrawal details.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies & storage"
      intro={
        <p>
          a3.lol does not set analytics cookies. Browser storage remembers your
          choice and, after acceptance, holds anonymous PostHog analytics state.
        </p>
      }
      title="Your privacy choice"
    >
      <section>
        <h2>Strictly necessary storage</h2>
        <p>
          The browser key <code>analytics-consent</code> stores whether you
          accepted or declined optional analytics, the policy version, and the
          decision time. It expires after 180 days. Remembering this choice
          prevents the consent prompt from appearing on every page view.
        </p>
      </section>

      <section>
        <h2>Optional analytics</h2>
        <p>
          PostHog analytics is loaded only after acceptance and is configured to
          use local storage rather than cookies. Its local-storage entries hold
          a random anonymous identifier, session state, and event properties
          needed to count visits and interactions. Query strings, URL fragments,
          form contents, session recordings, and automatically captured clicks
          are not sent.
        </p>
        <AnalyticsPreferences />
      </section>

      <section>
        <h2>Change or withdraw your choice</h2>
        <p>
          You can change the setting below at any time. Disabling analytics
          immediately prevents future analytics events and disables PostHog
          persistence in this browser; it does not alter anonymous reports
          already created.
        </p>
      </section>
    </LegalPage>
  );
}
