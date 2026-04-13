import type { BeforeSendEvent } from "@vercel/analytics/next";

export const ANALYTICS_CONSENT_KEY = "analytics-consent";

export function sanitizeAnalyticsEvent(event: BeforeSendEvent) {
  const url = new URL(event.url);

  url.search = "";
  url.hash = "";

  return {
    ...event,
    url: url.pathname || "/",
  };
}
