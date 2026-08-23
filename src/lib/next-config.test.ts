import { describe, expect, it } from "vitest";

describe("deployment build validation", () => {
  it("keeps TypeScript and lint failures blocking", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://audit.convex.cloud";

    const { default: config } = await import("../../next.config.js");

    expect(config.typescript?.ignoreBuildErrors).not.toBe(true);
    expect(config.eslint?.ignoreDuringBuilds).not.toBe(true);
  });
});
