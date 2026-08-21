import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => {
  const state = { optedOut: false };

  return {
    capture: vi.fn(),
    hasOptedOut: vi.fn(() => state.optedOut),
    init: vi.fn(),
    optIn: vi.fn(() => {
      state.optedOut = false;
    }),
    optOut: vi.fn(() => {
      state.optedOut = true;
    }),
    state,
  };
});

vi.mock("posthog-js", () => ({
  default: {
    capture: posthogMock.capture,
    has_opted_out_capturing: posthogMock.hasOptedOut,
    init: posthogMock.init,
    opt_in_capturing: posthogMock.optIn,
    opt_out_capturing: posthogMock.optOut,
  },
}));

vi.mock("~/env", () => ({
  env: { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "test-project-token" },
}));

import {
  captureNavigationClick,
  captureProductEvent,
  disableProductAnalytics,
  enableProductAnalytics,
} from "./product-analytics";

describe("product analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthogMock.state.optedOut = false;
    vi.stubGlobal("window", {
      location: { origin: "https://a3.lol" },
    });
  });

  it("captures bounded CTA and navigation events after consent", () => {
    expect(enableProductAnalytics()).toBe(true);

    captureNavigationClick(
      createAnchor("https://www.youtube.com/@alecschneider", {
        analyticsCta: "youtube_live",
        analyticsPlacement: "hero",
      }),
    );

    expect(posthogMock.capture).toHaveBeenNthCalledWith(
      1,
      "primary call to action clicked",
      {
        app_name: "a3dotlol",
        cta_key: "youtube_live",
        placement: "hero",
        surface: "web",
      },
    );
    expect(posthogMock.capture).toHaveBeenNthCalledWith(
      2,
      "navigation link clicked",
      {
        app_name: "a3dotlol",
        destination_host: "www.youtube.com",
        destination_type: "external",
        placement: "hero",
        surface: "web",
      },
    );

    captureProductEvent("analytics consent accepted", {
      unexpected: "never send this",
    } as never);
    expect(posthogMock.capture).toHaveBeenLastCalledWith(
      "analytics consent accepted",
      {
        app_name: "a3dotlol",
        surface: "web",
      },
    );

    disableProductAnalytics();
    captureProductEvent("analytics consent accepted");
    expect(posthogMock.capture).toHaveBeenCalledTimes(3);
  });
});

function createAnchor(
  href: string,
  dataset: Record<string, string>,
): HTMLAnchorElement {
  return {
    closest: () => null,
    dataset,
    getAttribute: (name: string) => (name === "href" ? href : null),
  } as unknown as HTMLAnchorElement;
}
