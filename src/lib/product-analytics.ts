"use client";

import posthog, { type BeforeSendFn, type Properties } from "posthog-js";

import { env } from "~/env";

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

let initialized = false;

export function enableProductAnalytics() {
  const projectToken = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!projectToken) {
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
      disable_product_tours: true,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      opt_out_capturing_by_default: true,
      opt_out_persistence_by_default: true,
      persistence: "localStorage",
      person_profiles: "never",
    });
    initialized = true;
  }

  if (posthog.has_opted_out_capturing()) {
    posthog.opt_in_capturing({ captureEventName: false });
  }

  return true;
}

export function disableProductAnalytics() {
  if (initialized) {
    posthog.opt_out_capturing();
  }
}

export function captureProductEvent<Event extends ProductEventName>(
  eventName: Event,
  properties: ProductEventMap[Event] = {} as ProductEventMap[Event],
) {
  if (!initialized || posthog.has_opted_out_capturing()) {
    return;
  }

  posthog.capture(eventName, {
    ...pickAllowedProperties(eventName, properties),
    app_name: POSTHOG_APP_NAME,
    surface: "web",
  });
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

  return {
    ...captureResult,
    properties: {
      ...captureResult.properties,
      $current_url: sanitizeUrlProperty(captureResult.properties.$current_url),
      $referrer: sanitizeUrlProperty(captureResult.properties.$referrer),
    },
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
