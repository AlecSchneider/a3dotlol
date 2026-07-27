export const ANALYTICS_CONSENT_KEY = "analytics-consent";
export const ANALYTICS_CONSENT_VERSION = 2;
export const ANALYTICS_CONSENT_CHANGED_EVENT = "analytics-consent-changed";

const ANALYTICS_CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type AnalyticsConsentChoice = "accepted" | "declined";

type StoredAnalyticsConsent = {
  choice: AnalyticsConsentChoice;
  decidedAt: number;
  version: number;
};

export function readAnalyticsConsent(
  storage: Pick<Storage, "getItem" | "removeItem">,
  now = Date.now(),
): AnalyticsConsentChoice | null {
  const storedValue = storage.getItem(ANALYTICS_CONSENT_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(storedValue);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("choice" in parsed) ||
      (parsed.choice !== "accepted" && parsed.choice !== "declined") ||
      !("decidedAt" in parsed) ||
      typeof parsed.decidedAt !== "number" ||
      !("version" in parsed) ||
      parsed.version !== ANALYTICS_CONSENT_VERSION ||
      parsed.decidedAt > now ||
      now - parsed.decidedAt > ANALYTICS_CONSENT_MAX_AGE_MS
    ) {
      storage.removeItem(ANALYTICS_CONSENT_KEY);
      return null;
    }

    return parsed.choice;
  } catch {
    storage.removeItem(ANALYTICS_CONSENT_KEY);
    return null;
  }
}

export function writeAnalyticsConsent(
  storage: Pick<Storage, "setItem">,
  choice: AnalyticsConsentChoice,
  now = Date.now(),
) {
  const value: StoredAnalyticsConsent = {
    choice,
    decidedAt: now,
    version: ANALYTICS_CONSENT_VERSION,
  };

  storage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(value));
}
