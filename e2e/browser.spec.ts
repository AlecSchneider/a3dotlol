import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, baseURL }) => {
  // Never connect to production or a real backend. The SDK still runs in the
  // browser; only its external transport is replaced.
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === baseURL) return route.continue();
    if (url.hostname.endsWith(".posthog.com")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    }
    return route.abort();
  });
  await context.routeWebSocket(/.*/, (socket) => {
    socket.onMessage((data) => {
      const message = JSON.parse(String(data)) as {
        type: string;
        requestId?: number;
      };
      if (message.type === "Action") {
        socket.send(
          JSON.stringify({
            type: "ActionResponse",
            requestId: message.requestId,
            success: false,
            result: "Simulated service failure",
            logLines: [],
          }),
        );
      }
    });
  });
});

test("hydrated navigation works without page errors or horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("alec");
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  await page.getByRole("link", { name: "The €100k app challenge" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("analytics stays off until consent, and withdrawal persists across navigation and reload", async ({
  page,
}) => {
  let analyticsRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith(".posthog.com"))
      analyticsRequests++;
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Accept analytics" }),
  ).toBeVisible();
  expect(analyticsRequests).toBe(0);
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Accept analytics" }),
  ).toHaveCount(0);
  expect(analyticsRequests).toBe(0);
  await page.goto("/cookies");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => analyticsRequests).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  await page.reload();
  const afterWithdrawal = analyticsRequests;
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(analyticsRequests).toBe(afterWithdrawal);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("analytics-consent") ?? "{}") as {
          choice?: string;
        },
    ),
  ).toMatchObject({ choice: "declined" });
});

test("signup purposes start unchecked and block submission without explicit choice", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  for (const checkbox of await page.getByRole("checkbox").all()) {
    await expect(checkbox).not.toBeChecked();
  }
  await page
    .getByLabel("Email address", { exact: true })
    .fill("browser-test@example.com");
  await page.getByRole("button", { name: "save email choices" }).click();
  await expect(
    page.getByText("Choose at least one type of email update."),
  ).toBeVisible();
  await page.getByText("Withdraw both email consents", { exact: true }).click();
  await expect(page.getByLabel("Registered email address")).toBeVisible();
});

test("contact validates required fields and recovers from a mocked backend failure", async ({
  page,
}) => {
  await page.goto("/contact");
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  await page.getByRole("button", { name: "send message" }).click();
  expect(
    await page
      .getByLabel("Email", { exact: true })
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBe(true);
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-test@example.com");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Synthetic local browser test");
  await page.getByRole("button", { name: "send message" }).click();
  await expect(page.getByRole("status")).toContainText(
    "The message could not be sent.",
  );
  await expect(
    page.getByRole("button", { name: "send message" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    "Synthetic local browser test",
  );
});
