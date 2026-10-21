# Validation — 22 October 2026

Validated locally on the final `develop` implementation before push.

| Check | Result |
|---|---|
| Angular production build at `/` | Passed; 374.60 kB raw initial bundle, estimated 94.90 kB transfer |
| Amplify build/prerender command | Passed using packaged Chromium |
| Indexable SEO output | 29 routes; unique titles/descriptions, canonical/social data, schema and sitemap checks passed |
| No-domain preview output | 29 routes; noindex, no guessed canonical, no sitemap; passed |
| Responsive pages | 232 checks: 29 routes × 4 widths (320, 390, 768, 1440) × 2 themes; no horizontal overflow |
| Browser runtime | No captured page errors |
| Automated accessibility | Axe WCAG 2 A/AA, 2.1 AA, 2.2 AA scan on 8 pages × 2 themes; no detected violations |
| Cart/checkout | Totals, quantity, persistence, guest validation, consent, demo failure/cancel/success and retry passed |
| Learning | Incorrect answer gate, correct answer completion, persistent notes/progress and CSV download passed |
| Discovery | Book search, no-result state, unavailable formats, price sorting/filter, course level filter/comparison, direct detail URLs passed |
| Navigation | Keyboard skip link, Escape dismissal, mobile navigation, noindex unknown route passed |

## Local lab observations

Warm local HTTP server, headless Chromium, 390px viewport, no network/CPU throttling. These are single-run observations, not deployed/field Core Web Vitals or a Lighthouse score.

| Page | Observed LCP | Observed CLS |
|---|---:|---:|
| home | 108 ms | 0 |
| books/ | 92 ms | 0 |
| resources/forex-basics/ | 68 ms | 0 |

INP was not measured; deployed performance and real-user monitoring remain required. Automated accessibility does not certify WCAG conformance. Live payment verification, authentication, private content delivery, final catalogue accuracy and AWS host configuration cannot be validated without the corresponding services and business inputs.

The first browser pass caught a 320px title overflow, now fixed with flexible grid sizing and wrapping. Filter controls have explicit accessible names. Final checks passed after those fixes.

Screenshots include homepage, academy, bookstore, a book detail and a free lesson, at 390px and 1440px, in dark and light themes. No real customer or payment information is present.
