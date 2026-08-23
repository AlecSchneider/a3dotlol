import { describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_CONSENT_KEY,
  subscribeToAnalyticsConsentStorage,
  writeAnalyticsConsent,
} from "./analytics";

describe("analytics consent storage synchronization", () => {
  it("applies consent changes made in another tab", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    };
    let storageListener = (_event: Pick<StorageEvent, "key">) => {
      throw new Error("Storage listener was not registered");
    };
    const target = {
      localStorage: storage,
      addEventListener: vi.fn(
        (_type: "storage", listener: typeof storageListener) => {
          storageListener = listener;
        },
      ),
      removeEventListener: vi.fn(),
    };
    const choices = vi.fn();

    writeAnalyticsConsent(storage, "accepted", 1_000);
    const unsubscribe = subscribeToAnalyticsConsentStorage(
      target,
      choices,
      () => 1_000,
    );

    expect(choices).toHaveBeenLastCalledWith("accepted");

    writeAnalyticsConsent(storage, "declined", 1_000);
    storageListener({ key: ANALYTICS_CONSENT_KEY });

    expect(choices).toHaveBeenLastCalledWith("declined");
    expect(choices).toHaveBeenCalledTimes(2);

    storageListener({ key: "unrelated" });
    expect(choices).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(target.removeEventListener).toHaveBeenCalledWith(
      "storage",
      expect.any(Function),
    );
  });
});
