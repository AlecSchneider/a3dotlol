import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contactDeliveries: defineTable({
    deleteAfter: v.number(),
    messageId: v.string(),
  }).index("by_delete_after", ["deleteAfter"]),
  emailContacts: defineTable({
    createdAt: v.number(),
    deleteAfter: v.number(),
    normalizedEmail: v.string(),
    status: v.literal("unverified"),
    updatedAt: v.number(),
  })
    .index("by_normalized_email", ["normalizedEmail"])
    .index("by_delete_after", ["deleteAfter"]),
  emailPreferences: defineTable({
    consentVersion: v.string(),
    contactId: v.id("emailContacts"),
    locale: v.string(),
    productKey: v.string(),
    publisherKey: v.string(),
    productUpdates: v.boolean(),
    productUpdatesGrantedAt: v.optional(v.number()),
    productUpdatesWithdrawnAt: v.optional(v.number()),
    publisherPromotions: v.boolean(),
    publisherPromotionsGrantedAt: v.optional(v.number()),
    publisherPromotionsWithdrawnAt: v.optional(v.number()),
    source: v.string(),
    updatedAt: v.number(),
  }).index("by_contact_and_product_key", ["contactId", "productKey"]),
  emailConsentEvents: defineTable({
    action: v.union(v.literal("granted"), v.literal("withdrawn")),
    consentVersion: v.string(),
    contactId: v.id("emailContacts"),
    locale: v.string(),
    occurredAt: v.number(),
    preferenceId: v.id("emailPreferences"),
    productKey: v.string(),
    publisherKey: v.string(),
    purpose: v.union(
      v.literal("product_updates"),
      v.literal("publisher_promotions"),
    ),
    source: v.string(),
  }).index("by_contact", ["contactId"]),
  newsletterSignups: defineTable({
    createdAt: v.number(),
    email: v.string(),
    source: v.string(),
  }).index("by_email", ["email"]),
});
