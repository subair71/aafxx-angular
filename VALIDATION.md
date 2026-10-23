# Validation — AAFXX `dev-aafxx`

Status snapshot: **23 October 2026**. This report describes the current implementation work; it does not carry forward results from the earlier `develop` design.

| Source item | Value |
| --- | --- |
| Repository | `subair71/aafxx-angular` |
| Implementation branch | `dev-aafxx` |
| Base `origin/develop` commit | `4542b9ecb2d1e6c2d418385ac121bd37058add97` |
| Final implementation commit / push verification | **Pending** — record the actual committed revision and remote result in the final delivery report |
| Existing branch deployment | Existing `develop` deployment is not repointed by this implementation |
| New AWS branch deployment | **Not performed or verified** |

## Completed local checks

| Check | Result | Scope and limits |
| --- | --- | --- |
| Angular optimized build at root base href | **Passed** | Latest reported output: **384.89 kB initial**, **94.72 kB estimated transfer**. An Angular estimate, not field performance. |
| Configuration and route-boundary tests | **7 passed** | Default preview/test state, inherited production/live settings, approved-origin requirements, invalid origins/base paths and excluded sitemap routes. |
| Commerce client tests | **8 passed** | Selected SKU and amount, invalid/tampered URLs, unverified references, test/live gating, bundle/fulfilment readiness and genuine form acknowledgements. |
| Optional backend tests | **15 passed** | Local Stripe signature verification and injected storage/email adapters; payment tampering, delayed and repeated events, delivery leases, revocation, private token expiry/recovery, shipping and bundle restrictions. |
| Amplify-style static prerender | **Passed** | The actual `npm run prerender:amplify` command generated **43 route documents** for the current build. |
| Generated preview SEO | **Passed** | `npm run check:seo -- --preview` passed across **43 rendered URLs / 33 canonical pages**, including development indexing and sitemap exclusions. |
| Patch whitespace | **Passed** | `git diff --check` found no whitespace errors at the reported snapshot. |

These tests do not call live Stripe checkout, provision AWS resources, upload paid content, send customer email, or prove hosted integration behavior.

## Pending final verification

Observed browser review and isolated metadata results are recorded below. CI-only checks remain pending until their actual run completes. Updating a test script or producing a build is not evidence that every check below passed.

| Check | Current status |
| --- | --- |
| Explicit production-metadata fixture and sitemap validation | **Passed** — isolated temporary output at `https://example.org`, 43 rendered URLs and 25 sitemap entries; development output unchanged |
| Current desktop/mobile visual review through the available browser | **Passed for the reviewed Chromium views** — desktop home/shop/detail/contact; 320/390 CSS-pixel iframe layouts; no overflow in the three narrow views; light theme, format/price, search, encoded enquiry subject, unavailable form sending, mobile-menu focus/Escape and skip-link focus checked |
| Current browser-functional regression run | **Pending** |
| Current automated WCAG 2.2 AA-tagged axe run | **Pending** |
| Current GitHub Actions result for the final pushed commit | **Pending** |
| Real iPhone Safari/device testing | **Not performed** |
| Desktop Safari, Android Chrome, Firefox and Edge device/browser coverage | **Not verified** |
| Field LCP, CLS and INP, or a repeatable Lighthouse measurement | **Not measured** |

A desktop browser capture is retained as [design-preview.jpg](docs/design-preview.jpg). It shows the interim text wordmark, because the original logo was not supplied. Narrow-screen review used real iframe layout widths in Chromium; it does not establish iPhone Safari compatibility.

The route manifest contains **43 rendered URLs**, comprising **33 canonical pages and 10 compatibility aliases**. A configured production sitemap can contain **25 public entries**. Checkout, account, 404 and the three pending policy pages are excluded and `noindex`; compatibility aliases are excluded. Development has no sitemap and remains `noindex` throughout.

## Automated browser checks prepared for CI

The current scripts cover four book cards, search, PDF/Print selected states and prices, blocked unconfigured checkout, book deep links and refresh, native enquiry links containing ampersands, valid/invalid contact drafts, actual clipboard/download behavior, course and resource filters, quiz feedback, practice-journal downloads, unavailable waitlist submission, legacy URL compatibility, unknown pages, mobile navigation, reduced motion, and layout/image checks at 320/390/1440 widths.

The accessibility script scans eight representative pages in both dark and light themes. Its planned 16 scans must not be described as passed until the run completes. Automated scans cannot establish complete WCAG conformance or replace keyboard and assistive-technology review.

## External launch dependencies and explicit limits

- **Original assets:** only the text brief was attached. The original logo, four book covers, final paid PDFs and A3 Checklist artwork were not available. Existing certificate/biography assets were not misidentified as these deliverables.
- **Stripe:** no actual merchant Payment Links, verified product/price objects or live configuration are present. Purchasing is unavailable. No test or live charge has been performed.
- **PDF fulfilment:** source code and local tests exist, but the private storage, real files, signed webhook, sender identity, email receipt, expired-link recovery and server persistence have not been verified in a deployed account.
- **Printed books:** countries, rates, inventory/dispatch arrangements and merchant fulfilment remain unconfirmed. Printed checkout is unavailable.
- **Bundle:** USD 97 is supplied, but format and exact contents require merchant confirmation before purchasing or a savings claim is enabled.
- **Forms:** contact/waitlist clients and backend source exist. Without a deployed endpoint and approved privacy handling, online submission is disabled. Local enquiry copying/downloading is not sent to the academy.
- **Policies and contact:** final merchant policy terms, responsible business contact and verified social destinations remain pending.
- **Hosting:** no `dev-aafxx` Amplify branch deployment or actual preview URL has been verified. Shared rewrite rules, route HTML, asset MIME types and HTTP 404 status require testing on the deployed branch. Production DNS is unchanged.

Production availability, delivery, security and performance must be reported from observed integration results. A repository push, local test, browser redirect, successful build or generic hostname does not establish those outcomes.
