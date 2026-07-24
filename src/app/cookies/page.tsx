import { AnalyticsPreferences } from "~/components/analytics-preferences";
import { LegalPage } from "~/components/legal-page";

export const metadata = {
  title: "Cookies & Storage | a3.lol",
  description: "Cookie and browser-storage information for a3.lol",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies & storage"
      intro={
        <p>
          a3.lol does not set its own cookies. One local-storage entry remembers
          your analytics choice.
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
          Vercel Web Analytics is loaded only after acceptance. Vercel describes
          the service as cookie-free and based on anonymized, aggregated data.
          Query strings and URL fragments are removed before an event is sent.
        </p>
        <AnalyticsPreferences />
      </section>

      <section>
        <h2>Change or withdraw your choice</h2>
        <p>
          You can change the setting below at any time. Disabling analytics
          prevents future analytics events from this browser; it does not alter
          anonymous aggregate reports already created.
        </p>
      </section>
    </LegalPage>
  );
}
