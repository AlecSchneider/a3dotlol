"use client";

import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

import {
  type AnalyticsConsentChoice,
  readAnalyticsConsent,
  sanitizeAnalyticsEvent,
  writeAnalyticsConsent,
} from "~/lib/analytics";

type ConsentState = AnalyticsConsentChoice | null;

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setConsent(readAnalyticsConsent(window.localStorage));
    } catch {
      setConsent(null);
    }

    setLoaded(true);
  }, []);

  const updateConsent = (nextConsent: Exclude<ConsentState, null>) => {
    try {
      writeAnalyticsConsent(window.localStorage, nextConsent);
    } catch {
      // The current-page choice still applies if storage is unavailable.
    }

    setConsent(nextConsent);
  };

  return (
    <>
      {consent === "accepted" ? (
        <Analytics beforeSend={sanitizeAnalyticsEvent} />
      ) : null}

      {loaded && consent === null ? (
        <div className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/80 p-4 text-sm text-[var(--text-subtle)] shadow-2xl shadow-black/40 backdrop-blur">
          <p className="leading-6">
            Optional, cookie-free Vercel Web Analytics loads only with your
            consent. URLs are stripped of query strings and hashes before they
            are sent.{" "}
            <Link
              className="text-[var(--text-primary)] underline decoration-white/30 underline-offset-4"
              href="/cookies"
            >
              Details and settings
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-[var(--text-primary)] transition hover:border-white/30"
              onClick={() => updateConsent("accepted")}
              type="button"
            >
              Accept analytics
            </button>
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-[var(--text-primary)] transition hover:border-white/30"
              onClick={() => updateConsent("declined")}
              type="button"
            >
              Decline analytics
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
