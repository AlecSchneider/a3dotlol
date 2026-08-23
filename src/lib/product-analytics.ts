"use client";

import type { BeforeSendFn, PostHog, Properties } from "posthog-js";

const POSTHOG_API_HOST = "https://eu.i.posthog.com";
const POSTHOG_UI_HOST = "https://eu.posthog.com";
const POSTHOG_APP_NAME = "a3dotlol";

type AnalyticsPlacement = "content" | "footer" | "hero" | "navigation";
type PrimaryCtaKey = "challenge_details" | "youtube_live";

type ProductEventMap = {
  $pageview: {
    $current_url: string;
    path: string;
  };
  "analytics consent accepted": Record<string, never>;
  "contact form failed": {
    form_name: "contact" | "support";
    reason: "submission_failed";
  };
  "contact form started": {
    form_name: "contact" | "support";
  };
  "contact form submitted": {
    form_name: "contact" | "support";
  };
  email_signup_failed: {
    failure_stage: "backend" | "client_validation" | "withdrawal_backend";
    product_key: string;
  };
  email_signup_opened: {
    product_key: string;
  };
  email_signup_submitted: {
    product_key: string;
    product_updates: boolean;
    publisher_promotions: boolean;
  };
  email_signup_succeeded: {
    product_key: string;
    product_updates: boolean;
    publisher_promotions: boolean;
  };
  email_signup_withdrawn: {
    product_key: string;
  };
  "navigation link clicked": {
    destination_host?: string;
    destination_path?: string;
    destination_type: "email" | "external" | "internal" | "phone";
    placement: AnalyticsPlacement;
  };
  "primary call to action clicked": {
    cta_key: PrimaryCtaKey;
    placement: AnalyticsPlacement;
  };
};

type ProductEventName = keyof ProductEventMap;

const EVENT_PROPERTY_ALLOWLIST: Record<ProductEventName, readonly string[]> = {
  $pageview: ["$current_url", "path"],
  "analytics consent accepted": [],
  "contact form failed": ["form_name", "reason"],
  "contact form started": ["form_name"],
  "contact form submitted": ["form_name"],
  email_signup_failed: ["failure_stage", "product_key"],
  email_signup_opened: ["product_key"],
  email_signup_submitted: [
    "product_key",
    "product_updates",
    "publisher_promotions",
  ],
  email_signup_succeeded: [
    "product_key",
    "product_updates",
    "publisher_promotions",
  ],
  email_signup_withdrawn: ["product_key"],
  "navigation link clicked": [
    "destination_host",
    "destination_path",
    "destination_type",
    "placement",
  ],
  "primary call to action clicked": ["cta_key", "placement"],
};

// PostHog needs these fields to ingest anonymous events and join page views
// into sessions. All other SDK-added browser, campaign, and URL properties are
// removed by before_send so the final payload matches the privacy notice.
const POSTHOG_INGESTION_PROPERTY_ALLOWLIST = new Set([
  "$device_id",
  "$insert_id",
  "$lib",
  "$lib_version",
  "$session_id",
  "$time",
  "$window_id",
  "distinct_id",
  "token",
]);

// The posthog-js SDK is only downloaded after a visitor accepts analytics.
// Until then this module stays inert and the vendor chunk is never fetched.
let posthogPromise: Promise<PostHog> | null = null;
let posthogInstance: PostHog | null = null;
let analyticsDesired = false;
let initialized = false;

async function loadPostHog() {
  posthogPromise ??= import("posthog-js")
    .then((module) => {
      posthogInstance = module.default;
      return module.default;
    })
    .catch((error: unknown) => {
      posthogPromise = null;
      throw error;
    });

  return posthogPromise;
}

export async function enableProductAnalytics() {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!projectToken) {
    analyticsDesired = false;
    return false;
  }

  analyticsDesired = true;

  try {
    const posthog = await loadPostHog();

    if (!analyticsDesired) {
      return false;
    }

    if (!initialized) {
      posthog.init(projectToken, {
        api_host: POSTHOG_API_HOST,
        ui_host: POSTHOG_UI_HOST,
        advanced_disable_flags: true,
        autocapture: false,
        before_send: sanitizePostHogEvent,
        capture_pageleave: false,
        capture_pageview: false,
        disable_capture_url_hashes: true,
        disable_product_tours: true,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        persistence: "localStorage",
        person_profiles: "never",
        save_campaign_params: false,
        save_referrer: false,
      });
      initialized = true;
    }

    if (!analyticsDesired) {
      posthog.opt_out_capturing();
      return false;
    }

    if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing({ captureEventName: false });
    }

    return true;
  } catch {
    // A blocked or failed analytics chunk must never break the page.
    return false;
  }
}

