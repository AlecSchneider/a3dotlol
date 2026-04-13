"use client";

import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_KEY,
  sanitizeAnalyticsEvent,
} from "~/lib/analytics";

type ConsentState = "accepted" | "declined" | null;

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedConsent = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);

    if (storedConsent === "accepted" || storedConsent === "declined") {
      setConsent(storedConsent);
    }

    setLoaded(true);
  }, []);

  const updateConsent = (nextConsent: Exclude<ConsentState, null>) => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent);
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
            This site uses Vercel Web Analytics only after your consent. URLs
            are stripped of query strings and hashes before they are sent.{" "}
            <Link
              className="text-[var(--text-primary)] underline decoration-white/30 underline-offset-4"
              href="/privacy"
            >
              Privacy Policy
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
              className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20"
              onClick={() => updateConsent("declined")}
              type="button"
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
