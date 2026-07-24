import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";

export const subscribe = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ status: v.literal("created") }),
    v.object({ status: v.literal("duplicate") }),
  ),
  handler: () => {
    throw new ConvexError(
      "Newsletter registrations are paused while double opt-in is being implemented.",
    );
  },
});
