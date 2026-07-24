import { ContactForm } from "~/components/contact-form";
import { LegalPage } from "~/components/legal-page";

export const metadata = {
  title: "Contact | a3.lol",
  description: "Contact Alec Schneider Solutions",
};

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
        <ContactForm />
      </section>
    </LegalPage>
  );
}
