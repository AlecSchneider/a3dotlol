import { MINUTE } from "@convex-dev/rate-limiter";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { consumeEmailQuota, rateLimiter } from "./rateLimits";

const key = "synthetic@example.com";
const now = 1_800_000_030_000;
function setup() {
  const test = convexTest(schema, modules);
  rateLimiterTest.register(test);
  return test;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

describe("email quota retention", () => {
  it.each([
    ["contact", "contactBurst", "contactDaily", 200],
    ["signup", "emailSignupBurst", "emailSignupDaily", 500],
    ["withdrawal", "emailWithdrawalBurst", "emailWithdrawalDaily", 1000],
  ] as const)(
    "expires %s keys with one job per window, keeping global usage",
    async (kind, burst, daily, capacity) => {
      const test = setup();
      for (let i = 0; i < 2; i++) {
        expect(await test.run((ctx) => consumeEmailQuota(ctx, kind, key))).toBe(
          true,
        );
      }
      expect(
        await test.run((ctx) =>
          ctx.db.system.query("_scheduled_functions").collect(),
        ),
      ).toHaveLength(1);
      const bucket = await test.run((ctx) =>
        rateLimiter.getValue(ctx, burst, { key }),
      );
      expect(bucket.ts % MINUTE).toBe(0);
      await test.finishAllScheduledFunctions(() =>
        vi.advanceTimersByTime(2 * MINUTE),
      );
      expect(
        (await test.run((ctx) => rateLimiter.getValue(ctx, burst, { key }))).ts,
      ).toBe(0);
      expect(
        (await test.run((ctx) => rateLimiter.getValue(ctx, daily))).value,
      ).toBe(capacity - 2);

      await test.run((ctx) => consumeEmailQuota(ctx, kind, key));
      const recreated = await test.run((ctx) =>
        rateLimiter.getValue(ctx, burst, { key }),
      );
      expect(recreated.ts % MINUTE).toBe(0);
      await test.finishAllScheduledFunctions(() =>
        vi.advanceTimersByTime(2 * MINUTE),
      );
    },
  );

  it("does not let a delayed cleanup erase a newer active bucket", async () => {
    const test = setup();
    await test.run((ctx) => consumeEmailQuota(ctx, "contact", key));
    // Move the clock without running the first window's pending cleanup.
    vi.setSystemTime(now + MINUTE);
    await test.run((ctx) => consumeEmailQuota(ctx, "contact", key));
    await test.mutation(internal.lib.rateLimits.expireEmailQuota, {
      name: "contactBurst",
      key,
    });
    const active = await test.run((ctx) =>
      rateLimiter.getValue(ctx, "contactBurst", { key }),
    );
    expect(active.ts).toBeGreaterThan(now);
    expect(active.value).toBe(9);
    await test.finishAllScheduledFunctions(() =>
      vi.advanceTimersByTime(2 * MINUTE),
    );
  });

  it("does not debit the daily bucket or schedule work on burst denial", async () => {
    const test = setup();
    for (let i = 0; i < 10; i++)
      await test.run((ctx) => consumeEmailQuota(ctx, "contact", key));
    expect(
      await test.run((ctx) => consumeEmailQuota(ctx, "contact", key)),
    ).toBe(false);
    expect(
      (await test.run((ctx) => rateLimiter.getValue(ctx, "contactDaily")))
        .value,
    ).toBe(190);
    expect(
      await test.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(1);
    await test.finishAllScheduledFunctions(() =>
      vi.advanceTimersByTime(2 * MINUTE),
    );
  });
});
