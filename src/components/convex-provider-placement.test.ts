import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(join(import.meta.dirname, "..", path), "utf8");

describe("Convex provider placement", () => {
  it("keeps Convex out of routes without backend features", () => {
    expect(readSource("app/layout.tsx")).not.toContain("ConvexClientProvider");

    for (const path of [
      "app/page.tsx",
      "app/contact/page.tsx",
      "app/support/page.tsx",
    ]) {
      expect(readSource(path)).toContain("ConvexClientProvider");
    }
  });

  it("gives stack thumbnails a responsive display size", () => {
    expect(readSource("app/stack/page.tsx")).toContain(
      'sizes="(max-width: 48rem) calc(100vw - 3rem), 42rem"',
    );
  });
});
