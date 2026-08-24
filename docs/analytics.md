# Product analytics

a3.lol uses PostHog Cloud EU project `229866` for consented website analytics.
The same project can receive future native-app events so journeys remain
comparable across surfaces. Every analytics event from this repository includes
`app_name: "a3dotlol"` so it remains separate from other products in the
shared project.

No PostHog code is initialized before a visitor accepts analytics. The web SDK
uses EU ingestion, local-storage persistence, anonymous events, manual funnel
events, privacy-filtered click autocapture, heatmaps, rage/dead-click detection,
page-exit and scroll metrics, Core Web Vitals, unhandled browser error metadata,
and masked session replay. Surveys, experiments, feature flags, person profiles,
automatic page views, copied text, console logs, and replay network payloads are
disabled.

Forms and form controls are excluded from autocapture and blocked from replay.
All input values are masked, all automatically captured text and element
attributes are masked, replay URLs are reduced to origin and path, and the
final event filter removes query strings, fragments, raw error messages, source
context, and unexpected properties before upload. Withdrawing consent stops
recording, opts the SDK out, and resets its local anonymous state. Consent policy
version 3 requires a fresh choice from visitors who accepted the earlier,
narrower configuration.

## Event taxonomy

| Event | When it is sent | Properties |
| --- | --- | --- |
| `$pageview` | Initial accepted visit and each client-side route change | `path`, `app_name`, `surface` |
| `$pageleave` | A consented page is left or replaced | sanitized previous path, duration, and scroll/content depth |
| `$autocapture` | A consented visitor clicks a link or non-form button | click type and text-free/attribute-free element structure |
| `$rageclick` / `$dead_click` / `$dead_swipe` | Repeated or apparently ineffective consented interactions | coarse element structure and bounded diagnostic timing/direction values |
| `$$heatmap` | Batched consented click and pointer positions | sanitized path and coordinates only |
| `$web_vitals` | Browser reports LCP, CLS, FCP, or INP | metric name, value, delta, and rating without element attribution |
| `$exception` | An unhandled browser error or rejection occurs | error type and sanitized file path/function/line metadata; no message or source context |
| `$snapshot` | A consented, masked replay batch is recorded | replay data with forms/controls blocked, all inputs masked, and URLs stripped of queries/fragments |
| `primary call to action clicked` | A visitor selects the YouTube live stream or challenge-details call to action | bounded `cta_key`, `placement`, `app_name`, `surface` |
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
evidence, phone numbers, message text, selected/copied text, search parameters,
URL fragments, network bodies or headers, secrets, or raw errors to analytics
properties.

Event names and caller-supplied properties are allowlisted in
`src/lib/product-analytics.ts`. The two homepage CTA identifiers are fixed
values rather than link text or URLs, so this custom funnel event cannot carry
visitor-entered data.

## Dedicated-project status

Project `229866` is in PostHog Cloud EU but still contains historical events
from more than one app, separated by `app_name`. On 2026-08-21, creating a new
dedicated a3.lol project was blocked by the Alec organization's six-project
limit. PostHog offered a paid platform-package upgrade for additional projects;
no upgrade, deletion, data reset, or project reassignment was performed.

For a future iOS or Android app, reuse the same object-verb event names, set
`surface` to `ios` or `android`, and use `$screen` for screen views. Native
analytics must remain prior-consent and anonymous unless the privacy notice and
consent model are deliberately updated.
