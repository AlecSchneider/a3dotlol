"use client";

import type { BeforeSendFn, PostHog, PostHogConfig } from "posthog-js";

const POSTHOG_API_HOST = "https://eu.i.posthog.com";
const POSTHOG_UI_HOST = "https://eu.posthog.com";
const POSTHOG_APP_NAME = "a3dotlol";
const PRIVATE_ELEMENT_SELECTOR =
  "form, input, textarea, select, option, [contenteditable='true'], [data-private]";

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
  "$browser",
  "$browser_version",
  "$current_url",
  "$device_id",
  "$device_type",
  "$host",
  "$insert_id",
  "$language",
  "$lib",
  "$lib_version",
  "$os",
  "$os_version",
  "$pathname",
  "$referrer",
  "$referring_domain",
  "$screen_height",
  "$screen_width",
  "$session_entry_url",
  "$session_id",
  "$time",
  "$timezone",
  "$timezone_offset",
  "$viewport_height",
  "$viewport_width",
  "$window_id",
  "distinct_id",
  "token",
]);

const AUTOMATIC_EVENT_PROPERTY_ALLOWLIST: Record<string, readonly string[]> = {
  $$heatmap: ["$heatmap_data"],
  $autocapture: [
    "$ce_version",
    "$elements",
    "$elements_chain",
    "$event_type",
    "$external_click_url",
  ],
  $dead_click: ["$ce_version", "$elements", "$elements_chain", "$event_type"],
  $dead_swipe: [
    "$ce_version",
    "$dead_swipe_direction",
    "$dead_swipe_distance_px",
    "$elements",
    "$elements_chain",
    "$event_type",
  ],
  $exception: ["$exception_level", "$exception_list"],
  $pageleave: [
    "$prev_pageview_duration",
    "$prev_pageview_id",
    "$prev_pageview_last_content",
    "$prev_pageview_last_content_percentage",
    "$prev_pageview_last_scroll",
    "$prev_pageview_last_scroll_percentage",
    "$prev_pageview_max_content",
    "$prev_pageview_max_content_percentage",
    "$prev_pageview_max_scroll",
    "$prev_pageview_max_scroll_percentage",
    "$prev_pageview_pathname",
  ],
  $rageclick: ["$ce_version", "$elements", "$elements_chain", "$event_type"],
  $snapshot: ["$snapshot_bytes", "$snapshot_data", "$snapshot_host"],
  $web_vitals: [],
};

// Precomputed once at module load so capturing an event never rebuilds the
// allowlist Set.
const EVENT_PROPERTY_ALLOWLIST_SETS = Object.fromEntries(
  Object.entries({
    ...AUTOMATIC_EVENT_PROPERTY_ALLOWLIST,
    ...EVENT_PROPERTY_ALLOWLIST,
  }).map(([eventName, properties]) => [eventName, new Set(properties)]),
) as Record<string, ReadonlySet<string>>;

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
        defaults: "2026-06-25",
        autocapture: {
          capture_copied_text: false,
          css_selector_ignorelist: [
            ".ph-no-autocapture",
            ".ph-no-capture",
            "[data-ph-no-autocapture]",
            PRIVATE_ELEMENT_SELECTOR,
          ],
          dom_event_allowlist: ["click"],
          element_allowlist: ["a", "button"],
          element_attribute_ignorelist: ["aria-label", "id", "name", "value"],
        },
        before_send: sanitizePostHogEvent,
        capture_dead_clicks: {
          capture_dead_swipes: true,
          css_selector_ignorelist: [
            ".ph-no-capture",
            ".ph-no-deadclick",
            PRIVATE_ELEMENT_SELECTOR,
          ],
          element_attribute_ignorelist: ["aria-label", "id", "name", "value"],
        },
        capture_exceptions: {
          capture_console_errors: false,
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
        },
        capture_heatmaps: true,
        capture_pageleave: true,
        capture_pageview: false,
        capture_performance: {
          network_timing: false,
          web_vitals: true,
          web_vitals_attribution: false,
        },
        disable_capture_url_hashes: true,
        disable_product_tours: true,
        disable_session_recording: false,
        disable_surveys: true,
        disable_web_experiments: true,
        enable_recording_console_log: false,
        mask_all_element_attributes: true,
        mask_all_text: true,
        mask_personal_data_properties: true,
        custom_personal_data_properties: [
          "address",
          "email",
          "message",
          "name",
          "phone",
          "token",
        ],
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        persistence: "localStorage",
        person_profiles: "never",
        rageclick: {
          css_selector_ignorelist: [
            ".ph-no-capture",
            ".ph-no-rageclick",
            PRIVATE_ELEMENT_SELECTOR,
          ],
          ignore_text_selection: true,
        },
        save_campaign_params: false,
        save_referrer: false,
        session_recording: {
          blockSelector: PRIVATE_ELEMENT_SELECTOR,
          collectFonts: false,
          maskAllInputs: true,
          maskTextSelector: "form, [data-private]",
          recordBody: false,
          recordCrossOriginIframes: false,
          recordHeaders: false,
          sampleRate: 1,
          maskCapturedNetworkRequestFn: sanitizeRecordedRequest,
        },
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

    posthog.register({ app_name: POSTHOG_APP_NAME, surface: "web" });
    posthog.startSessionRecording();

    return true;
  } catch {
    // A blocked or failed analytics chunk must never break the page.
    return false;
  }
}

