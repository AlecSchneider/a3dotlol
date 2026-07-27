import type { Metadata } from "next";

export const siteConfig = {
  description:
    "Follow Alec Schneider building vibe-coded apps live on YouTube, explore the tools behind them, and track the challenge to earn €100,000 from apps.",
  name: "a3.lol",
  title: "Alec Schneider — Vibe Coding Apps & Live Builds",
  url: "https://a3.lol",
} as const;

export const socialProfileUrls = [
  "https://www.youtube.com/@VibeCodenBis100kEuro",
  "https://github.com/alecschneider",
  "https://x.com/alechacks",
  "https://www.instagram.com/alecschneider.dev/",
  "https://www.tiktok.com/@alecschneider.dev",
  "https://www.linkedin.com/in/alecschneider",
] as const;

export function createPageMetadata({
  description,
  path,
  title,
}: {
  description: string;
  path: `/${string}` | "/";
  title: string;
}): Metadata {
  const brandedTitle = `${title} | ${siteConfig.name}`;
  const canonicalUrl = new URL(path, siteConfig.url);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: brandedTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: brandedTitle,
      description,
    },
  };
}

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: "Alec Schneider Solutions",
      url: siteConfig.url,
      email: "alec@a3.lol",
      telephone: "+49 175 5593082",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Pappelallee 25",
        postalCode: "10437",
        addressLocality: "Berlin",
        addressCountry: "DE",
      },
      founder: {
        "@id": `${siteConfig.url}/#alec-schneider`,
      },
      sameAs: socialProfileUrls,
    },
    {
      "@type": "Person",
      "@id": `${siteConfig.url}/#alec-schneider`,
      name: "Alec Peter Schneider",
      alternateName: "Alec Schneider",
      url: `${siteConfig.url}/about`,
      worksFor: {
        "@id": `${siteConfig.url}/#organization`,
      },
      sameAs: socialProfileUrls,
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      alternateName: ["Alec Schneider", "Alec Schneider Solutions"],
      description: siteConfig.description,
      inLanguage: "en",
      publisher: {
        "@id": `${siteConfig.url}/#organization`,
      },
    },
  ],
} as const;

export const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${siteConfig.url}/about#profile`,
  url: `${siteConfig.url}/about`,
  name: "About Alec Schneider",
  mainEntity: {
    "@type": "Person",
    "@id": `${siteConfig.url}/#alec-schneider`,
    name: "Alec Peter Schneider",
    alternateName: "Alec Schneider",
    description:
      "Independent app developer building and launching vibe-coded apps live on YouTube.",
    url: `${siteConfig.url}/about`,
    sameAs: socialProfileUrls,
  },
} as const;
