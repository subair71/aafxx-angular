> Superseded for book purchasing by the October 28 Phase 1 brief: both PDF and print use Stripe. The Amazon launch date and paperback-only Amazon routing below are historical. See [PHASE_1_STATUS.md](PHASE_1_STATUS.md).

# AAFXX sales funnel delivery — 24 October 2026

Implemented on `dev-aafxx`, starting from `3ea7194`. No merge into `develop` or `main` is part of this change.

## Operational status

**Checkout is not operational. Lead collection is not operational.** No payment credentials, verified Amazon listings, approved private book PDFs, deployed API origin or approved merchant policies were available. All readiness gates remain off. The frontend never claims an order, registration, email or download succeeded without its required server acknowledgement.

Stripe is the selected digital payment provider in Option B (Stripe / PayPal). PayPal is not implemented or advertised. Paperback purchases use verified Amazon listings; retained legacy Stripe print backend support is not exposed by the new storefront. Amazon purchases do not unlock on-site digital downloads or generate on-site purchase-completed events.

## Completed

- Consistent **EBOOK: $27 | PAPERBACK: $47 | BUNDLE (4 Books): $97** prices, edition selectors, supplied original covers and recommended bundle. No bundle format or savings claim until contents are confirmed.
- Individual book actions, launch-registration route, selected book/format preservation and separate registration confirmation. A direct visit to the confirmation URL does not simulate registration.
- Mentorship section immediately after the four books on both home and shop pages, plus `/mentorship/` application. WhatsApp uses only an approved international number and a prefilled mentorship enquiry.
- Free-checklist lead form on home and checklist pages. It currently offers launch interest rather than a fictional download. Desktop exit intent appears only when lead capture is configured, once per session; the inline form is the mobile alternative.
- Secure-checkout review, payment-status verification, verified order details, expiring download access, recovery email and post-purchase mentorship journey.
- Dedicated author route, genuine portrait displayed from the supplied `founder-biography.jpeg`, preserved existing approved short academy copy, and respectful dedication to the late Ezi Achama Eke. Full approved biography is pending; no uncertain text or performance claims from the source artwork were transcribed as approved copy.
- Accessible swipe/keyboard testimonials carousel with pause/play and reduced-motion support. Hidden until approved records exist.
- Footer contacts with missing details explicitly pending, existing legal pages, exact requested risk disclaimer and a dedicated risk page.
- Consent-gated GA4 loader and events; no form values, email, phone, raw order references, query strings or private download URLs in event payloads. Purchase events use a server-generated pseudonymous transaction identifier and only follow a verified paid result.
- New routes registered with the existing metadata/prerender/sitemap pipeline. Development builds stay noindex/test. The sitemap and canonical/social URLs require the approved production origin.

## Exact purchase CTA destinations

All paths below are relative to the configured site base (normally `/`). The same action resolver is used by product cards, detail pages and the sticky mobile button.

| Title / volume | Current eBook action | Current paperback action |
| --- | --- | --- |
| 1 — ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE | `/launch-notifications/?book=aafxx-book-1&format=pdf` | `/launch-notifications/?book=aafxx-book-1&format=print` |
| 2 — FOREX LOW IN, MIDDLE OUT | `/launch-notifications/?book=aafxx-book-2&format=pdf` | `/launch-notifications/?book=aafxx-book-2&format=print` |
| 3 — BBB FLOW & LEADER ALIGNMENT | `/launch-notifications/?book=aafxx-book-3&format=pdf` | `/launch-notifications/?book=aafxx-book-3&format=print` |
| 4 — PROF STANDARD | `/launch-notifications/?book=aafxx-book-4&format=pdf` | `/launch-notifications/?book=aafxx-book-4&format=print` |
| Four-book bundle | `/launch-notifications/?book=aafxx-complete-library&format=undecided` | No format is assumed |

Unavailable paperback buttons read **Pre-Order on Amazon – Nov 2026** and the destination clearly says **launch notification only, not a paid pre-order or Amazon reservation**. Unavailable eBook buttons say **Notify Me About the eBook**. No current CTA points at an Amazon placeholder or functioning payment link.

When enabled:

- eBook N: `/checkout/?sku=aafxx-book-N-pdf` → exact verified test/live Stripe Payment Link in `integrationConfig.payments.links[sku][environment].url`.
- Eligible bundle: `/checkout/?sku=aafxx-four-book-bundle` → its independently verified Stripe Payment Link, after contents and delivery readiness pass.
- Paperback N: exact verified `funnelConfig.amazon['aafxx-book-N'].url`, restricted to an allowed Amazon host and `/dp/{matchingASIN}`. No invented URL is configured.
- Stripe redirect: `/checkout/success/?session_id={CHECKOUT_SESSION_ID}`. The reference is removed from the address bar and retained only in component memory. The customer supplies their checkout email; only server-verified paid orders render the requested thank-you heading, order details and eligible downloads.
- Mentorship: `/mentorship/`; WhatsApp has no destination until the official number is supplied.

