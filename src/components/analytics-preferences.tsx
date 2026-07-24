"use client";

import { writeAnalyticsConsent } from "~/lib/analytics";

export function AnalyticsPreferences() {
  const saveConsent = (nextConsent: "accepted" | "declined") => {
    writeAnalyticsConsent(window.localStorage, nextConsent);
    window.location.reload();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-[var(--text-subtle)]">
        Analytics is optional. Both choices are available at any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--text-primary)] transition hover:border-white/30"
          onClick={() => saveConsent("accepted")}
          type="button"
        >
          Allow analytics
        </button>
        <button
          className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:border-white/20"
          onClick={() => saveConsent("declined")}
          type="button"
        >
          Decline analytics
        </button>
      </div>
    </div>
  );
}
