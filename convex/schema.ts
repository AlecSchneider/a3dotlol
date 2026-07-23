import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  newsletterSignups: defineTable({
    createdAt: v.number(),
    email: v.string(),
    source: v.string(),
  }).index("by_email", ["email"]),
});
