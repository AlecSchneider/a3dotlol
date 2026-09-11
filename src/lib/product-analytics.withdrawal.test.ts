import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  register: vi.fn(),
  capture: vi.fn(),
  has_opted_out_capturing: vi.fn(() => true),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  startSessionRecording: vi.fn(),
  stopSessionRecording: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: sdk }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test-project-token");
  vi.stubGlobal("window", {
    localStorage: { removeItem: vi.fn() },
    sessionStorage: { removeItem: vi.fn() },
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("analytics withdrawal", () => {
  it.each(["localStorage", "sessionStorage"] as const)(
    "still stops capture and replay when the %s getter throws",
    async (storage) => {
      const analytics = await import("./product-analytics");
      expect(await analytics.enableProductAnalytics()).toBe(true);
      Object.defineProperty(window, storage, {
        get: () => {
          throw new Error("Storage unavailable");
        },
      });

      expect(() => analytics.disableProductAnalytics()).not.toThrow();
      expect(sdk.opt_out_capturing).toHaveBeenCalledOnce();
      expect(sdk.stopSessionRecording).toHaveBeenCalledOnce();
      expect(sdk.reset).toHaveBeenCalledWith(true);
      analytics.captureProductEvent("analytics consent accepted");
      expect(sdk.capture).not.toHaveBeenCalled();
    },
  );

  it.each(["opt_out_capturing", "stopSessionRecording", "reset"] as const)(
    "attempts every shutdown step even if %s throws",
    async (method) => {
      const analytics = await import("./product-analytics");
      await analytics.enableProductAnalytics();
      sdk[method].mockImplementationOnce(() => {
        throw new Error("SDK unavailable");
      });
      window.localStorage.removeItem = () => {
        throw new Error("Storage unavailable");
      };
      const sessionRemoveItem = vi.fn();
      window.sessionStorage.removeItem = sessionRemoveItem;

      expect(() => analytics.disableProductAnalytics()).not.toThrow();
      expect(sdk.opt_out_capturing).toHaveBeenCalledOnce();
      expect(sdk.stopSessionRecording).toHaveBeenCalledOnce();
      expect(sdk.reset).toHaveBeenCalledWith(true);
      expect(sessionRemoveItem).toHaveBeenCalled();
    },
  );

  it("resets the device identity before allowing same-page reacceptance", async () => {
    const analytics = await import("./product-analytics");
    await analytics.enableProductAnalytics();
    analytics.disableProductAnalytics();
    expect(sdk.reset).toHaveBeenCalledWith(true);
    expect(sdk.opt_out_capturing.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.reset.mock.invocationCallOrder[0]!,
    );
    expect(await analytics.enableProductAnalytics()).toBe(true);
    expect(sdk.reset.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.opt_in_capturing.mock.invocationCallOrder[1]!,
    );
    expect(sdk.init).toHaveBeenCalledOnce();
  });
});
