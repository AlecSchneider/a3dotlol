import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 64;

export const subscribe = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ status: v.literal("created") }),
    v.object({ status: v.literal("duplicate") }),
  ),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const source = (args.source ?? "homepage").trim();

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      throw new ConvexError("Enter a valid email address.");
    }

    if (source.length === 0 || source.length > MAX_SOURCE_LENGTH) {
      throw new ConvexError("Invalid signup source.");
    }

    const existing = await ctx.db
      .query("newsletterSignups")
      .withIndex("by_email", (query) => query.eq("email", email))
      .unique();

    if (existing) {
      return { status: "duplicate" as const };
    }

    await ctx.db.insert("newsletterSignups", {
      createdAt: Date.now(),
      email,
      source,
    });

    return { status: "created" as const };
  },
});
