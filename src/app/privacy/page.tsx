import Link from "next/link";

import { AnalyticsPreferences } from "~/components/analytics-preferences";
import { LegalPage } from "~/components/legal-page";

export const metadata = {
  title: "Privacy Policy | a3.lol",
  description: "Privacy information for a3.lol",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      intro={
        <>
          <p>
            This notice explains how personal data is processed when you visit
            a3.lol or use its contact and support forms.
          </p>
          <p>Last updated: 27 July 2026.</p>
        </>
      }
      title="Privacy notice"
    >
      <section>
        <h2>1. Controller</h2>
        <address className="not-italic">
          Alec Schneider Solutions
          <br />
          Inhaber: Alec Peter Schneider
          <br />
          Pappelallee 25
          <br />
          10437 Berlin, Germany
          <br />
          <a href="mailto:alec@a3.lol">alec@a3.lol</a>
          <br />
          <a href="tel:+491755593082">+49 175 5593082</a>
        </address>
      </section>

      <section>
        <h2>2. Website delivery and security logs</h2>
        <p>
          The site is delivered by Vercel Inc. Requests necessarily transmit
          technical data such as IP address, date and time, requested resource,
          referrer, browser/device information, and security or error metadata.
          This is processed to deliver the site, prevent abuse, diagnose
          failures, and maintain security.
        </p>
        <p>
          The legal basis is Article 6(1)(f) GDPR. The legitimate interests are
          reliable, secure website operation and defence against misuse. On the
          current Pro plan, Vercel runtime logs are available for one day unless
          a different paid observability retention setting is enabled. Provider
          backups and service-generated data may follow Vercel&apos;s
          contractual retention rules.
        </p>
      </section>

      <section id="contact">
        <h2>3. Contact and support requests</h2>
        <p>
          Required fields are your email address and message. Name and subject
          are optional. The data is used only to route, review, and answer your
          request. Do not submit sensitive data that is not needed for the
          request.
        </p>
        <p>
          The form sends the request to Convex for validation and server-side
          delivery into a separate private Discord channel. The contact payload
          is not stored in the a3.lol Convex database. Convex stores only the
          Discord message identifier and deletion deadline so the Discord copy
          can be deleted automatically after 90 days. Global, non-personal
          counters are used to limit abuse.
        </p>
        <p>
          Discord messages are scheduled for deletion after 90 days. A shorter
          period applies when the request is resolved and deleted earlier; a
          longer period may apply only where required to establish, exercise, or
          defend legal claims.
        </p>
        <p>
          For enquiries connected with a contract or steps before entering one,
          the legal basis is Article 6(1)(b) GDPR. For general correspondence,
          support, and abuse prevention, it is Article 6(1)(f) GDPR. The
          legitimate interest is answering genuine enquiries and operating a
          secure support channel.
        </p>
      </section>

      <section>
        <h2>4. Optional analytics and browser storage</h2>
        <p>
          PostHog analytics loads only after you accept it. The site sends
          anonymous page paths, broad link destinations, the page area where a
          link was selected, contact or support form start/success/failure
          outcomes, and the analytics-consent acceptance event. It does not send
          names, email addresses, messages, form contents, full mail or phone
          links, URL query strings, or fragments.
        </p>
        <p>
          Automatic click capture, session replay, surveys, experiments, feature
          flags, and person profiles are disabled. PostHog stores a random
          anonymous identifier and session information in local storage after
          acceptance so page visits can be counted together. The project is
          hosted on PostHog Cloud EU.
        </p>
        <p>
          The legal basis is your consent under Article 6(1)(a) GDPR and § 25(1)
          TDDDG. Your decision is stored locally in your browser for 180 days so
          the site can remember it. You may withdraw consent at any time with
          effect for the future. See the{" "}
          <Link href="/cookies">cookies and storage page</Link> for full
          details.
        </p>
        <AnalyticsPreferences />
      </section>

      <section>
        <h2>5. Legacy newsletter records</h2>
        <p>
          New newsletter registrations are disabled while a verifiable
          double-opt-in process is not available. Four registrations collected
          by the former form remain stored in Convex with email address,
          timestamp, and source. They are not used for a campaign from this site
          while the consent evidence is under review.
        </p>
        <p>
          A person who registered may request access or deletion at any time.
          The records will not be retained after the newsletter is permanently
          discontinued or the applicable consent is withdrawn.
        </p>
      </section>

      <section>
        <h2>6. Recipients and international transfers</h2>
        <p>The processors and recipients used by this site are:</p>
        <ul>
          <li>
            <a
              href="https://vercel.com/legal/dpa"
              rel="noreferrer"
              target="_blank"
            >
              Vercel Inc.
            </a>{" "}
            for website delivery and logs;
          </li>
          <li>
            <a
              href="https://posthog.com/privacy"
              rel="noreferrer"
              target="_blank"
            >
              PostHog Inc.
            </a>{" "}
            for consented product analytics in an EU-hosted project;
          </li>
          <li>
            <a
              href="https://www.convex.dev/legal/dpa"
              rel="noreferrer"
              target="_blank"
            >
              Convex Inc.
            </a>{" "}
            for the backend, abuse limits, delivery metadata, and legacy
            newsletter records; and
          </li>
          <li>
            <a
              href="https://discord.com/privacy"
              rel="noreferrer"
              target="_blank"
            >
              Discord Inc.
            </a>{" "}
            for private internal handling of contact messages.
          </li>
        </ul>
        <p>
          PostHog analytics data is hosted in the European Union. Convex is
          configured in US East. Vercel, Convex, Discord, and PostHog&apos;s
          support or corporate operations may involve processing in the United
          States. The providers describe Data Privacy Framework participation
          and/or Standard Contractual Clauses in their privacy and contractual
          documentation. These mechanisms are intended to provide safeguards
          under Articles 45 and 46 GDPR.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>
          Subject to the legal requirements, you have rights to access,
          rectification, erasure, restriction, data portability, and objection.
          Where processing relies on consent, you may withdraw it at any time
          for the future. Where processing relies on Article 6(1)(f) GDPR, you
          may object on grounds relating to your particular situation.
        </p>
        <p>
          Send requests to <a href="mailto:alec@a3.lol">alec@a3.lol</a>. You
          also have the right to complain to a supervisory authority. The
          competent local authority is the{" "}
          <a
            href="https://www.datenschutz-berlin.de/buergerinnen-und-buerger/beschwerde"
            rel="noreferrer"
            target="_blank"
          >
            Berliner Beauftragte für Datenschutz und Informationsfreiheit
          </a>
          .
        </p>
      </section>

      <section>
        <h2>8. Automated decisions and changes</h2>
        <p>
          This site does not use automated decision-making or profiling that
          produces legal or similarly significant effects. This notice will be
          updated when the processing setup materially changes.
        </p>
      </section>
    </LegalPage>
  );
}
