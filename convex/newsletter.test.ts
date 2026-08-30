import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const baseArgs = {
  consentVersion: "2026-08-20" as const,
  locale: "en-US",
  productKey: "a3dotlol" as const,
  publisherKey: "alec-schneider-solutions" as const,
  source: "homepage" as const,
};

function initTest() {
  const test = convexTest(schema, modules);
  rateLimiterTest.register(test);
  return test;
}

describe("newsletter consent", () => {
  it("normalizes addresses and stores separate unverified preferences", async () => {
    const test = initTest();

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email: "  Person@Example.COM ",
      productUpdates: true,
      publisherPromotions: false,
    });

    const snapshot = await readSnapshot(test);

    expect(snapshot.contacts).toHaveLength(1);
    expect(snapshot.contacts[0]).toMatchObject({
      normalizedEmail: "person@example.com",
      status: "unverified",
    });
    expect(snapshot.preferences[0]).toMatchObject({
      consentVersion: baseArgs.consentVersion,
      locale: "en-US",
      productKey: baseArgs.productKey,
      productUpdates: true,
      publisherKey: baseArgs.publisherKey,
      publisherPromotions: false,
      source: baseArgs.source,
    });
    expect(snapshot.preferences[0]?.productUpdatesGrantedAt).toEqual(
      expect.any(Number),
    );
    expect(
      snapshot.preferences[0]?.publisherPromotionsGrantedAt,
    ).toBeUndefined();
    expect(snapshot.events).toMatchObject([
      {
        action: "granted",
        purpose: "product_updates",
      },
    ]);
  });

  it.each([
    ["invalid", "not-an-email"],
    ["oversized", `${"a".repeat(250)}@example.com`],
  ])("rejects %s addresses", async (_label, email) => {
    const test = initTest();

    await expect(
      test.mutation(api.newsletter.subscribe, {
        ...baseArgs,
        email,
        productUpdates: true,
        publisherPromotions: false,
      }),
    ).rejects.toThrow();
  });

  it("rejects a submission with neither purpose selected", async () => {
    const test = initTest();

    await expect(
      test.mutation(api.newsletter.subscribe, {
        ...baseArgs,
        email: "person@example.com",
        productUpdates: false,
        publisherPromotions: false,
      }),
    ).rejects.toThrow("Choose at least one email purpose");
  });

  it("supports either purpose independently and both together", async () => {
    const test = initTest();

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email: "product@example.com",
      productUpdates: true,
      publisherPromotions: false,
    });
    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email: "publisher@example.com",
      productUpdates: false,
      publisherPromotions: true,
    });
    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email: "both@example.com",
      productUpdates: true,
      publisherPromotions: true,
    });

    const snapshot = await readSnapshot(test);
    expect(snapshot.contacts).toHaveLength(3);
    expect(snapshot.preferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productUpdates: true,
          publisherPromotions: false,
        }),
        expect.objectContaining({
          productUpdates: false,
          publisherPromotions: true,
        }),
        expect.objectContaining({
          productUpdates: true,
          publisherPromotions: true,
        }),
      ]),
    );
  });

  it("deduplicates repeats and audits preference changes and re-grants", async () => {
    const test = initTest();
    const email = "changes@example.com";

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email,
      productUpdates: true,
      publisherPromotions: true,
    });
    const initial = await readSnapshot(test);

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email,
      productUpdates: true,
      publisherPromotions: true,
    });
    const repeated = await readSnapshot(test);

    expect(repeated.contacts).toHaveLength(1);
    expect(repeated.preferences).toHaveLength(1);
    expect(repeated.events).toHaveLength(initial.events.length);

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email,
      productUpdates: false,
      publisherPromotions: true,
    });
    const withdrawn = await readSnapshot(test);
    const withdrawnAt = withdrawn.preferences[0]?.productUpdatesWithdrawnAt;

    expect(withdrawnAt).toEqual(expect.any(Number));
    expect(withdrawn.events[withdrawn.events.length - 1]).toMatchObject({
      action: "withdrawn",
      purpose: "product_updates",
    });

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email,
      productUpdates: true,
      publisherPromotions: true,
    });
    const regranted = await readSnapshot(test);

    expect(regranted.preferences[0]?.productUpdates).toBe(true);
    expect(regranted.preferences[0]?.productUpdatesWithdrawnAt).toBe(
      withdrawnAt,
    );
    expect(regranted.events[regranted.events.length - 1]).toMatchObject({
      action: "granted",
      purpose: "product_updates",
    });
  });

  it("withdraws both purposes without revealing whether an address exists", async () => {
    const test = initTest();

    await expect(
      test.mutation(api.newsletter.withdraw, {
        ...baseArgs,
        email: "unknown@example.com",
      }),
    ).resolves.toEqual({ status: "withdrawn" });

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email: "withdraw@example.com",
      productUpdates: true,
      publisherPromotions: true,
    });
    await expect(
      test.mutation(api.newsletter.withdraw, {
        ...baseArgs,
        email: "withdraw@example.com",
      }),
    ).resolves.toEqual({ status: "withdrawn" });

    const snapshot = await readSnapshot(test);
    expect(snapshot.preferences[0]).toMatchObject({
      productUpdates: false,
      publisherPromotions: false,
    });
    expect(snapshot.preferences[0]?.productUpdatesWithdrawnAt).toEqual(
      expect.any(Number),
    );
    expect(snapshot.preferences[0]?.publisherPromotionsWithdrawnAt).toEqual(
      expect.any(Number),
    );
    expect(
      snapshot.events.filter((event) => event.action === "withdrawn"),
    ).toHaveLength(2);
  });

  it("accepts withdrawal requests from a stale consent-copy client", async () => {
    const test = initTest();
    const email = "stale-client@example.com";

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email,
      productUpdates: true,
      publisherPromotions: true,
    });

    await expect(
      test.mutation(api.newsletter.withdraw, {
        ...baseArgs,
        consentVersion: "2026-08-19",
        email,
      }),
    ).resolves.toEqual({ status: "withdrawn" });

    const snapshot = await readSnapshot(test);
    expect(snapshot.preferences[0]).toMatchObject({
      productUpdates: false,
      publisherPromotions: false,
    });
  });

  it("bounds the ignored consent version on withdrawal requests", async () => {
    const test = initTest();

    await expect(
      test.mutation(api.newsletter.withdraw, {
        ...baseArgs,
        consentVersion: "v".repeat(65),
        email: "bounded-version@example.com",
      }),
    ).rejects.toThrow("Consent version is invalid");
  });

  it("keeps concurrent duplicate attempts to one contact and preference", async () => {
    const test = initTest();
    const args = {
      ...baseArgs,
      email: "concurrent@example.com",
      productUpdates: true,
      publisherPromotions: false,
    };

    await Promise.all([
      test.mutation(api.newsletter.subscribe, args),
      test.mutation(api.newsletter.subscribe, args),
    ]);

    const snapshot = await readSnapshot(test);
    expect(snapshot.contacts).toHaveLength(1);
    expect(snapshot.preferences).toHaveLength(1);
    expect(snapshot.events).toHaveLength(1);
  });

  it("rate limits repeated public writes", async () => {
    const test = initTest();
    const args = {
      ...baseArgs,
      email: "limited@example.com",
      productUpdates: true,
      publisherPromotions: false,
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await test.mutation(api.newsletter.subscribe, args);
    }

    await expect(test.mutation(api.newsletter.subscribe, args)).rejects.toThrow(
      "Too many requests",
    );
  });

  it("isolates signup burst limits by normalized email", async () => {
    const test = initTest();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await test.mutation(api.newsletter.subscribe, {
        ...baseArgs,
        email: "busy@example.com",
        productUpdates: true,
        publisherPromotions: false,
      });
    }

    await expect(
      test.mutation(api.newsletter.subscribe, {
        ...baseArgs,
        email: "other@example.com",
        productUpdates: true,
        publisherPromotions: false,
      }),
    ).resolves.toEqual({ status: "saved" });
  });

  it("keeps withdrawal available after the subscribe burst limit is exhausted", async () => {
    const test = initTest();
    const email = "withdraw-after-limit@example.com";
    const args = {
      ...baseArgs,
      email,
      productUpdates: true,
      publisherPromotions: false,
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await test.mutation(api.newsletter.subscribe, args);
    }
    await expect(test.mutation(api.newsletter.subscribe, args)).rejects.toThrow(
      "Too many requests",
    );

    await expect(
      test.mutation(api.newsletter.withdraw, { ...baseArgs, email }),
    ).resolves.toEqual({ status: "withdrawn" });
  });

  it("deletes expired current consent records and audit history", async () => {
    const test = initTest();

    await test.mutation(api.newsletter.subscribe, {
      ...baseArgs,
      email: "expired@example.com",
      productUpdates: true,
      publisherPromotions: false,
    });
    await test.run(async (ctx) => {
      const contact = await ctx.db.query("emailContacts").first();
      if (!contact) {
        throw new Error("Missing test contact");
      }
      await ctx.db.patch(contact._id, { deleteAfter: 0 });
    });

    await expect(test.mutation(internal.newsletter.purgeExpired)).resolves.toBe(
      1,
    );

    const snapshot = await readSnapshot(test);
    expect(snapshot).toMatchObject({
      contacts: [],
      events: [],
      preferences: [],
    });
  });
});

async function readSnapshot(test: ReturnType<typeof initTest>) {
  return test.run(async (ctx) => ({
    contacts: await ctx.db.query("emailContacts").take(100),
    events: await ctx.db.query("emailConsentEvents").take(100),
    preferences: await ctx.db.query("emailPreferences").take(100),
  }));
}
