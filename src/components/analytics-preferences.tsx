"use client";

import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  type AnalyticsConsentChoice,
  readAnalyticsConsentEvent,
  subscribeToAnalyticsConsentStorage,
  writeAnalyticsConsent,
} from "~/lib/analytics";

const statusText: Record<AnalyticsConsentChoice | "none", string> = {
  accepted: "Current setting: analytics is allowed in this browser.",
  declined: "Current setting: analytics is declined in this browser.",
  none: "Current setting: no choice has been saved in this browser yet.",
};

const choiceButtonClass =
  "rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--text-primary)] transition hover:border-white/30 aria-pressed:border-cyan-300/70";

export function AnalyticsPreferences() {
  // Undefined until hydration so the server and first client render match.
  const [consent, setConsent] = useState<
    AnalyticsConsentChoice | null | undefined
  >(undefined);

  useEffect(() => {
    const unsubscribeFromStorage = subscribeToAnalyticsConsentStorage(
      window,
      setConsent,
    );
    const handleConsentChanged = (event: Event) => {
      const nextConsent = readAnalyticsConsentEvent(event);
      if (nextConsent) {
        setConsent(nextConsent);
      }
    };

    window.addEventListener(
      ANALYTICS_CONSENT_CHANGED_EVENT,
      handleConsentChanged,
    );
    return () => {
      unsubscribeFromStorage();
      window.removeEventListener(
        ANALYTICS_CONSENT_CHANGED_EVENT,
        handleConsentChanged,
      );
    };
  }, []);

  const saveConsent = (nextConsent: AnalyticsConsentChoice) => {
    try {
      writeAnalyticsConsent(window.localStorage, nextConsent);
    } catch {
      // The current-page choice still applies if storage is unavailable.
    }

    window.dispatchEvent(
      new CustomEvent(ANALYTICS_CONSENT_CHANGED_EVENT, {
        detail: nextConsent,
      }),
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-[var(--text-subtle)]">
        Analytics is optional. Both choices are available at any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          aria-pressed={consent === "accepted"}
          className={choiceButtonClass}
          onClick={() => saveConsent("accepted")}
          type="button"
        >
          Allow analytics
        </button>
        <button
          aria-pressed={consent === "declined"}
          className={choiceButtonClass}
          onClick={() => saveConsent("declined")}
          type="button"
        >
          Decline analytics
        </button>
      </div>
      <p
        aria-live="polite"
        className="mt-4 min-h-5 text-xs text-[var(--text-muted)]"
        data-testid="analytics-consent-status"
      >
        {consent === undefined ? "" : statusText[consent ?? "none"]}
      </p>
    </div>
  );
}
