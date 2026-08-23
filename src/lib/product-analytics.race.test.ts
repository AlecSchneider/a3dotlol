import { describe, expect, it, vi } from "vitest";

const delayedPostHog = vi.hoisted(() => {
  const posthog = {
    capture: vi.fn(),
    has_opted_out_capturing: vi.fn(() => true),
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  };
  let resolveModule: ((module: { default: typeof posthog }) => void) | null =
    null;
  const modulePromise = new Promise<{ default: typeof posthog }>((resolve) => {
    resolveModule = resolve;
  });

  return {
    modulePromise,
    posthog,
    resolve() {
      resolveModule?.({ default: posthog });
    },
  };
});

vi.mock("posthog-js", () => delayedPostHog.modulePromise);

import {
  captureProductEvent,
  disableProductAnalytics,
  enableProductAnalytics,
} from "./product-analytics";

describe("product analytics consent race", () => {
  it("does not initialize or opt in after consent is withdrawn", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test-project-token");

    const enabling = enableProductAnalytics();

    disableProductAnalytics();
    delayedPostHog.resolve();

    await expect(enabling).resolves.toBe(false);
    expect(delayedPostHog.posthog.init).not.toHaveBeenCalled();
    expect(delayedPostHog.posthog.opt_in_capturing).not.toHaveBeenCalled();

    captureProductEvent("analytics consent accepted");
    expect(delayedPostHog.posthog.capture).not.toHaveBeenCalled();
  });
});
