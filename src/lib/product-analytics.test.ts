import { beforeEach, describe, expect, it, vi } from "vitest";

type TestInitOptions = {
  autocapture?: unknown;
  before_send?: (event: unknown) => unknown;
  capture_dead_clicks?: unknown;
  capture_exceptions?: unknown;
  capture_heatmaps?: unknown;
  capture_pageleave?: unknown;
  capture_performance?: unknown;
  disable_capture_url_hashes?: unknown;
  disable_session_recording?: unknown;
  mask_all_element_attributes?: unknown;
  mask_all_text?: unknown;
  rageclick?: unknown;
  session_recording?: unknown;
};

const posthogMock = vi.hoisted(() => {
  const state: {
    initOptions?: TestInitOptions;
    moduleLoads: number;
    optedOut: boolean;
  } = { optedOut: false, moduleLoads: 0 };

  return {
    capture: vi.fn(),
    hasOptedOut: vi.fn(() => state.optedOut),
    init: vi.fn((_token: string, options: typeof state.initOptions) => {
      state.initOptions = options;
    }),
    register: vi.fn(),
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn(),
    optIn: vi.fn(() => {
      state.optedOut = false;
    }),
    optOut: vi.fn(() => {
      state.optedOut = true;
    }),
    state,
  };
});

vi.mock("posthog-js", () => {
  // Counts how many times the browser actually loads the analytics SDK.
  posthogMock.state.moduleLoads += 1;
  return {
    default: {
      capture: posthogMock.capture,
      has_opted_out_capturing: posthogMock.hasOptedOut,
      init: posthogMock.init,
      opt_in_capturing: posthogMock.optIn,
      opt_out_capturing: posthogMock.optOut,
      register: posthogMock.register,
      startSessionRecording: posthogMock.startSessionRecording,
      stopSessionRecording: posthogMock.stopSessionRecording,
    },
  };
});

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
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test-project-token");
    vi.stubGlobal("window", {
      location: { origin: "https://a3.lol" },
    });
  });

  it("clears persisted PostHog identity without loading the SDK", () => {
    const localRemoveItem = vi.fn();
    const sessionRemoveItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: { removeItem: localRemoveItem },
      location: { origin: "https://a3.lol" },
      sessionStorage: { removeItem: sessionRemoveItem },
    });

    disableProductAnalytics();

    expect(posthogMock.state.moduleLoads).toBe(0);
    expect(localRemoveItem).toHaveBeenCalledWith(
      "ph_test-project-token_posthog",
    );
    expect(sessionRemoveItem).toHaveBeenCalledWith(
      "ph_test-project-token_posthog",
    );
  });

  it("captures bounded CTA and navigation events after consent", async () => {
    // The SDK must stay unloaded until a visitor opts in.
    expect(posthogMock.state.moduleLoads).toBe(0);

    expect(await enableProductAnalytics()).toBe(true);
    expect(posthogMock.state.moduleLoads).toBe(1);
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    const initOptions = posthogMock.state.initOptions;
    expect(posthogMock.init).toHaveBeenCalledWith(
      "test-project-token",
      initOptions,
    );
    expect(initOptions?.autocapture).toMatchObject({
      capture_copied_text: false,
      dom_event_allowlist: ["click"],
      element_allowlist: ["a", "button"],
    });
    expect(initOptions?.capture_dead_clicks).toBeTypeOf("object");
    expect(initOptions?.capture_exceptions).toBeTypeOf("object");
    expect(initOptions?.capture_heatmaps).toBe(true);
    expect(initOptions?.capture_pageleave).toBe(true);
    expect(initOptions?.capture_performance).toMatchObject({
      network_timing: false,
      web_vitals: true,
    });
    expect(initOptions?.disable_capture_url_hashes).toBe(true);
    expect(initOptions?.disable_session_recording).toBe(false);
    expect(initOptions?.mask_all_element_attributes).toBe(true);
    expect(initOptions?.mask_all_text).toBe(true);
    expect(initOptions?.rageclick).toBeTypeOf("object");
    expect(initOptions?.session_recording).toMatchObject({
      maskAllInputs: true,
      recordBody: false,
      recordHeaders: false,
    });
    expect(posthogMock.register).toHaveBeenCalledWith({
      app_name: "a3dotlol",
      surface: "web",
    });
    expect(posthogMock.startSessionRecording).toHaveBeenCalledTimes(1);

    const sanitized = initOptions?.before_send?.({
      $set: { $initial_current_url: "https://a3.lol/?email=private" },
      event: "$pageview",
      properties: {
        $browser: "Chrome",
        $current_url: "https://a3.lol/about?email=private#secret",
        $device_id: "anonymous-device",
        $raw_user_agent: "private user agent",
        $referrer: "https://search.example/?q=private#secret",
        $session_entry_url: "https://a3.lol/?email=private#secret",
        $session_id: "anonymous-session",
        app_name: "a3dotlol",
        distinct_id: "anonymous-device",
        path: "/about",
        surface: "web",
        token: "test-project-token",
        utm_campaign: "private-query-value",
      },
      uuid: "01a28b4e-22c5-4f43-9814-444c017a87b9",
    }) as { properties?: Record<string, unknown>; $set?: unknown } | null;

    expect(sanitized).toEqual({
      event: "$pageview",
      properties: {
        $browser: "Chrome",
        $current_url: "/about",
        $device_id: "anonymous-device",
        $referrer: "https://search.example",
        $session_entry_url: "/",
        $session_id: "anonymous-session",
        app_name: "a3dotlol",
        distinct_id: "anonymous-device",
        path: "/about",
        surface: "web",
        token: "test-project-token",
      },
      timestamp: undefined,
      uuid: "01a28b4e-22c5-4f43-9814-444c017a87b9",
    });
    expect(sanitized).not.toHaveProperty("$set");

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
    expect(posthogMock.stopSessionRecording).toHaveBeenCalledTimes(1);
    captureProductEvent("analytics consent accepted");
    expect(posthogMock.capture).toHaveBeenCalledTimes(3);

    // Re-enabling must neither reload the SDK nor re-initialize it.
    await enableProductAnalytics();
    expect(posthogMock.state.moduleLoads).toBe(1);
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });

  it("keeps automatic diagnostics useful while removing content and URL data", async () => {
    await enableProductAnalytics();

    const initOptions = posthogMock.state.initOptions;
    const beforeSend = initOptions?.before_send;

    expect(beforeSend).toBeTypeOf("function");
    expect(
      beforeSend?.({
        event: "$autocapture",
        properties: {
          $current_url: "https://a3.lol/contact?email=private#secret",
          $elements: [
            {
              $el_text: "Private form content",
              attr__href: "/about?token=secret#private",
              attr__id: "private-id",
              nth_child: 2,
              nth_of_type: 1,
              tag_name: "a",
            },
          ],
          $elements_chain: "a:nth-child(2):nth-of-type(1)",
          $event_type: "click",
          $external_click_url: "https://example.com/path?token=secret#private",
          $session_id: "anonymous-session",
          $window_id: "anonymous-window",
          app_name: "wrong-app",
          distinct_id: "anonymous-device",
          email: "private@example.com",
          surface: "wrong-surface",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        event: "$autocapture",
        properties: {
          $current_url: "/contact",
          $elements: [
            {
              attr__href: "/about",
              nth_child: 2,
              nth_of_type: 1,
              tag_name: "a",
            },
          ],
          $elements_chain: "a:nth-child(2):nth-of-type(1)",
          $event_type: "click",
          $external_click_url: "https://example.com",
          $session_id: "anonymous-session",
          $window_id: "anonymous-window",
          app_name: "a3dotlol",
          distinct_id: "anonymous-device",
          surface: "web",
        },
      }),
    );

    const heatmapResult = beforeSend?.({
      event: "$$heatmap",
      properties: {
        $heatmap_data: {
          "https://a3.lol/about?email=private#secret": [
            { target_fixed: false, type: "click", x: 42, y: 84 },
          ],
        },
        distinct_id: "anonymous-device",
      },
    }) as { event?: unknown; properties?: unknown } | null;
    expect(heatmapResult?.event).toBe("$$heatmap");
    expect(heatmapResult?.properties).toEqual({
      $heatmap_data: {
        "/about": [{ target_fixed: false, type: "click", x: 42, y: 84 }],
      },
      app_name: "a3dotlol",
      distinct_id: "anonymous-device",
      surface: "web",
    });

    const exceptionResult = beforeSend?.({
      event: "$exception",
      properties: {
        $exception_list: [
          {
            stacktrace: {
              frames: [
                {
                  abs_path: "https://a3.lol/_next/app.js?token=private",
                  colno: 9,
                  context_line: "const email = 'private@example.com'",
                  filename: "https://a3.lol/_next/app.js?token=private",
                  function: "submitContact",
                  in_app: true,
                  lineno: 12,
                  platform: "web:javascript",
                },
              ],
              type: "raw",
            },
            type: "TypeError",
            value: "Request failed for private@example.com",
          },
        ],
        $exception_level: "error",
        distinct_id: "anonymous-device",
      },
    }) as { event?: unknown; properties?: unknown } | null;
    expect(exceptionResult?.event).toBe("$exception");
    expect(exceptionResult?.properties).toEqual({
      $exception_level: "error",
      $exception_list: [
        {
          stacktrace: {
            frames: [
              {
                colno: 9,
                filename: "/_next/app.js",
                function: "submitContact",
                in_app: true,
                lineno: 12,
                platform: "web:javascript",
              },
            ],
            type: "raw",
          },
          type: "TypeError",
        },
      ],
      app_name: "a3dotlol",
      distinct_id: "anonymous-device",
      surface: "web",
    });
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
