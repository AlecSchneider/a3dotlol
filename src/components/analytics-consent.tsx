"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  type AnalyticsConsentChoice,
  subscribeToAnalyticsConsentStorage,
  writeAnalyticsConsent,
} from "~/lib/analytics";
import {
  captureNavigationClick,
  capturePageView,
  captureProductEvent,
  disableProductAnalytics,
  enableProductAnalytics,
} from "~/lib/product-analytics";

type ConsentState = AnalyticsConsentChoice | null;

const subscribeToHydration = () => () => undefined;

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState>(null);
  const loaded = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;

    const handleConsentChanged = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const nextConsent: unknown = event.detail;
      if (nextConsent === "accepted" || nextConsent === "declined") {
        void (async () => {
          if (nextConsent === "accepted") {
            const enabled = await enableProductAnalytics();

            if (!cancelled && enabled) {
              captureProductEvent("analytics consent accepted");
            }
          } else {
            disableProductAnalytics();
          }
        })();

        setConsent(nextConsent);
      }
    };

    const unsubscribeFromStorage = subscribeToAnalyticsConsentStorage(
      window,
      setConsent,
    );
    window.addEventListener(
      ANALYTICS_CONSENT_CHANGED_EVENT,
      handleConsentChanged,
    );
    return () => {
      cancelled = true;
      unsubscribeFromStorage();
      window.removeEventListener(
        ANALYTICS_CONSENT_CHANGED_EVENT,
        handleConsentChanged,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (consent !== "accepted") {
        disableProductAnalytics();
        return;
      }

      const enabled = await enableProductAnalytics();

      if (cancelled || !enabled) {
        return;
      }

      capturePageView(pathname);
    })();

    return () => {
      cancelled = true;
    };
  }, [consent, pathname]);

  useEffect(() => {
    if (consent !== "accepted") {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const anchor = event.target.closest("a");
      if (anchor instanceof HTMLAnchorElement) {
        captureNavigationClick(anchor);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [consent]);

  const updateConsent = (nextConsent: Exclude<ConsentState, null>) => {
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
    <>
      {loaded && consent === null ? (
        <div className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/80 p-4 text-sm text-[var(--text-subtle)] shadow-2xl shadow-black/40 backdrop-blur">
          <p className="leading-6">
            Optional PostHog analytics loads only with your consent. It measures
            page paths, interactions, performance, errors, and masked session
            replays. Forms and inputs are excluded; query strings, fragments,
            and form contents are not recorded.{" "}
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
