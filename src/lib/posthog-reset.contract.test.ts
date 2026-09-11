// @vitest-environment node
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { PostHog, PostHogConfig } from "posthog-js";
import { afterEach, describe, expect, it, vi } from "vitest";

// Exercise the pinned SDK itself. Only consent storage and transport are fake;
// no browser, remote configuration, cookies or real network are initialized.
const require = createRequire(import.meta.url);
const sdkRoot = dirname(require.resolve("posthog-js/package.json"));
const { PostHog: Sdk, defaultConfig } = require(
  join(sdkRoot, "lib/src/posthog-core.js"),
) as {
  PostHog: new () => PostHog;
  defaultConfig: () => PostHogConfig;
};
const { PostHogPersistence } = require(
  join(sdkRoot, "lib/src/posthog-persistence.js"),
) as {
  PostHogPersistence: new (
    config: PostHogConfig,
    session: boolean,
  ) => NonNullable<PostHog["persistence"]>;
};
const { PostHogFeatureFlags } = require(
  join(sdkRoot, "lib/src/posthog-featureflags.js"),
) as {
  PostHogFeatureFlags: new (sdk: PostHog) => PostHog["featureFlags"];
};

afterEach(() => vi.useRealTimers());

describe("pinned PostHog reset contract", () => {
  it.each([false, true])(
    "rotates identity; unused flags disabled=%s controls post-withdrawal requests",
    async (disabled) => {
      vi.useFakeTimers();
      const sdk = new Sdk();
      sdk.config = {
        ...defaultConfig(),
        token: "synthetic-token",
        persistence: "memory",
        capture_pageview: false,
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        advanced_disable_feature_flags: disabled,
        remote_config_refresh_interval_ms: 0,
      };
      Reflect.set(sdk, "__loaded", true);
      sdk.persistence = new PostHogPersistence(sdk.config, false);
      sdk.persistence.register({
        distinct_id: "synthetic-identity",
        $device_id: "synthetic-device",
      });
      let optedOut = false;
      Reflect.set(sdk, "consent", {
        isOptedOut: () => optedOut,
        isOptedIn: () => !optedOut,
        optInOut(value: boolean) {
          optedOut = !value;
        },
        reset() {
          optedOut = true;
        },
      });
      sdk.featureFlags = new PostHogFeatureFlags(sdk);
      const requests: {
        afterOptOut: boolean;
        hasIdentity: boolean;
        isFlags: boolean;
      }[] = [];
      Reflect.set(sdk.featureFlags, "_client", {
        projectToken: "synthetic-token",
        get distinctId() {
          return sdk.get_distinct_id();
        },
        get deviceId() {
          return sdk.get_property("$device_id") as unknown;
        },
        groups: {},
        initialPersonProperties: {},
        library: { name: "web", version: "test" },
        kv: {
          get() {
            return undefined;
          },
          set: vi.fn(),
          remove: vi.fn(),
        },
        sendRequest(path: string, options: { body: { distinct_id?: string } }) {
          requests.push({
            afterOptOut: optedOut,
            hasIdentity: Boolean(options.body.distinct_id),
            isFlags: path.startsWith("/flags/"),
          });
          return new Promise(() => {
            // Leave the synthetic request pending; no response handling or I/O.
          });
        },
      });
      try {
        const before = sdk.get_distinct_id();
        sdk.opt_out_capturing();
        sdk.stopSessionRecording();
        sdk.reset(true);
        await vi.advanceTimersByTimeAsync(15);
        expect(sdk.get_distinct_id()).not.toBe(before);
        expect(sdk.get_property("$device_id")).not.toBe("synthetic-device");
        expect(requests).toEqual(
          disabled
            ? []
            : [{ afterOptOut: true, hasIdentity: true, isFlags: true }],
        );
      } finally {
        sdk.featureFlags.destroy();
      }
    },
  );
});
