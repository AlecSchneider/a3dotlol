# Product analytics

a3.lol uses PostHog Cloud EU project `229866` for consented website analytics.
The same project can receive future native-app events so journeys remain
comparable across surfaces. Every event from this repository includes
`app_name: "a3dotlol"` so it remains separate from other products in the
shared project.

No PostHog code is initialized before a visitor accepts analytics. The web SDK
uses EU ingestion, local-storage persistence, anonymous events, and manual
capture. Autocapture, session replay, surveys, experiments, feature flags,
person profiles, and automatic page views are disabled.

## Event taxonomy

| Event | When it is sent | Properties |
| --- | --- | --- |
| `$pageview` | Initial accepted visit and each client-side route change | `path`, `app_name`, `surface` |
| `navigation link clicked` | A visitor selects an internal, external, email, or phone link | `destination_type`, sanitized destination path or host, `placement`, `app_name`, `surface` |
| `contact form started` | First focus inside a contact or support form | `form_name`, `app_name`, `surface` |
| `contact form submitted` | Convex confirms successful delivery | `form_name`, `app_name`, `surface` |
| `contact form failed` | Delivery returns an error | `form_name`, generic `reason`, `app_name`, `surface` |
| `email_signup_opened` | First focus inside the email signup | `product_key`, `app_name`, `surface` |
| `email_signup_submitted` | A valid selection is submitted | `product_key`, purpose booleans, `app_name`, `surface` |
| `email_signup_succeeded` | Convex confirms the choices were saved | `product_key`, purpose booleans, `app_name`, `surface` |
| `email_signup_withdrawn` | Convex confirms a generic withdrawal request | `product_key`, `app_name`, `surface` |
| `email_signup_failed` | Client validation or Convex submission fails | `product_key`, coarse `failure_stage`, `app_name`, `surface` |
| `analytics consent accepted` | A visitor accepts from the banner or settings | `app_name`, `surface` |

Never add contact-form values, signup email addresses or hashes, consent
evidence, phone numbers, message text, search parameters, URL fragments,
secrets, or raw errors to analytics properties.

For a future iOS or Android app, reuse the same object-verb event names, set
`surface` to `ios` or `android`, and use `$screen` for screen views. Native
analytics must remain prior-consent and anonymous unless the privacy notice and
consent model are deliberately updated.
