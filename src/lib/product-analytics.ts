"use client";

import posthog, {
  type BeforeSendFn,
  type EventName,
  type Properties,
} from "posthog-js";

import { env } from "~/env";

const POSTHOG_API_HOST = "https://eu.i.posthog.com";
const POSTHOG_UI_HOST = "https://eu.posthog.com";

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

export function captureProductEvent(
  eventName: EventName,
  properties: Properties = {},
) {
  if (!initialized || posthog.has_opted_out_capturing()) {
    return;
  }

  posthog.capture(eventName, {
    ...properties,
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

  const placement =
    anchor.dataset.analyticsPlacement ??
    (anchor.closest("footer")
      ? "footer"
      : anchor.closest("header, nav")
        ? "navigation"
        : "content");

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
