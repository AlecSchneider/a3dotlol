import { DAY, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { v } from "convex/values";

import { components, internal } from "../_generated/api";
import { internalMutation, type MutationCtx } from "../_generated/server";

const BURST_RATE = 10;
const burst = {
  kind: "fixed window",
  period: MINUTE,
  rate: BURST_RATE,
  start: 0,
} as const;
const quotaNames = {
  contact: ["contactBurst", "contactDaily"],
  signup: ["emailSignupBurst", "emailSignupDaily"],
  withdrawal: ["emailWithdrawalBurst", "emailWithdrawalDaily"],
} as const;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  contactBurst: burst,
  contactDaily: { kind: "fixed window", period: DAY, rate: 200 },
  emailSignupBurst: burst,
  emailSignupDaily: { kind: "fixed window", period: DAY, rate: 500 },
  emailWithdrawalBurst: burst,
  emailWithdrawalDaily: { kind: "fixed window", period: DAY, rate: 1_000 },
});

// Only call from a mutation: reads, both debits and cleanup scheduling must
// share one transaction, including when an action later fails or is rejected.
export async function consumeEmailQuota(
  ctx: MutationCtx,
  kind: keyof typeof quotaNames,
  key: string,
): Promise<boolean> {
  const [burstName, dailyName] = quotaNames[kind];
  if (
    !(await passesLayeredRateLimits(
      () => rateLimiter.check(ctx, burstName, { key }),
      () => rateLimiter.check(ctx, dailyName),
    ))
  )
    return false;

  await rateLimiter.limit(ctx, burstName, { key, throws: true });
  await rateLimiter.limit(ctx, dailyName, { throws: true });
  const bucket = await rateLimiter.getValue(ctx, burstName, { key });
  // One job per keyed window. All burst limits are unsharded and consume one
  // token; the first accepted use has exactly capacity - 1 tokens remaining.
  if (bucket.value === BURST_RATE - 1) {
    await ctx.scheduler.runAt(
      bucket.ts + MINUTE,
      internal.lib.rateLimits.expireEmailQuota,
      {
        name: burstName,
        key,
      },
    );
  }
  return true;
}

export const expireEmailQuota = internalMutation({
  args: {
    name: v.union(
      v.literal("contactBurst"),
      v.literal("emailSignupBurst"),
      v.literal("emailWithdrawalBurst"),
    ),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { name, key }): Promise<null> => {
    const bucket = await rateLimiter.getValue(ctx, name, { key });
    // A delayed job must never clear a newer, still-active window. Explicit
    // epoch-aligned windows retain their cadence after deletion/recreation.
    if (bucket.ts + MINUTE <= Date.now()) {
      await rateLimiter.reset(ctx, name, { key });
    }
    return null;
  },
});

type LimitResult = { ok: boolean };

export async function passesLayeredRateLimits(
  checkBurst: () => Promise<LimitResult>,
  checkDaily: () => Promise<LimitResult>,
) {
  const burst = await checkBurst();

  if (!burst.ok) {
    return false;
  }

  return (await checkDaily()).ok;
}
