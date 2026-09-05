import { afterEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  has_opted_out_capturing: () => false,
  register: vi.fn(),
  startSessionRecording: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: sdk }));

import { enableProductAnalytics } from "./product-analytics";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function sanitizer() {
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test-project-token");
  vi.stubGlobal("window", { location: { origin: "https://a3.lol" } });
  await enableProductAnalytics();
  return (
    sdk.init.mock.calls[0] as unknown as [
      string,
      { before_send: (event: unknown) => unknown },
    ]
  )[1].before_send;
}

describe("analytics ingestion sanitization", () => {
  it.each([false, true])(
    "preserves sanitized elements and chain regardless of key order (%s)",
    async (chainFirst) => {
      const clean = await sanitizer();
      const elements = [
        {
          tag_name: "a",
          nth_child: 2,
          attr__href: "/about?private=value#secret",
          text: "private text",
        },
      ];
      const properties = chainFirst
        ? { $elements_chain: "untrusted text", $elements: elements }
        : { $elements: elements, $elements_chain: "untrusted text" };
      expect(clean({ event: "$autocapture", properties })).toMatchObject({
        properties: {
          $elements: [{ tag_name: "a", nth_child: 2, attr__href: "/about" }],
          $elements_chain: "a:nth-child(2)",
          app_name: "a3dotlol",
          surface: "web",
        },
      });
      expect(
        JSON.stringify(clean({ event: "$autocapture", properties })),
      ).not.toMatch(/private|secret|untrusted/);
    },
  );

  it("drops an untrusted chain without valid elements and unknown event names", async () => {
    const clean = await sanitizer();
    for (const elements of [undefined, null, [], [{ tag_name: "<script>" }]]) {
      expect(
        clean({
          event: "$autocapture",
          properties: { $elements: elements, $elements_chain: "private" },
        }),
      ).toMatchObject({
        properties: { app_name: "a3dotlol", surface: "web" },
      });
      expect(
        JSON.stringify(
          clean({
            event: "$autocapture",
            properties: { $elements: elements, $elements_chain: "private" },
          }),
        ),
      ).not.toContain("$elements");
    }
    for (const event of ["unlisted", "constructor", "toString", "__proto__"]) {
      expect(clean({ event, properties: {} })).toBeNull();
    }
  });

  it("measures allowlist allocations and URL parsing for a bounded click ancestry", async () => {
    const clean = await sanitizer();
    const urls = vi.fn();
    const sets = vi.fn();
    vi.stubGlobal(
      "URL",
      new Proxy(URL, {
        construct(target, args) {
          urls();
          return Reflect.construct(target, args) as URL;
        },
      }),
    );
    vi.stubGlobal(
      "Set",
      new Proxy(Set, {
        construct(target, args) {
          sets();
          return Reflect.construct(target, args) as Set<unknown>;
        },
      }),
    );
    const result = clean({
      event: "$autocapture",
      properties: {
        $elements: Array.from({ length: 20 }, () => ({
          tag_name: "a",
          attr__href: "/about?private=value",
        })),
        $elements_chain: "untrusted",
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/private|untrusted/);
    expect(sets).not.toHaveBeenCalled();
    expect(urls).toHaveBeenCalledTimes(20);
  });
});
