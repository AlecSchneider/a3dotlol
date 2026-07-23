import "~/styles/globals.css";

import { type Metadata } from "next";

import { AnalyticsConsent } from "~/components/analytics-consent";
import { ConvexClientProvider } from "~/components/convex-client-provider";

export const metadata: Metadata = {
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
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
