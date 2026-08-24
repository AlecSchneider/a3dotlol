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
          needed to count visits and interactions. After consent, PostHog also
          receives privacy-filtered clicks, page exits and scroll depth,
          rage/dead clicks, heatmap coordinates, Core Web Vitals, sanitized
          unhandled-error metadata, and masked session replay. Forms and form
          controls are excluded from interaction capture and blocked in replay;
          all inputs are masked. Query strings, URL fragments, form contents,
          copied text, network bodies or headers, console logs, and raw error
          messages are not sent.
        </p>
        <AnalyticsPreferences />
      </section>

      <section>
        <h2>Change or withdraw your choice</h2>
        <p>
          You can change the setting below at any time. Disabling analytics
          immediately stops replay, prevents future analytics events, and resets
          PostHog&apos;s local anonymous state in this browser; it does not
          alter anonymous reports already created.
        </p>
      </section>
    </LegalPage>
  );
}
