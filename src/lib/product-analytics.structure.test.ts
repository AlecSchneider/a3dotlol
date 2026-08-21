import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(import.meta.dirname, "product-analytics.ts"),
  "utf8",
);

describe("product analytics module structure", () => {
  it("does not statically import the posthog-js SDK", () => {
    // Value imports bundle the SDK into the page graph; type-only imports are
    // erased at compile time and are fine.
    const staticValueImport = [
      /^import\s+(?!type[\s{])[^;]*?from\s+["']posthog-js["'];?/m,
      /^export\s+[^;]*?from\s+["']posthog-js["'];?/m,
    ];

    for (const pattern of staticValueImport) {
      expect(source).not.toMatch(pattern);
    }

    expect(source).toMatch(/import\(\s*["']posthog-js["']\s*\)/);
  });
});
