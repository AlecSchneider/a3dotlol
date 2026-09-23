import { expect, test } from "@playwright/test";
import { shortcutRedirects } from "../src/lib/shortcut-redirects";
import { securityHeaders } from "../src/lib/security-headers";

test("case-insensitive shortcuts cannot be redirected to a caller-supplied host", async ({
  request,
  baseURL,
}) => {
  const response = await request.get("/EMAIL?next=https://example.com", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  const target = new URL(response.headers().location!, baseURL);
  expect(target.origin).toBe(baseURL);
  expect(target.pathname).toBe("/contact");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});

for (const [path, target] of shortcutRedirects) {
  test(`${path}: redirect response retains headers and query semantics`, async ({
    request,
    baseURL,
  }) => {
    for (const method of ["GET", "HEAD", "POST"]) {
      const response = await request.fetch(
        `${path}?tag=one&tag=two&sub_confirmation=0`,
        {
          method,
          maxRedirects: 0,
        },
      );
      expect(response.status()).toBe(307);
      const destination = new URL(response.headers().location!, baseURL);
      const expected = new URL(target, baseURL);
      expect(destination.origin + destination.pathname).toBe(
        expected.origin + expected.pathname,
      );
      expect(destination.searchParams.getAll("tag")).toEqual(["one", "two"]);
      expect(destination.searchParams.get("sub_confirmation")).toBe(
        expected.searchParams.get("sub_confirmation") ?? "0",
      );
      for (const [key, value] of Object.entries(securityHeaders)) {
        expect(response.headers()[key.toLowerCase()]).toBe(value);
      }
    }
  });
}

test("normal pages, metadata and unknown paths retain their response contracts", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/about",
    "/contact",
    "/support",
    "/privacy",
    "/cookies",
    "/impressum",
    "/stack",
    "/robots.txt",
    "/sitemap.xml",
    "/not-a-real-page",
    "/github/nested",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(
      path === "/not-a-real-page" || path === "/github/nested" ? 404 : 200,
    );
    for (const [key, value] of Object.entries(securityHeaders)) {
      expect(response.headers()[key.toLowerCase()]).toBe(value);
    }
  }
});
