import { DAY, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import { DateTime, Effect, Result } from "effect";

import { components, internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import {
  ContactFailure,
  DiscordContact,
  discordContactLayer,
  submitContact,
} from "./lib/contactWorkflow";
import { passesLayeredRateLimits } from "./lib/rateLimits";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  contactBurst: {
    kind: "fixed window",
    period: MINUTE,
    rate: 10,
  },
  contactDaily: {
    kind: "fixed window",
    period: DAY,
    rate: 200,
  },
});

let cachedWebhookUrl: URL | null = null;

const contactDeliveryValidator = v.object({
  _id: v.id("contactDeliveries"),
  deleteAfter: v.number(),
  messageId: v.string(),
});

export const submit = action({
  args: {
    email: v.string(),
    message: v.string(),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  returns: v.object({ status: v.literal("sent") }),
  handler: (ctx, args): Promise<{ status: "sent" }> =>
    runContact(
      submitContact(args, {
        withinRateLimits: (email) =>
          passesLayeredRateLimits(
            () => rateLimiter.limit(ctx, "contactBurst", { key: email }),
            () => rateLimiter.limit(ctx, "contactDaily"),
          ),
        record: (messageId, deleteAfter) =>
          ctx.runMutation(internal.contact.recordDelivery, {
            messageId,
            deleteAfter,
          }),
      }),
    ),
});

export const recordDelivery = internalMutation({
  args: {
    deleteAfter: v.number(),
    messageId: v.string(),
  },
  returns: v.id("contactDeliveries"),
  handler: async (ctx, args) => {
    return ctx.db.insert("contactDeliveries", args);
  },
});

export const listExpiredDeliveries = internalQuery({
  args: { now: v.number() },
  returns: v.array(contactDeliveryValidator),
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("contactDeliveries")
      .withIndex("by_delete_after", (query) =>
        query.lte("deleteAfter", args.now),
      )
      .take(25);

    return deliveries.map(({ _id, deleteAfter, messageId }) => ({
      _id,
      deleteAfter,
      messageId,
    }));
  },
});

export const removeDeliveryRecord = internalMutation({
  args: { deliveryId: v.id("contactDeliveries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.deliveryId);
    return null;
  },
});

export const purgeExpiredDeliveries = internalAction({
  args: {},
  returns: v.null(),
  handler: (ctx): Promise<null> =>
    runContact(
      Effect.gen(function* () {
        // Preserve fail-fast configuration validation before reading the batch.
        yield* Effect.try({
          try: getWebhookUrl,
          catch: () => new ContactFailure({ reason: "configuration" }),
        });
        const discord = yield* DiscordContact;
        const now = yield* DateTime.now;
        const deliveries = yield* Effect.tryPromise({
          try: () =>
            ctx.runQuery(internal.contact.listExpiredDeliveries, {
              now: DateTime.toEpochMillis(now),
            }),
          catch: () => new ContactFailure({ reason: "persistence" }),
        });
        for (const delivery of deliveries) {
          yield* discord.remove(delivery.messageId).pipe(
            Effect.flatMap((removed) =>
              removed
                ? Effect.tryPromise({
                    try: () =>
                      ctx.runMutation(internal.contact.removeDeliveryRecord, {
                        deliveryId: delivery._id,
                      }),
                    catch: () => new ContactFailure({ reason: "persistence" }),
                  })
                : Effect.void,
            ),
            // Keep failed records for the next scheduled run, without retrying now.
            Effect.catch(() => Effect.void),
          );
        }
        return null;
      }),
    ),
});

async function runContact<A>(
  program: Effect.Effect<A, ContactFailure, DiscordContact>,
) {
  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(discordContactLayer(getWebhookUrl)),
      Effect.withTracerEnabled(false),
      Effect.result,
    ),
  );
  if (Result.isSuccess(result)) return result.success;
  // Keep public validation/status messages; never expose Schema/HTTP causes.
  switch (result.failure.reason) {
    case "email":
      throw new ConvexError("Enter a valid email address.");
    case "fields":
      throw new ConvexError("One or more fields are too long.");
    case "message":
      throw new ConvexError(
        "Enter a message of no more than 2,000 characters.",
      );
    case "quota":
      throw new ConvexError(
        "Too many contact requests. Please wait and try again.",
      );
    case "unavailable":
      throw new ConvexError(
        "The contact service is temporarily unavailable. Please email alec@a3.lol.",
      );
    default:
      throw new Error("Contact processing failed.");
  }
}

function getWebhookUrl() {
  cachedWebhookUrl ??= parseDiscordWebhookUrl(
    process.env.CONTACT_DISCORD_WEBHOOK,
  );

  return cachedWebhookUrl.toString();
}

function parseDiscordWebhookUrl(raw: string | undefined) {
  if (!raw) {
    throw new Error("Contact webhook is not configured.");
  }

  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "discord.com" ||
    !url.pathname.startsWith("/api/webhooks/")
  ) {
    throw new Error("Contact webhook configuration is invalid.");
  }

  return url;
}
