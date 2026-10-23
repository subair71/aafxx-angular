# AAFXX `dev-aafxx` implementation

## Branch boundary and starting point

Implementation target: **`dev-aafxx`**, created from the latest fetched `origin/develop` at **`4542b9ecb2d1e6c2d418385ac121bd37058add97`**. Angular 20, the existing repository, static prerendering and AWS Amplify hosting model are retained. The work must be committed and pushed only to `dev-aafxx`; merging into `develop` or `main`, replacing the existing `develop` deployment, and changing production DNS are outside this implementation.

The starting branch had a standalone Angular shell with pathname-based navigation, proposed learning paths, eight free lessons, three illustrative book concepts, founder/certificate artwork, draft-only enquiries and SEO tooling. It did not have verified payment links, paid PDFs, shipping configuration, a functioning enquiry backend or the four newly specified cover assets.

## Design and content decisions

The application now follows the supplied black/charcoal, white and gold (`#D4AF37`) direction. Dark remains the initial theme, with the existing saved light preference respected. The layout uses system body fonts, an editorial serif display treatment, local SVG icons, thin borders, restrained chart-inspired decoration, responsive product cards, touch-friendly controls and reduced-motion support. No external market-data feed or global Stripe.js dependency is required.

The merchant's four titles, subtitles, author, USD prices and named methodologies replace the former illustrative book concepts. The original logo, book covers and Checklist screenshot remain missing, so the application uses clearly labelled artwork-pending spaces and a text brand treatment. It does not claim that the official assets have been integrated. Original certificate/biography files remain preserved in the repository; they are not presented as independently verified credentials, trading performance evidence or the new books' covers.

The 1000 Wealth Creators mission is an aspiration. Academy paths remain proposed, with no invented curriculum, confirmed teaching format, enrolment price, student count or result. Expert Advisors remain a 2027 waitlist concept without sales or backtest claims.

## Source map

| Area | Main source |
| --- | --- |
| Shell, pathname navigation and page content | `src/app/app.component.ts`, `.html`, `.css` |
| Shared palette, typography and focus/motion behavior | `src/styles.css` |
| Four-book catalogue, eight edition SKUs and bundle price | `src/app/catalogue.ts` |
| Reusable book cards and format selectors | `src/app/book-card.component.ts`, `.css` |
| Local SVG icon component and attribution | `src/app/icon.component.ts`, `public/assets/icons/` |
| Public merchant integration settings | `src/app/integration-config.ts` |
| Payment readiness and HTTP submission clients | `src/app/commerce.ts` |
| Preserved introductory guides and course metadata | `src/app/learning-content.ts` |
| Page metadata and truthful structured data | `src/app/seo.ts` |
| Build configuration, prerendering and route manifest | `scripts/` |
| Optional private AWS integration backend | `backend/` |

The application preserves its small existing navigation approach instead of introducing a framework migration. Native anchors remain usable for copying links and opening new tabs. Compatibility paths resolve to the new canonical page structure, and transaction/account/unknown pages do not grant access or imply a completed action.

## Pages and compatibility

The new primary routes are `/`, `/books/`, four `/books/:slug/` pages, `/academy/`, `/checklist/`, `/about/`, `/expert-advisors/`, `/contact/`, `/checkout/success/`, `/checkout/cancel/`, `/privacy-policy/`, `/terms/` and `/refund-policy/`.

The three existing `/courses/:slug/` detail routes, eight `/resources/:slug/` guides, resources listing, FAQ, webinar availability, legacy checkout and account information remain accessible. Course search/level/topic/format filters, resource filtering, quiz feedback and the practice-journal download are retained.

Compatibility redirects are client-side URL replacements backed by generated HTML, not claimed HTTP 301 responses:

| Previous path | Canonical path |
| --- | --- |
| `/courses/` | `/academy/` |
| `/privacy/` | `/privacy-policy/` |
| `/strategies/` | `/checklist/` |
| `/achievements/` | `/about/` |
| Three former concept-book detail URLs | `/books/` |
| `/academy/:existing-course-slug/` | `/courses/:existing-course-slug/` |