export function disableProductAnalytics() {
  analyticsDesired = false;
  clearPersistedPostHogState();

  if (posthogInstance && initialized) {
    try {
      posthogInstance.opt_out_capturing();
      posthogInstance.stopSessionRecording();
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
          posthog.stopSessionRecording();
        }
      })
      .catch(() => {
        // The visitor is already opted out in local state.
      });
  }
}

function clearPersistedPostHogState() {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!projectToken || typeof window === "undefined") {
    return;
  }

  const persistenceToken = projectToken
    .replace(/\+/g, "PL")
    .replace(/\//g, "SL")
    .replace(/=/g, "EQ");
  const persistenceKey = `ph_${persistenceToken}_posthog`;
  const keys = [
    persistenceKey,
    `${persistenceKey}__flags`,
    `${persistenceKey}__surveys`,
    `__ph_opt_in_out_${projectToken}`,
  ];

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (const key of keys) {
        storage.removeItem(key);
      }
    } catch {
      // Consent withdrawal still applies in memory when storage is blocked.
    }
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

  if (!Object.hasOwn(EVENT_PROPERTY_ALLOWLIST_SETS, captureResult.event)) {
    return null;
  }

  const eventPropertyAllowlist =
    EVENT_PROPERTY_ALLOWLIST_SETS[captureResult.event]!;
  let sanitizedElements: SafeElement[] | undefined;
  const properties = Object.fromEntries(
    Object.entries(captureResult.properties).flatMap(([key, value]) => {
      if (
        captureResult.event === "$web_vitals" &&
        /^\$web_vitals_(CLS|FCP|INP|LCP)_(event|value)$/.test(key)
      ) {
        const sanitizedValue = key.endsWith("_event")
          ? sanitizeWebVital(value)
          : sanitizeFiniteNumber(value);
        return sanitizedValue === undefined ? [] : [[key, sanitizedValue]];
      }

      if (
        (captureResult.event === "$dead_click" ||
          captureResult.event === "$dead_swipe") &&
        /^\$(dead_click|dead_swipe)_[a-z_]+(?:_ms|_timeout|_timestamp)$/.test(
          key,
        )
      ) {
        return typeof value === "boolean" || Number.isFinite(value)
          ? [[key, value]]
          : [];
      }

      if (
        !POSTHOG_INGESTION_PROPERTY_ALLOWLIST.has(key) &&
        !eventPropertyAllowlist.has(key) &&
        key !== "app_name" &&
        key !== "surface"
      ) {
        return [];
      }

      if (
        key === "$current_url" ||
        key === "$external_click_url" ||
        key === "$referrer" ||
        key === "$session_entry_url"
      ) {
        const sanitizedValue = sanitizeUrlProperty(value);
        return sanitizedValue === undefined ? [] : [[key, sanitizedValue]];
      }

      if (key === "$pathname" || key === "$prev_pageview_pathname") {
        return typeof value === "string"
          ? [[key, normalizePathname(value.split(/[?#]/u, 1)[0] ?? "")]]
          : [];
      }

      if (key === "$elements") {
        sanitizedElements ??= sanitizeElements(value);
        return sanitizedElements.length ? [[key, sanitizedElements]] : [];
      }

      if (key === "$elements_chain") {
        sanitizedElements ??= sanitizeElements(
          captureResult.properties.$elements,
        );
        const sanitizedValue = buildElementsChain(sanitizedElements);
        return sanitizedValue ? [[key, sanitizedValue]] : [];
      }

      if (key === "$heatmap_data") {
        const sanitizedValue = sanitizeHeatmapData(value);
        return Object.keys(sanitizedValue).length
          ? [[key, sanitizedValue]]
          : [];
      }

      if (key === "$exception_list") {
        const sanitizedValue = sanitizeExceptionList(value);
        return sanitizedValue.length ? [[key, sanitizedValue]] : [];
      }

      return value === undefined ? [] : [[key, value]];
    }),
  );

  properties.app_name = POSTHOG_APP_NAME;
  properties.surface = "web";

  return {
    event: captureResult.event,
    properties,
    timestamp: captureResult.timestamp,
    uuid: captureResult.uuid,
  };
};

type CapturedNetworkRequest = Parameters<
  NonNullable<
    PostHogConfig["session_recording"]["maskCapturedNetworkRequestFn"]
  >
>[0];

function sanitizeRecordedRequest(request: CapturedNetworkRequest) {
  const sanitizedUrl = sanitizeAbsoluteUrl(request.name);

  return sanitizedUrl ? { ...request, name: sanitizedUrl } : null;
}

function sanitizeAbsoluteUrl(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${normalizePathname(url.pathname)}`;
  } catch {
    return undefined;
  }
}

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

type SafeElement = {
  attr__href?: string;
  nth_child?: number;
  nth_of_type?: number;
  tag_name: string;
};

function sanitizeElements(value: unknown): SafeElement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 20).flatMap((element) => {
    if (!element || typeof element !== "object") {
      return [];
    }

    const candidate = element as Record<string, unknown>;
    const tagName =
      typeof candidate.tag_name === "string" &&
      /^[a-z][a-z0-9-]{0,31}$/u.test(candidate.tag_name)
        ? candidate.tag_name
        : null;

    if (!tagName) {
      return [];
    }

    const safeElement: SafeElement = { tag_name: tagName };
    const nthChild = sanitizePositiveInteger(candidate.nth_child);
    const nthOfType = sanitizePositiveInteger(candidate.nth_of_type);
    const href = sanitizeUrlProperty(candidate.attr__href);

    if (nthChild !== undefined) safeElement.nth_child = nthChild;
    if (nthOfType !== undefined) safeElement.nth_of_type = nthOfType;
    if (href !== undefined) safeElement.attr__href = href;

    return [safeElement];
  });
}

function buildElementsChain(elements: SafeElement[]) {
  return elements
    .map((element) => {
      const nthChild = element.nth_child
        ? `:nth-child(${element.nth_child})`
        : "";
      const nthOfType = element.nth_of_type
        ? `:nth-of-type(${element.nth_of_type})`
        : "";
      return `${element.tag_name}${nthChild}${nthOfType}`;
    })
    .join(";");
}

function sanitizeHeatmapData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(
      ([rawUrl, rawPoints]) => {
        const url = sanitizeUrlProperty(rawUrl);
        if (!url || !Array.isArray(rawPoints)) return [];

        const points = rawPoints.slice(0, 2_000).flatMap((rawPoint) => {
          if (!rawPoint || typeof rawPoint !== "object") return [];
          const point = rawPoint as Record<string, unknown>;
          const x = sanitizeFiniteNumber(point.x, 0, 100_000);
          const y = sanitizeFiniteNumber(point.y, 0, 100_000);
          const type =
            typeof point.type === "string" &&
            ["click", "deadclick", "mousemove", "rageclick"].includes(
              point.type,
            )
              ? point.type
              : undefined;

          if (x === undefined || y === undefined || !type) return [];

          return [
            {
              target_fixed: point.target_fixed === true,
              type,
              x,
              y,
            },
          ];
        });

        return points.length ? [[url, points]] : [];
      },
    ),
  );
}

function sanitizeWebVital(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const metric = value as Record<string, unknown>;
  const name =
    typeof metric.name === "string" &&
    ["CLS", "FCP", "INP", "LCP"].includes(metric.name)
      ? metric.name
      : undefined;
  const valueNumber = sanitizeFiniteNumber(metric.value, 0);

  if (!name || valueNumber === undefined) return undefined;

  return {
    delta: sanitizeFiniteNumber(metric.delta),
    name,
    rating:
      typeof metric.rating === "string" &&
      ["good", "needs-improvement", "poor"].includes(metric.rating)
        ? metric.rating
        : undefined,
    value: valueNumber,
  };
}

function sanitizeExceptionList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 5).flatMap((rawException) => {
    if (!rawException || typeof rawException !== "object") return [];
    const exception = rawException as Record<string, unknown>;
    const type = sanitizeCodeLabel(exception.type);
    if (!type) return [];

    const rawStacktrace = exception.stacktrace;
    const rawFrames =
      rawStacktrace &&
      typeof rawStacktrace === "object" &&
      !Array.isArray(rawStacktrace) &&
      Array.isArray((rawStacktrace as Record<string, unknown>).frames)
        ? ((rawStacktrace as Record<string, unknown>).frames as unknown[])
        : [];
    const frames = rawFrames.slice(0, 50).flatMap((rawFrame) => {
      if (!rawFrame || typeof rawFrame !== "object") return [];
      const frame = rawFrame as Record<string, unknown>;
      const filename = sanitizeUrlProperty(frame.filename);
      const platform = sanitizeCodeLabel(frame.platform);
      const functionName = sanitizeCodeLabel(frame.function);
      const sanitizedFrame: Record<string, unknown> = {};

      if (filename) sanitizedFrame.filename = filename;
      if (functionName) sanitizedFrame.function = functionName;
      if (platform) sanitizedFrame.platform = platform;
      if (typeof frame.in_app === "boolean") {
        sanitizedFrame.in_app = frame.in_app;
      }

      const lineno = sanitizePositiveInteger(frame.lineno, 10_000_000);
      const colno = sanitizePositiveInteger(frame.colno, 10_000_000);
      if (lineno !== undefined) sanitizedFrame.lineno = lineno;
      if (colno !== undefined) sanitizedFrame.colno = colno;

      return Object.keys(sanitizedFrame).length ? [sanitizedFrame] : [];
    });

    return [
      {
        ...(frames.length
          ? { stacktrace: { frames, type: "raw" as const } }
          : {}),
        type,
      },
    ];
  });
}

function sanitizeCodeLabel(value: unknown) {
  return typeof value === "string" &&
    value.length <= 160 &&
    /^[A-Za-z0-9_.$:/<>\-[\] ]+$/u.test(value)
    ? value
    : undefined;
}

function sanitizePositiveInteger(value: unknown, max = 1_000) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= max
    ? value
    : undefined;
}

function sanitizeFiniteNumber(
  value: unknown,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : undefined;
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
  const allowedProperties = EVENT_PROPERTY_ALLOWLIST_SETS[eventName]!;

  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) => allowedProperties.has(key) && value !== undefined,
    ),
  );
}
