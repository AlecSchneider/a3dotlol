import type { MetadataRoute } from "next";

import { siteConfig } from "~/lib/seo";

const siteUrl = siteConfig.url;

const routes = [
  "",
  "/about",
  "/contact",
  "/cookies",
  "/impressum",
  "/privacy",
  "/stack",
  "/support",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route, index) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "/stack" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
