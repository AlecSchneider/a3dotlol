import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 4317);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("E2E_PORT must be an unprivileged TCP port");
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `pnpm run build && pnpm run start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    env: {
      NEXT_PUBLIC_CONVEX_URL: "https://audit.convex.cloud",
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_local_e2e_not_a_real_token",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
