import { links, youtubeHref } from "./links";

export const shortcutRedirects = new Map([
  ["/youtube", youtubeHref],
  ["/live", youtubeHref],
  ["/tutorial", "https://www.youtube.com/watch?v=Y_NrWcWSqGQ"],
  ...links.map((link): [string, string] => [
    `/${link.label}`,
    link.label === "email" ? "/contact" : link.href,
  ]),
]);

export function shortcutDestination(requestUrl: URL): URL | null {
  const target = shortcutRedirects.get(requestUrl.pathname.toLowerCase());
  if (!target) return null;

  const destination = new URL(target, requestUrl);
  // Match next.config redirects: incoming queries pass through, but fixed
  // destination values take precedence. Preserve repeated incoming values.
  const fixedKeys = new Set(destination.searchParams.keys());
  for (const [key, value] of requestUrl.searchParams) {
    if (!fixedKeys.has(key)) destination.searchParams.append(key, value);
  }
  return destination;
}