export function disableProductAnalytics() {
  analyticsDesired = false;

  if (posthogInstance && initialized) {
    try {
      posthogInstance.opt_out_capturing();
    } catch {
      // Analytics failures must not affect consent controls or the page.
    }
    return;
  }

  if (posthogPromise) {
    void posthogPromise
      .then((posthog) => {
        if (initialized) {
          posthog.opt_out_capturing();
        }
      })
      .catch(() => {
        // The visitor is already opted out in local state.
      });
  }
}

export function captureProductEvent<Event extends ProductEventName>(
  eventName: Event,
  properties: ProductEventMap[Event] = {} as ProductEventMap[Event],
) {
  try {
    if (
      !analyticsDesired ||
      !initialized ||
      !posthogInstance ||
      posthogInstance.has_opted_out_capturing()
    ) {
      return;
    }

    posthogInstance.capture(eventName, {
      ...pickAllowedProperties(eventName, properties),
      app_name: POSTHOG_APP_NAME,
      surface: "web",
    });
  } catch {
    // Analytics must never break the page, e.g. when the vendor chunk
    // cannot be fetched on a flaky connection.
  }
}

export function capturePageView(pathname: string) {
  captureProductEvent("$pageview", {
    $current_url: normalizePathname(pathname),
    path: normalizePathname(pathname),
  });
}

export function captureNavigationClick(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#")) {
    return;
  }

  const placement = getAnalyticsPlacement(anchor);
  const ctaKey = getPrimaryCtaKey(anchor.dataset.analyticsCta);

  if (ctaKey) {
    captureProductEvent("primary call to action clicked", {
      cta_key: ctaKey,
      placement,
    });
  }

  if (href.startsWith("mailto:")) {
    captureProductEvent("navigation link clicked", {
      destination_type: "email",
      placement,
    });
    return;
  }

  if (href.startsWith("tel:")) {
    captureProductEvent("navigation link clicked", {
      destination_type: "phone",
      placement,
    });
    return;
  }

  try {
    const url = new URL(href, window.location.origin);

    if (url.origin === window.location.origin) {
      captureProductEvent("navigation link clicked", {
        destination_path: normalizePathname(url.pathname),
        destination_type: "internal",
        placement,
      });
      return;
    }

    captureProductEvent("navigation link clicked", {
      destination_host: url.hostname,
      destination_type: "external",
      placement,
    });
  } catch {
    // Ignore malformed links instead of sending their raw value.
  }
}

const sanitizePostHogEvent: BeforeSendFn = (captureResult) => {
  if (!captureResult) {
    return null;
  }

  if (!Object.hasOwn(EVENT_PROPERTY_ALLOWLIST, captureResult.event)) {
    return null;
  }

  const eventName = captureResult.event as ProductEventName;
  const eventPropertyAllowlist = new Set(EVENT_PROPERTY_ALLOWLIST[eventName]);
  const properties = Object.fromEntries(
    Object.entries(captureResult.properties).flatMap(([key, value]) => {
      if (
        !POSTHOG_INGESTION_PROPERTY_ALLOWLIST.has(key) &&
        !eventPropertyAllowlist.has(key) &&
        key !== "app_name" &&
        key !== "surface"
      ) {
        return [];
      }

      if (key === "$current_url") {
        const sanitizedValue = sanitizeUrlProperty(value);
        return sanitizedValue === undefined ? [] : [[key, sanitizedValue]];
      }

      return value === undefined ? [] : [[key, value]];
    }),
  );

  return {
    event: captureResult.event,
    properties,
    timestamp: captureResult.timestamp,
    uuid: captureResult.uuid,
  };
};

function sanitizeUrlProperty(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin
      ? normalizePathname(url.pathname)
      : url.origin;
  } catch {
    return undefined;
  }
}

function normalizePathname(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function getAnalyticsPlacement(anchor: HTMLAnchorElement): AnalyticsPlacement {
  const configuredPlacement = anchor.dataset.analyticsPlacement;

  if (
    configuredPlacement === "content" ||
    configuredPlacement === "footer" ||
    configuredPlacement === "hero" ||
    configuredPlacement === "navigation"
  ) {
    return configuredPlacement;
  }

  if (anchor.closest("footer")) {
    return "footer";
  }

  return anchor.closest("header, nav") ? "navigation" : "content";
}

function getPrimaryCtaKey(value: string | undefined): PrimaryCtaKey | null {
  return value === "challenge_details" || value === "youtube_live"
    ? value
    : null;
}

function pickAllowedProperties<Event extends ProductEventName>(
  eventName: Event,
  properties: ProductEventMap[Event],
) {
  const allowedProperties = new Set(EVENT_PROPERTY_ALLOWLIST[eventName]);

  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) => allowedProperties.has(key) && value !== undefined,
    ),
  ) as Properties;
}
