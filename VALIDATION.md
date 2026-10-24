# Validation — AAFXX `dev-aafxx`

Status snapshot: **23 October 2026**. Current local verification for the supplied logo and covers is recorded separately from the earlier full CI baseline; historical results are not presented as new passes.

| Source item | Value |
| --- | --- |
| Repository | `subair71/aafxx-angular` |
| Implementation branch | `dev-aafxx` |
| Base `origin/develop` commit | `4542b9ecb2d1e6c2d418385ac121bd37058add97` |
| Last fully validated application revision, before the original-asset update | `0272a281fd1ce47c8f07d4cba98acb8c9e2934e2` — published and fetched successfully; remote and locally verified file trees match |
| Publication boundary | `origin/dev-aafxx` only; `develop` remains at the base above and `main` at `52609d43e4a5ed6e6769c723a00d2ee2102b8d69` |
| Existing branch deployment | Existing `develop` deployment is not repointed by this implementation |
| New AWS branch deployment | **Not performed or verified** |

## Original-asset update — completed local verification

The original AAFXX logo JPEG (1600 × 1600) and four book-cover JPEGs (1066 × 1599 each) have now been supplied. The source update retains byte-exact originals, uses optimized web derivatives and maps covers by their visible titles. [docs/ASSETS.md](docs/ASSETS.md) records the source filenames and mapping.

| Asset-update check | Result |
| --- | --- |
| Optimized Angular build | **Passed** — 389.96 kB initial bundle total / 95.31 kB estimated transfer; images are separate assets |
| Actual Amplify-style prerender | **Passed** — 43 rendered route documents |
| Generated preview SEO | **Passed** — 43 rendered URLs / 33 canonical pages; development noindex/test settings retained |
| Generated image references and dimensions | **Passed** — 44 HTML files including the standalone 404, 148 image elements, all linked local assets present; full and thumbnail covers retain 2:3 proportions |
| Original-file and title mapping | **Passed** — five byte-exact originals retained and all four detail-page cover mappings verified |
| New interactive browser review / screenshot | **Not performed** — the available browser rejected the preview observation through its URL policy; no alternate browser path was used |
| New CI browser/accessibility run | Results are not claimed at this local snapshot; the existing workflow runs automatically after publication |

The complete earlier CI results below remain explicitly historical. The current build and source inspection do not establish hosted browser behavior or real-device compatibility.

## Completed local checks — prior baseline

| Check | Result | Scope and limits |
| --- | --- | --- |
| Angular optimized build at root base href | **Passed** | Baseline reported output: **384.88 kB initial bundle total**, **94.75 kB estimated transfer**. An Angular estimate, not field performance. |
| Configuration and route-boundary tests | **7 passed** | Default preview/test state, inherited production/live settings, approved-origin requirements, invalid origins/base paths and excluded sitemap routes. |
| Commerce client tests | **9 passed** | Selected SKU and amount, invalid/tampered URLs, unverified references, test/live gating, bundle/fulfilment readiness, genuine form acknowledgements and an unavailable BenefitPay adapter. |
| Optional backend tests | **15 passed** | Local Stripe signature verification and injected storage/email adapters; payment tampering, delayed and repeated events, delivery leases, revocation, private token expiry/recovery, shipping and bundle restrictions. |
| Amplify-style static prerender | **Passed** | The actual `npm run prerender:amplify` command generated **43 route documents** for the baseline build. |
| Generated preview SEO | **Passed** | `npm run check:seo -- --preview` passed across **43 rendered URLs / 33 canonical pages**, including development indexing and sitemap exclusions. |
| Patch whitespace | **Passed** | `git diff --check` found no whitespace errors at the reported snapshot. |

These tests do not call live Stripe checkout, provision AWS resources, upload paid content, send customer email, or prove hosted integration behavior.

## Completed baseline verification and coverage limits

