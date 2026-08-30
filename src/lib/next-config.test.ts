import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("deployment build validation", () => {
  it("keeps TypeScript and lint failures blocking", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://audit.convex.cloud";

    const { default: config } = await import("../../next.config.js");
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(config.typescript?.ignoreBuildErrors).not.toBe(true);
    expect(packageJson.scripts?.check).toContain("eslint .");
    expect(packageJson.scripts?.check).toContain("tsc --noEmit");
  });
});
