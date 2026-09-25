import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import robots from "~/app/robots";
import sitemap from "~/app/sitemap";
import { siteConfig } from "~/lib/seo";

// Every public page route must be listed exactly once; new pages must not be
// silently left out of the sitemap and every entry must use the canonical origin.
describe("sitemap and robots", () => {
  it("lists every app page route under the canonical site origin", () => {
    const appDirectory = path.join(process.cwd(), "src", "app");
    const expected = collectPageRoutes(appDirectory, "")
      .map((route) => `${siteConfig.url}${route}`)
      .sort();

    expect(
      sitemap()
        .map((entry) => entry.url)
        .sort(),
    ).toEqual(expected);
  });

  it("points robots at the canonical sitemap", () => {
    expect(robots()).toMatchObject({
      host: siteConfig.url,
      sitemap: `${siteConfig.url}/sitemap.xml`,
    });
  });
});

function collectPageRoutes(directory: string, route: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const routes = entries.some((entry) => entry.name === "page.tsx")
    ? [route]
    : [];

  return routes.concat(
    entries
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        collectPageRoutes(
          path.join(directory, entry.name),
          `${route}/${entry.name}`,
        ),
      ),
  );
}