Observed baseline browser review, isolated metadata results and the completed GitHub Actions run are recorded below. [Run 39995619440](https://github.com/subair71/aafxx-angular/actions/runs/39995619440) succeeded on the exact validated application revision above, before the original-asset update. Hardware/browser and field-performance gaps remain explicit.

| Check | Baseline status |
| --- | --- |
| Explicit production-metadata fixture and sitemap validation | **Passed** — isolated temporary output at `https://example.org`, 43 rendered URLs and 25 sitemap entries; development output unchanged |
| Baseline desktop/mobile visual review through the available browser | **Passed for the reviewed Chromium views** — desktop home/shop/detail/contact; 320/390 CSS-pixel iframe layouts; no overflow in the three narrow views; light theme, format/price, search, encoded enquiry subject, unavailable form sending, mobile-menu focus/Escape and skip-link focus checked |
| Browser-functional regression | **Passed** — 9 functional check groups, 129 route/viewport combinations at 320/390/1440 widths, no reported JavaScript errors; run 39995619440 |
| Automated WCAG 2.2 AA-tagged axe run | **Passed** — eight representative pages in dark and light themes, 16 completed scans with no reported violations; run 39995619440 |
| Recorded GitHub Actions result | **Success** — run 39995619440 passed all 31 configuration/commerce/backend tests, optimized build, prerender, SEO, browser-functional checks and axe scans; validation artifacts uploaded successfully |
| Real iPhone Safari/device testing | **Not performed** |
| Desktop Safari, Android Chrome, Firefox and Edge device/browser coverage | **Not verified** |
| Field LCP, CLS and INP, or a repeatable Lighthouse measurement | **Not measured** |

A baseline desktop browser capture is retained as [design-preview.jpg](docs/design-preview.jpg). It predates receipt of the original logo and covers and is not a screenshot of the current asset update. The earlier narrow-screen review used real iframe layout widths in Chromium; it does not establish iPhone Safari compatibility.

The route manifest contains **43 rendered URLs**, comprising **33 canonical pages and 10 compatibility aliases**. A configured production sitemap can contain **25 public entries**. Checkout, account, 404 and the three pending policy pages are excluded and `noindex`; compatibility aliases are excluded. Development has no sitemap and remains `noindex` throughout.

## Automated browser coverage

The current scripts cover four book cards, search, PDF/Print selected states and prices, blocked unconfigured checkout, book deep links and refresh, native enquiry links containing ampersands, valid/invalid contact drafts, actual clipboard/download behavior, course and resource filters, quiz feedback, practice-journal downloads, unavailable waitlist submission, legacy URL compatibility, unknown pages, mobile navigation, reduced motion, and layout/image checks at 320/390/1440 widths.

On the recorded baseline, the accessibility script completed all 16 scans across eight representative pages in both dark and light themes, with no reported violations. Automated scans cannot establish complete WCAG conformance or replace keyboard and assistive-technology review.

## External launch dependencies and explicit limits

- **Remaining content assets:** the original logo and four covers are now supplied. Final paid PDFs and A3 Checklist artwork remain unavailable. Existing certificate/biography assets remain separate from the newly supplied originals.
- **Stripe:** no actual merchant Payment Links, verified product/price objects or live configuration are present. Purchasing is unavailable. No test or live charge has been performed.
- **PDF fulfilment:** source code and local tests exist, but the private storage, real files, signed webhook, sender identity, email receipt, expired-link recovery and server persistence have not been verified in a deployed account.
- **Printed books:** countries, rates, inventory/dispatch arrangements and merchant fulfilment remain unconfirmed. Printed checkout is unavailable.
- **Bundle:** USD 97 is supplied, but format and exact contents require merchant confirmation before purchasing or a savings claim is enabled.
- **Forms:** contact/waitlist clients and backend source exist. Without a deployed endpoint and approved privacy handling, online submission is disabled. Local enquiry copying/downloading is not sent to the academy.
- **Policies and contact:** final merchant policy terms, responsible business contact and verified social destinations remain pending.
- **Hosting:** no `dev-aafxx` Amplify branch deployment or actual preview URL has been verified. Shared rewrite rules, route HTML, asset MIME types and HTTP 404 status require testing on the deployed branch. Production DNS is unchanged.

Production availability, delivery, security and performance must be reported from observed integration results. A repository push, local test, browser redirect, successful build or generic hostname does not establish those outcomes.

## Sales funnel update — 24 October 2026

- Production Angular compilation passed; initial estimated transfer is about 105 kB.
- Build configuration (7), commerce (9), sales funnel (5) and backend (21) tests passed: **42 tests total**. Backend syntax checks and `git diff --check` passed.
- Cloud Chrome verified the home/shop pricing, four-book cards, paperback selector changing to $47, correct book/format launch-registration destination, bundle interest destination, pending registration messaging and actual supplied author photograph.
- A temporary iframe harness rendered the catalogue at 320 / 390 / 768 px. The DOM widths were 305 / 375 / 753 px after scrollbars; each matched its scroll width (no horizontal overflow). The 390 px bundle action displayed the bundle-specific registration note.
- Real device Safari, Firefox and Edge were not available. Do not interpret responsive Chromium rendering as native iPhone verification.
- Local browser automation/prerender was blocked by Chromium extraction/runtime failure in this executor (`EINVAL chown /tmp/fonts`, then empty Chromium executable). Automated local SEO/UI/axe results are **not claimed**. Existing GitHub CI retains those checks and now includes the new funnel suite.
- Temporary QA harnesses and route shells live only in ignored build output; they are not shipped or used as proof of production prerender success.
- Paid delivery, cloud lead persistence, signed production webhooks, email delivery and live Amazon URLs remain unverified and disabled pending merchant setup. See `docs/SALES_FUNNEL.md` for exact destinations and all pending inputs.
