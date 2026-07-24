import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contactDeliveries: defineTable({
    deleteAfter: v.number(),
    messageId: v.string(),
  }).index("by_delete_after", ["deleteAfter"]),
  newsletterSignups: defineTable({
    createdAt: v.number(),
    email: v.string(),
    source: v.string(),
  }).index("by_email", ["email"]),
});
