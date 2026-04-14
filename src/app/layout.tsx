import "~/styles/globals.css";

import { type Metadata } from "next";

import { AnalyticsConsent } from "~/components/analytics-consent";
import { TRPCReactProvider } from "~/trpc/react";

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
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
