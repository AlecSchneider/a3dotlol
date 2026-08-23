import { ContactForm } from "~/components/contact-form";
import { ConvexClientProvider } from "~/components/convex-client-provider";
import { LegalPage } from "~/components/legal-page";
import { createPageMetadata } from "~/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact Alec Schneider Solutions",
  description:
    "Contact Alec Schneider Solutions about projects, business inquiries, support, privacy, or the apps featured on a3.lol.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      intro={
        <p>
          For project, business, support, or privacy questions, use the form or
          the direct contact details below.
        </p>
      }
      title="Get in touch"
    >
      <section>
        <h2>Contact details</h2>
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
        <h2>Contact form</h2>
        <ConvexClientProvider>
          <ContactForm formName="contact" />
        </ConvexClientProvider>
      </section>
    </LegalPage>
  );
}
