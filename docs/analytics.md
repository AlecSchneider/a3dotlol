# Product analytics

a3.lol uses PostHog Cloud EU project `229866` for consented website analytics.
The same project can receive future native-app events so journeys remain
comparable across surfaces.

No PostHog code is initialized before a visitor accepts analytics. The web SDK
uses EU ingestion, local-storage persistence, anonymous events, and manual
capture. Autocapture, session replay, surveys, experiments, feature flags,
person profiles, and automatic page views are disabled.

## Event taxonomy

| Event | When it is sent | Properties |
| --- | --- | --- |
| `$pageview` | Initial accepted visit and each client-side route change | `path`, `surface` |
| `navigation link clicked` | A visitor selects an internal, external, email, or phone link | `destination_type`, sanitized destination path or host, `placement`, `surface` |
| `contact form started` | First focus inside a contact or support form | `form_name`, `surface` |
| `contact form submitted` | Convex confirms successful delivery | `form_name`, `surface` |
| `contact form failed` | Delivery returns an error | `form_name`, generic `reason`, `surface` |
| `analytics consent accepted` | A visitor accepts from the banner or settings | `surface` |

Never add contact-form values, email addresses, phone numbers, message text,
search parameters, URL fragments, secrets, or raw errors to analytics
properties.

For a future iOS or Android app, reuse the same object-verb event names, set
`surface` to `ios` or `android`, and use `$screen` for screen views. Native
analytics must remain prior-consent and anonymous unless the privacy notice and
consent model are deliberately updated.