The route manifest contains **43 rendered URLs: 33 canonical pages and 10 aliases**. Only **25** are possible production sitemap entries. Checkout, account, 404 and the three pending policy pages are `noindex` and excluded; aliases are also excluded. Development output has no sitemap at all.

## Commerce and form boundaries

`catalogue.ts` centralizes all book information and formats. An edition's selected SKU resolves to one validated Payment Link with matching USD amount, Stripe product/price IDs and test/live environment. PDF readiness requires genuine private content and a verified delivery workflow. Print readiness requires approved shipping and fulfilment. The USD 97 bundle additionally requires an exact confirmed edition of each of the four books. Missing prerequisites keep Buy Now unavailable.

`integration-config.ts` contains public identifiers and readiness flags only. Every flag starts false or empty. Secret Stripe keys, webhook secrets, AWS credentials and download-signing secrets belong on the server. A browser redirect or `paid=true` query parameter never verifies a payment or unlocks a PDF.

Contact and waitlist interfaces use real HTTPS submission clients. Success requires an explicit accepted acknowledgement from the backend. Until configured, contact allows a validated local copy/download only; those actions say that nothing was sent. Waitlist registration remains unavailable. No invented email address, phone number or unverified clickable social profile is published.

The optional backend supplies durable form storage, consent checks, abuse controls, authenticated Stripe events, idempotent paid entitlements, private expiring PDF links and recovery to the original order email. Its tests use local adapters and fixture events. The SAM template has **not been deployed**, no genuine PDF has been uploaded, no receipt has been sent, and no live Stripe transaction has been performed. Receipt email can be retried after a partial storage failure; exactly-once inbox delivery is not claimed. Print dispatch and refund/customer-service operations remain merchant responsibilities.

Configuration fields, prerequisites and deployment instructions are documented in [docs/COMMERCE_SETUP.md](docs/COMMERCE_SETUP.md).

## SEO, build and hosting

`updateSeo()` maintains page-specific titles/descriptions, Open Graph metadata, canonical paths, breadcrumbs, and appropriate Organization/WebSite/Book/Product/LearningResource entities. Offers are included only for validated live checkout destinations; no ISBN, review, rating, inventory quantity or independent credential is invented.

`npm run build` runs Angular's optimized build and writes safe public environment metadata into the resulting HTML. `prerender:amplify` uses the existing packaged Chromium approach to generate static HTML for every supported route. A `404.html` fallback is generated. The build process uses an ephemeral server rather than the visual preview port.

All unconfigured builds default to `noindex` and test payments. `AWS_BRANCH=dev-aafxx` and other nonproduction Amplify branches cannot become indexable or live merely through inherited app settings. A future indexable build requires `SITE_ENVIRONMENT=production` and an approved HTTPS `SITE_ORIGIN`; missing origin fails explicitly. `SITE_BASE` must match the Angular base href.

The latest measured optimized build at this documentation snapshot was **384.88 kB initial JavaScript**, with **94.75 kB estimated transfer size** reported by Angular. This estimate is not a measured download size, Lighthouse score or field Core Web Vitals result. LCP, CLS and INP targets remain goals until measured under an identified environment.

The existing Amplify app and `develop` deployment have not been changed. Connecting `dev-aafxx`, verifying its actual returned URL, checking shared rewrite scope and confirming deployed HTTP 404 behavior remain external steps. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Commands and CI

```bash
npm ci
npm run check:config
npm run check:commerce
npm ci --prefix backend
npm --prefix backend test
npm --prefix backend run check
npm run build -- --base-href /
npm run prerender:amplify
npm run check:seo -- --preview
```

The `Validate AAFXX academy and shop` workflow includes pushes to `dev-aafxx`. It runs configuration, commerce, backend, build, generated-SEO, browser-functional and automated accessibility checks with read-only repository permissions, and uploads review artifacts. It does not deploy this branch. The existing Pages deployment workflow has not been expanded to include `dev-aafxx`.

Do not interpret an implemented workflow as a passed run. The current evidence and outstanding checks are recorded in [VALIDATION.md](VALIDATION.md).
