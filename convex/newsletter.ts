import { DAY, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";

import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from "./_generated/server";
import { passesLayeredRateLimits } from "./lib/rateLimits";

const CONSENT_VERSION = "2026-08-20";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const MAX_CONSENT_VERSION_LENGTH = 64;
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCALE_LENGTH = 35;
const PRODUCT_KEY = "a3dotlol";
const PUBLISHER_KEY = "alec-schneider-solutions";
const RETENTION_MS = 365 * DAY;

const rateLimiter = new RateLimiter(components.rateLimiter, {
  emailSignupBurst: {
    kind: "fixed window",
    period: MINUTE,
    rate: 10,
  },
  emailSignupDaily: {
    kind: "fixed window",
    period: DAY,
    rate: 500,
  },
  emailWithdrawalBurst: {
    kind: "fixed window",
    period: MINUTE,
    rate: 10,
  },
  emailWithdrawalDaily: {
    kind: "fixed window",
    period: DAY,
    rate: 1_000,
  },
});

const commonArgs = {
  consentVersion: v.literal(CONSENT_VERSION),
  email: v.string(),
  locale: v.optional(v.string()),
  productKey: v.literal(PRODUCT_KEY),
  publisherKey: v.literal(PUBLISHER_KEY),
  source: v.literal("homepage"),
};

const withdrawArgs = {
  ...commonArgs,
  // Withdrawal must keep working for an already-open client after consent copy
  // changes. The submitted version is deliberately ignored and never stored.
  consentVersion: v.string(),
};

type Purpose = "product_updates" | "publisher_promotions";
type PurposeAction = "granted" | "withdrawn";

export const subscribe = mutation({
  args: {
    ...commonArgs,
    productUpdates: v.boolean(),
    publisherPromotions: v.boolean(),
  },
  returns: v.object({ status: v.literal("saved") }),
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const locale = normalizeLocale(args.locale);

    if (!args.productUpdates && !args.publisherPromotions) {
      throw new ConvexError("Choose at least one email purpose.");
    }

    await enforceSubscribeRateLimits(ctx, normalizedEmail);

    const now = Date.now();
    const contact = await findOrCreateContact(ctx, normalizedEmail, now);
    const existingPreference = await ctx.db
      .query("emailPreferences")
      .withIndex("by_contact_and_product_key", (query) =>
        query.eq("contactId", contact._id).eq("productKey", PRODUCT_KEY),
      )
      .unique();

    if (!existingPreference) {
      const preferenceId = await ctx.db.insert("emailPreferences", {
        consentVersion: CONSENT_VERSION,
        contactId: contact._id,
        locale,
        productKey: PRODUCT_KEY,
        publisherKey: PUBLISHER_KEY,
        productUpdates: args.productUpdates,
        ...(args.productUpdates ? { productUpdatesGrantedAt: now } : {}),
        publisherPromotions: args.publisherPromotions,
        ...(args.publisherPromotions
          ? { publisherPromotionsGrantedAt: now }
          : {}),
        source: args.source,
        updatedAt: now,
      });

      if (args.productUpdates) {
        await recordConsentEvent(ctx, {
          action: "granted",
          contactId: contact._id,
          locale,
          preferenceId,
          purpose: "product_updates",
          source: args.source,
        });
      }

      if (args.publisherPromotions) {
        await recordConsentEvent(ctx, {
          action: "granted",
          contactId: contact._id,
          locale,
          preferenceId,
          purpose: "publisher_promotions",
          source: args.source,
        });
      }
    } else {
      const productUpdatesChanged =
        existingPreference.productUpdates !== args.productUpdates;
      const publisherPromotionsChanged =
        existingPreference.publisherPromotions !== args.publisherPromotions;

      await ctx.db.patch(existingPreference._id, {
        consentVersion: CONSENT_VERSION,
        locale,
        productUpdates: args.productUpdates,
        publisherKey: PUBLISHER_KEY,
        ...(productUpdatesChanged && args.productUpdates
          ? { productUpdatesGrantedAt: now }
          : {}),
        ...(productUpdatesChanged && !args.productUpdates
          ? { productUpdatesWithdrawnAt: now }
          : {}),
        publisherPromotions: args.publisherPromotions,
        ...(publisherPromotionsChanged && args.publisherPromotions
          ? { publisherPromotionsGrantedAt: now }
          : {}),
        ...(publisherPromotionsChanged && !args.publisherPromotions
          ? { publisherPromotionsWithdrawnAt: now }
          : {}),
        source: args.source,
        updatedAt: now,
      });

      if (productUpdatesChanged) {
        await recordConsentEvent(ctx, {
          action: args.productUpdates ? "granted" : "withdrawn",
          contactId: contact._id,
          locale,
          preferenceId: existingPreference._id,
          purpose: "product_updates",
          source: args.source,
        });
      }

      if (publisherPromotionsChanged) {
        await recordConsentEvent(ctx, {
          action: args.publisherPromotions ? "granted" : "withdrawn",
          contactId: contact._id,
          locale,
          preferenceId: existingPreference._id,
          purpose: "publisher_promotions",
          source: args.source,
        });
      }
    }

    await ctx.db.patch(contact._id, {
      deleteAfter: now + RETENTION_MS,
      updatedAt: now,
    });

    return { status: "saved" as const };
  },
});

