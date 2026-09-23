// @vitest-environment node
import { NextRequest } from "next/server";
// Next 16.3.5 still exports the legacy helper name despite its Proxy docs.
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { proxy, config } from "../proxy";
import { shortcutDestination, shortcutRedirects } from "./shortcut-redirects";
import { securityHeaders } from "./security-headers";

describe("shortcut redirects", () => {
  for (const [path, target] of shortcutRedirects) {
    it(`preserves ${path}'s destination, status and security headers`, () => {
      expect(
        unstable_doesProxyMatch({ config, nextConfig: {}, url: path }),
      ).toBe(true);
      const response = proxy(new NextRequest(`https://a3.lol${path}`));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        new URL(target, "https://a3.lol").href,
      );
      for (const [key, value] of Object.entries(securityHeaders)) {
        expect(response.headers.get(key)).toBe(value);
      }
    });
  }

  it("preserves duplicate queries without overriding fixed destination values", () => {
    const url = shortcutDestination(
      new URL("https://a3.lol/youtube?tag=a&tag=b&sub_confirmation=0"),
    );
    expect(url?.searchParams.getAll("tag")).toEqual(["a", "b"]);
    expect(url?.searchParams.get("sub_confirmation")).toBe("1");
  });

  it("matches the previous case-insensitive redirect behavior", () => {
    expect(
      unstable_doesProxyMatch({ config, nextConfig: {}, url: "/EMAIL" }),
    ).toBe(true);
    expect(shortcutDestination(new URL("https://a3.lol/EMAIL"))?.pathname).toBe(
      "/contact",
    );
  });

  it.each([
    "/",
    "/contact",
    "/github/nested",
    "/_next/static/app.js",
    "/robots.txt",
    "/constructor",
    "/unknown",
  ])("leaves %s alone", (path) => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: path })).toBe(
      false,
    );
    expect(shortcutDestination(new URL(`https://a3.lol${path}`))).toBeNull();
  });
});