## Backend additions and setup

See `COMMERCE_SETUP.md` for the existing AWS SAM, Secrets Manager, Stripe signed webhooks, private S3 and SES prerequisites. The backend has **not** been deployed by this change.

| Endpoint | Behaviour |
| --- | --- |
| `POST /leads` | Validates name/email/country, kind, book, preferred format, consent version, timing and honeypot; rate-limits IP and hashed email; stores a deterministic deduplicated lead in DynamoDB before acknowledgement |
| `POST /order-status` | Validates reference/email and matching paid order; rechecks Stripe amount, product, mode and paid/complete session; re-reads for revocation; returns order details and signed downloads without customer PII |
| Existing endpoints | Contact, EA waitlist, Stripe webhook, private download and recovery remain supported |

1. Configure and deploy the existing SAM stack in the merchant's authorized AWS account. Set actual HTTPS API origin and allowed origin, independent strong signing/rate secrets and approved retention in Secrets Manager.
2. Configure `leadsEnabled`, `leadsRetentionDays` and the same `privacyVersion` on both server and client. Enable public `forms.leadsReady` and `privacyApproved` only after verifying real storage, consent wording, deletion/retention procedure and privacy contact.
3. For the free checklist, upload only the approved PDF under `free-content/` in the private bucket; set server `checklist.approved` / `key`, verified SES sender and approved recipients in test mode. Then set public `funnelConfig.checklist.approvedPdfReady`. IAM now permits read access to that prefix as well as `paid-content/`.
4. Checklist email uses a conditional delivery lease and records accepted email delivery. Repeated successful requests do not resend. Failed sends leave a durable request and can resume when the visitor retries or the operator reconciles pending records. There is no automatic bulk campaign or background retry worker. S3 links expire in up to 24 hours (temporary AWS credentials may shorten this). SES acceptance does not guarantee inbox arrival; email can be delivered at least once after partial database/email failures.
5. Configure real Stripe products/prices/payment links, private PDFs, approved refund/purchase policies, webhook signing secret and SES fulfilment. Keep the existing `dev-aafxx` test-only protection. Verify webhook and delivery end-to-end before enabling storefront gates.
6. Add verified Amazon listing/ASIN pairs to `funnel-config.ts`. Confirm each listing's title, paperback format and $47 price before marking it verified. Direct retailer purchases are handled by Amazon's checkout and policies.
7. For GA4, configure the real measurement ID and approved privacy text, **disable Enhanced Measurement automatic page views, outbound link and form tracking in the GA4 stream**, then enable the public analytics flag. Only explicit allowlisted application events should run. Do not enable automatic tracking that might collect URL query strings or form fields. Users can decline or withdraw consent from footer preferences.

No secret belongs in Angular configuration or frontend build variables.

## Inputs still required

- Stripe merchant onboarding, real test/live product/price/link identifiers, webhook credentials and approved purchase/refund terms.
- AWS/SES access, real API origin, approved privacy/retention terms and test delivery recipients.
- Actual private eBook PDFs; confirmation of the $97 bundle's format and included editions; approved free checklist PDF.
- Verified Amazon paperback URLs/ASINs.
- New official WhatsApp number, official email and verified Instagram/YouTube (and optional TikTok) URLs.
- Exact approved full About Author biography; approved testimonials and any associated photos/designations.
- GA4 measurement ID and approved production origin.

## Validation

- Angular production compilation passed (approximately 105 kB estimated initial transfer).
- 7 build/environment/route tests, 9 existing commerce tests, 5 new funnel tests and 21 backend tests passed locally; backend syntax checks passed.
- Cloud Chrome inspection verified price display, paperback launch routing, selection preservation, bundle interest, founder portrait and pending states. Additional browser observations are recorded in `VALIDATION.md`.
- This executor's local Chromium runtime could not launch (`/tmp/fonts` extraction/chown failure; zero-byte Chromium). Therefore local prerender/SEO and automated UI/axe runs were blocked by the environment. The application code was not weakened to hide this failure. Temporary route shells used for local browser inspection are not production prerender output and are not committed.
- GitHub's existing validation workflow runs the production build, real Chromium prerender, SEO, functional UI and both-theme axe checks. The new funnel tests are included.
- Real iPhone Safari, Firefox and Edge, cloud lead persistence, Amazon listings, Stripe checkout and SES/S3 delivery still require verification in configured environments.
