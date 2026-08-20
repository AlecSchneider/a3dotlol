export const EMAIL_SIGNUP_CONFIG = {
  consentVersion: "2026-08-20",
  productKey: "a3dotlol",
  publisherKey: "alec-schneider-solutions",
  source: "homepage",
} as const;

export function getSignupLocale() {
  const locale = navigator.language.trim();
  return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale)
    ? locale
    : undefined;
}
