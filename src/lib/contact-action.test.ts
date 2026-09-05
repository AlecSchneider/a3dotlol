import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import { modules } from "../../convex/test.setup";

const input = { email: "test@example.com", message: "Synthetic QA message" };

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function setup(webhook: string | undefined) {
  vi.stubEnv("CONTACT_DISCORD_WEBHOOK", webhook);
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: "test-message" }), { status: 200 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  const test = convexTest(schema, modules);
  rateLimiterTest.register(test);
  return { test, fetchMock };
}

describe("contact action webhook contract", () => {
  it.each([
    undefined,
    "//discord.com/api/webhooks/test/test",
    "https://discord.com.evil.test/api/webhooks/test/test",
    "http://discord.com/api/webhooks/test/test",
    "https://discord.com/not-a-webhook",
  ])("rejects invalid configuration before delivery (%s)", async (webhook) => {
    const { test, fetchMock } = setup(webhook);
    await expect(test.action(api.contact.submit, input)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      await test.run((ctx) => ctx.db.query("contactDeliveries").collect()),
    ).toEqual([]);
  });

  it("delivers with mentions disabled and records retention only after success", async () => {
    const { test, fetchMock } = setup(
      "https://discord.com/api/webhooks/test/test",
    );
    await expect(test.action(api.contact.submit, input)).resolves.toEqual({
      status: "sent",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.searchParams.get("wait")).toBe("true");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toMatchObject({
      allowed_mentions: { parse: [] },
    });
    const deliveries = await test.run((ctx) =>
      ctx.db.query("contactDeliveries").collect(),
    );
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.messageId).toBe("test-message");
    expect(deliveries[0]?.deleteAfter).toBeTypeOf("number");
  });

  it("does not record an unsuccessful Discord delivery", async () => {
    const { test, fetchMock } = setup(
      "https://discord.com/api/webhooks/test/test",
    );
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(test.action(api.contact.submit, input)).rejects.toThrow();
    expect(
      await test.run((ctx) => ctx.db.query("contactDeliveries").collect()),
    ).toEqual([]);
  });
});
