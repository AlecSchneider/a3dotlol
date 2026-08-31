import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const fakePostHog = vi.hoisted(() => ({
  capture: vi.fn(),
  has_opted_out_capturing: vi.fn(() => false),
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: fakePostHog }));

vi.mock("~/env", () => ({
  env: { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "test-project-token" },
}));

import {
  captureProductEvent,
  enableProductAnalytics,
} from "./product-analytics";

describe("pickAllowedProperties allocation profile", () => {
  it("precomputes the allowlist Sets at module scope", () => {
    const source = readFileSync(
      join(import.meta.dirname, "product-analytics.ts"),
      "utf8",
    );

    // The allowlist must be materialized once at module load, not rebuilt per
    // captured event.
    expect(source).toMatch(
      /const\s+EVENT_PROPERTY_ALLOWLIST_SETS\s*(?::[^=]+)?=/,
    );
    // The per-event picker must read from the precomputed map.
    expect(source).toMatch(/EVENT_PROPERTY_ALLOWLIST_SETS\[/);
  });

  it("still filters to allowlisted properties on capture", async () => {
    await enableProductAnalytics();
    fakePostHog.capture.mockClear();

    captureProductEvent("email_signup_opened", {
      product_key: "a3dotlol",
      // @ts-expect-error: intentionally passing a non-allowlisted property to
      // prove it is stripped at runtime.
      should_not_leak: "secret-value",
    });

    expect(fakePostHog.capture).toHaveBeenCalledTimes(1);
    const calls = fakePostHog.capture.mock.calls as unknown as Array<
      [string, Record<string, unknown>]
    >;
    const properties = calls[0]?.[1];
    expect(properties).toMatchObject({
      app_name: "a3dotlol",
      product_key: "a3dotlol",
      surface: "web",
    });
    expect(properties).not.toHaveProperty("should_not_leak");
  });
});

describe("webhook configuration validation", () => {
  const source = readFileSync(
    join(import.meta.dirname, "../../convex/contact.ts"),
    "utf8",
  );

  it("caches the validated webhook URL instead of re-parsing per request", () => {
    // The webhook is parsed and validated once per isolate, then cached.
    expect(source).toMatch(/let\s+cachedWebhookUrl/);
    expect(source).toMatch(/if\s*\(\s*!cachedWebhookUrl\s*\)/);
    // getWebhookUrl must not re-read process.env on every call.
    const getter = /function getWebhookUrl\(\)[\s\S]*?\n\}/.exec(source);
    expect(getter?.[0]).not.toMatch(/new URL\(/);
  });

  it("rejects protocol-relative and wrong-host webhook URLs", () => {
    expect(() =>
      assertValidDiscordWebhook(
        "https://discord.com.evil.test/api/webhooks/1/x",
      ),
    ).toThrow();
    expect(() =>
      assertValidDiscordWebhook("http://discord.com/api/webhooks/1/x"),
    ).toThrow();
    expect(() =>
      assertValidDiscordWebhook("https://discord.com/api/webhooks/1/x"),
    ).not.toThrow();
  });
});

function assertValidDiscordWebhook(raw: string) {
  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "discord.com" ||
    !url.pathname.startsWith("/api/webhooks/")
  ) {
    throw new Error("Contact webhook configuration is invalid.");
  }
  return url;
}
