import "~/styles/globals.css";

import { type Metadata } from "next";

import { AnalyticsConsent } from "~/components/analytics-consent";
import { LegalFooter } from "~/components/legal-footer";
import { siteConfig } from "~/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "Alec Schneider", url: "/about" }],
  creator: "Alec Schneider",
  publisher: "Alec Schneider Solutions",
  alternates: {
    canonical: "/",
  },
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <LegalFooter />
        <AnalyticsConsent />
      </body>
    </html>
  );
}
