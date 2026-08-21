import { describe, expect, it, vi } from "vitest";

const failedImport = vi.hoisted(() => ({ attempts: 0 }));

vi.mock("posthog-js", () => {
  failedImport.attempts += 1;
  throw new Error("simulated analytics chunk failure");
});

vi.mock("~/env", () => ({
  env: { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "test-project-token" },
}));

import {
  disableProductAnalytics,
  enableProductAnalytics,
} from "./product-analytics";

describe("product analytics load failure", () => {
  it("fails closed without rejecting into page code", async () => {
    await expect(enableProductAnalytics()).resolves.toBe(false);
    expect(failedImport.attempts).toBe(1);

    expect(() => disableProductAnalytics()).not.toThrow();
  });
});
