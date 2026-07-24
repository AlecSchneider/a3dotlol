import "~/styles/globals.css";

import { type Metadata } from "next";

import { AnalyticsConsent } from "~/components/analytics-consent";
import { ConvexClientProvider } from "~/components/convex-client-provider";
import { LegalFooter } from "~/components/legal-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://a3.lol"),
  title: "a3.lol",
  description: "Personal homepage for a3.lol",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
          <LegalFooter />
        </ConvexClientProvider>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
