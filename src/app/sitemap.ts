import type { MetadataRoute } from "next";

const siteUrl = "https://a3.lol";

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
