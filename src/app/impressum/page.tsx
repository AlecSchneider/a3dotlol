import { LegalPage } from "~/components/legal-page";

export const metadata = {
  title: "Impressum | a3.lol",
  description: "Legal notice for a3.lol",
};

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Legal notice"
      intro={<p>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).</p>}
      title="Impressum"
    >
      <section>
        <h2>Anbieter</h2>
        <address className="not-italic">
          Alec Schneider Solutions
          <br />
          Inhaber: Alec Peter Schneider
          <br />
          Pappelallee 25
          <br />
          10437 Berlin
          <br />
          Deutschland
        </address>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: <a href="tel:+491755593082">+49 175 5593082</a>
          <br />
          E-Mail: <a href="mailto:alec@a3.lol">alec@a3.lol</a>
        </p>
      </section>

      <section>
        <h2>Hinweis</h2>
        <p>
          Es besteht keine Kapitalgesellschaft. Das Angebot wird von Alec Peter
          Schneider als selbstständigem Einzelunternehmer unter der
          Geschäftsbezeichnung Alec Schneider Solutions betrieben.
        </p>
      </section>
    </LegalPage>
  );
}
