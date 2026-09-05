import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, internal } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import { modules } from "../../convex/test.setup";

const input = { email: "test@example.com", message: "Synthetic QA message" };

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
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
  it("purges confirmed deletions but retains failed and unexpired records", async () => {
    const { test, fetchMock } = setup(
      "https://discord.com/api/webhooks/test/test",
    );
    await test.run(async (ctx) => {
      for (const messageId of ["removed", "missing", "failed"]) {
        await ctx.db.insert("contactDeliveries", { messageId, deleteAfter: 0 });
      }
      await ctx.db.insert("contactDeliveries", {
        messageId: "future",
        deleteAfter: Date.now() + 86400000,
      });
    });
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(
      test.action(internal.contact.purgeExpiredDeliveries, {}),
    ).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const remaining = await test.run((ctx) =>
      ctx.db.query("contactDeliveries").collect(),
    );
    expect(remaining.map((x) => x.messageId).sort()).toEqual([
      "failed",
      "future",
    ]);
  });
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
      string | URL,
      RequestInit,
    ];
    expect(new URL(url).searchParams.get("wait")).toBe("true");
    expect(options.method).toBe("POST");
    expect(await new Response(options.body).json()).toMatchObject({
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

  it.each([
    { email: "invalid" },
    { email: `${"a".repeat(250)}@x.co` },
    { message: "   " },
    { message: "a".repeat(2001) },
    { name: "a".repeat(101) },
    { subject: "a".repeat(121) },
  ])(
    "rejects invalid normalized input before delivery (%j)",
    async (fields) => {
      const { test, fetchMock } = setup(
        "https://discord.com/api/webhooks/test/test",
      );
      await expect(
        test.action(api.contact.submit, { ...input, ...fields }),
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("trims before limits, lowercases email, and accepts optional fields", async () => {
    const { test, fetchMock } = setup(
      "https://discord.com/api/webhooks/test/test",
    );
    await test.action(api.contact.submit, {
      email: "  TEST@EXAMPLE.COM ",
      message: ` ${"m".repeat(2000)} `,
      name: ` ${"n".repeat(100)} `,
      subject: ` ${"s".repeat(120)} `,
    });
    const [, options] = fetchMock.mock.calls[0] as unknown as [
      unknown,
      RequestInit,
    ];
    expect(await new Response(options.body).json()).toMatchObject({
      embeds: [
        {
          description: "m".repeat(2000),
          fields: [
            { value: "test@example.com" },
            { value: "n".repeat(100) },
            { value: "s".repeat(120) },
          ],
        },
      ],
    });
  });

  it("accepts the honeypot without validating or delivering", async () => {
    const { test, fetchMock } = setup(undefined);
    await expect(
      test.action(api.contact.submit, {
        email: "",
        message: "",
        website: "bot",
      }),
    ).resolves.toEqual({ status: "sent" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{}, { id: "" }, { id: 42 }])(
    "rejects malformed receipts without recording (%j)",
    async (receipt) => {
      const { test, fetchMock } = setup(
        "https://discord.com/api/webhooks/test/test",
      );
      fetchMock.mockResolvedValue(new Response(JSON.stringify(receipt)));
      await expect(test.action(api.contact.submit, input)).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(
        await test.run((ctx) => ctx.db.query("contactDeliveries").collect()),
      ).toEqual([]);
    },
  );

  it("stops before delivery after the per-email burst limit", async () => {
    vi.useFakeTimers();
    const { test, fetchMock } = setup(
      "https://discord.com/api/webhooks/test/test",
    );
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ id: "test-message" })),
    );
    for (let i = 0; i < 10; i++) await test.action(api.contact.submit, input);
    await expect(test.action(api.contact.submit, input)).rejects.toThrow(
      "Too many contact requests",
    );
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
