import { ContactForm } from "~/components/contact-form";
import { LegalPage } from "~/components/legal-page";

export const metadata = {
  title: "Support | a3.lol",
  description: "Support for projects by Alec Schneider Solutions",
};

export default function SupportPage() {
  return (
    <LegalPage
      eyebrow="Support"
      intro={
        <p>
          Describe the project, what you expected, and what happened. Please do
          not include passwords, payment data, or sensitive personal data.
        </p>
      }
      title="How can I help?"
    >
      <section>
        <h2>Before you send a request</h2>
        <p>
          Include the project or app name, device and browser, and steps that
          reproduce the issue. Screenshots can be arranged after first contact;
          this form accepts text only.
        </p>
      </section>

      <section>
        <h2>Support request</h2>
        <ContactForm />
      </section>
    </LegalPage>
  );
}