export const withdraw = mutation({
  args: withdrawArgs,
  returns: v.object({ status: v.literal("withdrawn") }),
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const locale = normalizeLocale(args.locale);

    if (args.consentVersion.length > MAX_CONSENT_VERSION_LENGTH) {
      throw new ConvexError("Consent version is invalid.");
    }

    await enforceWithdrawalRateLimits(ctx, normalizedEmail);

    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_normalized_email", (query) =>
        query.eq("normalizedEmail", normalizedEmail),
      )
      .unique();

    if (!contact) {
      return { status: "withdrawn" as const };
    }

    const preference = await ctx.db
      .query("emailPreferences")
      .withIndex("by_contact_and_product_key", (query) =>
        query.eq("contactId", contact._id).eq("productKey", PRODUCT_KEY),
      )
      .unique();

    if (!preference) {
      return { status: "withdrawn" as const };
    }

    const now = Date.now();

    await ctx.db.patch(preference._id, {
      consentVersion: CONSENT_VERSION,
      locale,
      productUpdates: false,
      publisherKey: PUBLISHER_KEY,
      ...(preference.productUpdates ? { productUpdatesWithdrawnAt: now } : {}),
      publisherPromotions: false,
      ...(preference.publisherPromotions
        ? { publisherPromotionsWithdrawnAt: now }
        : {}),
      source: args.source,
      updatedAt: now,
    });

    if (preference.productUpdates) {
      await recordConsentEvent(ctx, {
        action: "withdrawn",
        contactId: contact._id,
        locale,
        preferenceId: preference._id,
        purpose: "product_updates",
        source: args.source,
      });
    }

    if (preference.publisherPromotions) {
      await recordConsentEvent(ctx, {
        action: "withdrawn",
        contactId: contact._id,
        locale,
        preferenceId: preference._id,
        purpose: "publisher_promotions",
        source: args.source,
      });
    }

    await ctx.db.patch(contact._id, {
      deleteAfter: now + RETENTION_MS,
      updatedAt: now,
    });

    return { status: "withdrawn" as const };
  },
});

export const purgeExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const expiredContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_delete_after", (query) => query.lte("deleteAfter", now))
      .take(25);

    for (const contact of expiredContacts) {
      await deleteContactData(ctx, contact._id);
    }

    return expiredContacts.length;
  },
});

function normalizeEmail(value: string) {
  const normalized = value.trim().toLowerCase();

  if (
    normalized.length === 0 ||
    normalized.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalized)
  ) {
    throw new ConvexError("Enter a valid email address.");
  }

  return normalized;
}

function normalizeLocale(value: string | undefined) {
  const locale = value?.trim();

  if (!locale) {
    return "und";
  }

  if (locale.length > MAX_LOCALE_LENGTH || !LOCALE_PATTERN.test(locale)) {
    throw new ConvexError("The locale is invalid.");
  }

  return locale;
}

async function enforceSubscribeRateLimits(
  ctx: MutationCtx,
  normalizedEmail: string,
) {
  const withinRateLimits = await passesLayeredRateLimits(
    () => rateLimiter.limit(ctx, "emailSignupBurst", { key: normalizedEmail }),
    () => rateLimiter.limit(ctx, "emailSignupDaily"),
  );

  if (!withinRateLimits) {
    throw new ConvexError("Too many requests. Please wait and try again.");
  }
}

async function enforceWithdrawalRateLimits(
  ctx: MutationCtx,
  normalizedEmail: string,
) {
  const withinRateLimits = await passesLayeredRateLimits(
    () =>
      rateLimiter.limit(ctx, "emailWithdrawalBurst", {
        key: normalizedEmail,
      }),
    () => rateLimiter.limit(ctx, "emailWithdrawalDaily"),
  );

  if (!withinRateLimits) {
    throw new ConvexError("Too many requests. Please wait and try again.");
  }
}

async function findOrCreateContact(
  ctx: MutationCtx,
  normalizedEmail: string,
  now: number,
) {
  const existing = await ctx.db
    .query("emailContacts")
    .withIndex("by_normalized_email", (query) =>
      query.eq("normalizedEmail", normalizedEmail),
    )
    .unique();

  if (existing) {
    return existing;
  }

  const contactId = await ctx.db.insert("emailContacts", {
    createdAt: now,
    deleteAfter: now + RETENTION_MS,
    normalizedEmail,
    status: "unverified",
    updatedAt: now,
  });

  const contact = await ctx.db.get(contactId);
  if (!contact) {
    throw new Error("The email contact could not be created.");
  }

  return contact;
}

async function recordConsentEvent(
  ctx: MutationCtx,
  args: {
    action: PurposeAction;
    contactId: Id<"emailContacts">;
    locale: string;
    preferenceId: Id<"emailPreferences">;
    purpose: Purpose;
    source: "homepage";
  },
) {
  await ctx.db.insert("emailConsentEvents", {
    action: args.action,
    consentVersion: CONSENT_VERSION,
    contactId: args.contactId,
    locale: args.locale,
    occurredAt: Date.now(),
    preferenceId: args.preferenceId,
    productKey: PRODUCT_KEY,
    publisherKey: PUBLISHER_KEY,
    purpose: args.purpose,
    source: args.source,
  });
}

async function deleteContactData(
  ctx: MutationCtx,
  contactId: Id<"emailContacts">,
) {
  const events = await ctx.db
    .query("emailConsentEvents")
    .withIndex("by_contact", (query) => query.eq("contactId", contactId))
    .take(100);
  const preferences = await ctx.db
    .query("emailPreferences")
    .withIndex("by_contact_and_product_key", (query) =>
      query.eq("contactId", contactId),
    )
    .take(25);

  for (const event of events) {
    await ctx.db.delete(event._id);
  }
  for (const preference of preferences) {
    await ctx.db.delete(preference._id);
  }

  if (events.length === 100 || preferences.length === 25) {
    return false;
  }

  await ctx.db.delete(contactId);
  return true;
}
