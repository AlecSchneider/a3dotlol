import { DAY, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";

import { components, internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { recordDiscordDelivery } from "./lib/contactDelivery";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_NAME_LENGTH = 100;
const MAX_SUBJECT_LENGTH = 120;
const RETENTION_MS = 90 * DAY;
const WEBHOOK_TIMEOUT_MS = 8_000;

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
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const message = args.message.trim();
    const name = args.name?.trim() ?? "";
    const subject = args.subject?.trim() ?? "";

    // Bots commonly fill visually hidden fields. Return the normal success
    // shape without sending or retaining their payload.
    if ((args.website ?? "").trim() !== "") {
      return { status: "sent" as const };
    }

    validateContactInput({ email, message, name, subject });

    const burstLimit = await rateLimiter.limit(ctx, "contactBurst");
    const dailyLimit = await rateLimiter.limit(ctx, "contactDaily");

    if (!burstLimit.ok || !dailyLimit.ok) {
      throw new ConvexError(
        "Too many contact requests. Please wait and try again.",
      );
    }

    const webhookUrl = getWebhookUrl();
    const deliveryUrl = new URL(webhookUrl);
    deliveryUrl.searchParams.set("wait", "true");

    const sentAt = Date.now();
    const response = await fetch(deliveryUrl, {
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            color: 0x22d3ee,
            description: message,
            fields: [
              {
                inline: true,
                name: "Reply email",
                value: email,
              },
              {
                inline: true,
                name: "Name",
                value: name || "Not provided",
              },
              {
                inline: false,
                name: "Subject",
                value: subject || "General contact",
              },
            ],
            footer: {
              text: "a3.lol contact form · automatic deletion after 90 days",
            },
            timestamp: new Date(sentAt).toISOString(),
            title: "New a3.lol contact request",
          },
        ],
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ConvexError(
        "The contact service is temporarily unavailable. Please email alec@a3.lol.",
      );
    }

    const responseBody: unknown = await response.json();
    const messageId = readDiscordMessageId(responseBody);

    await recordDiscordDelivery({
      record: () =>
        ctx.runMutation(internal.contact.recordDelivery, {
          deleteAfter: sentAt + RETENTION_MS,
          messageId,
        }),
      remove: () => deleteDiscordMessage(webhookUrl, messageId),
    });

    return { status: "sent" as const };
  },
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
  handler: async (ctx) => {
    const webhookUrl = getWebhookUrl();
    const deliveries = await ctx.runQuery(
      internal.contact.listExpiredDeliveries,
      { now: Date.now() },
    );

    for (const delivery of deliveries) {
      try {
        const response = await deleteDiscordMessage(
          webhookUrl,
          delivery.messageId,
        );

        if (response.ok || response.status === 404) {
          await ctx.runMutation(internal.contact.removeDeliveryRecord, {
            deliveryId: delivery._id,
          });
        }
      } catch {
        // A later daily run retries transient Discord or network failures.
      }
    }

    return null;
  },
});

function deleteDiscordMessage(webhookUrl: string, messageId: string) {
  const deletionUrl = new URL(webhookUrl);
  deletionUrl.search = "";
  deletionUrl.pathname = `${deletionUrl.pathname.replace(/\/$/, "")}/messages/${encodeURIComponent(messageId)}`;

  return fetch(deletionUrl, {
    method: "DELETE",
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
}

function getWebhookUrl() {
  const value = process.env.CONTACT_DISCORD_WEBHOOK;

  if (!value) {
    throw new Error("Contact webhook is not configured.");
  }

  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "discord.com" ||
    !url.pathname.startsWith("/api/webhooks/")
  ) {
    throw new Error("Contact webhook configuration is invalid.");
  }

  return url.toString();
}

function readDiscordMessageId(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    value.id.length === 0
  ) {
    throw new Error("Discord did not return a message identifier.");
  }

  return value.id;
}

function validateContactInput(input: {
  email: string;
  message: string;
  name: string;
  subject: string;
}) {
  if (
    input.email.length === 0 ||
    input.email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(input.email)
  ) {
    throw new ConvexError("Enter a valid email address.");
  }

  if (
    input.name.length > MAX_NAME_LENGTH ||
    input.subject.length > MAX_SUBJECT_LENGTH
  ) {
    throw new ConvexError("One or more fields are too long.");
  }

  if (input.message.length === 0 || input.message.length > MAX_MESSAGE_LENGTH) {
    throw new ConvexError("Enter a message of no more than 2,000 characters.");
  }
}
