import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(import.meta.dirname, "convex-client-provider.tsx"),
  "utf8",
);

describe("Convex client provider bundle", () => {
  it("does not pull the runtime environment validator into the browser bundle", () => {
    expect(source).not.toMatch(/from\s+["']~\/env["']/);
    expect(source).toMatch(/process\.env\.NEXT_PUBLIC_CONVEX_URL/);
  });
});
