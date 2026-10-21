# AAFXX develop implementation

This implementation is on `develop`; no feature branch or main merge is required. Dark is the default before first paint, with a persistent light option. The existing Angular 20 stack, founder biography, supplied archive, concept covers, theme and cart were retained.

## Reference comparison and design rationale

| Reference | Observed pattern | AAFXX implementation |
|---|---|---|
| [BabyPips](https://www.babypips.com/learn/forex) | Sequential curriculum and progress | Foundations in order, free lessons, knowledge checks and local progress |
| [IG Academy](https://www.ig.com/en/learn-to-trade/ig-academy/courses) | Difficulty levels, exercises and live learning | Filterable courses, comparison, expandable topics, sample lessons and honest webinar availability |
| [Harriman House](https://www.harriman-house.com/category/trading) | Subject-based books, cover presentation and product information | Consistent concept covers, searchable topics, dedicated product URLs and explicit format/availability information |
| [TradingView education](https://www.tradingview.com/students/) | Charts supporting learning and research | Small, clearly illustrative chart alongside a free lesson and book preview; no fabricated live quotes |

The original design uses navy/slate surfaces, readable off-white text, restrained emerald and gold, serif editorial headings and system UI fonts. No competitor assets or copy were imported. External font requests were removed. Existing founder claims are retained as supplied biography, not independently certified credentials. Unverifiable statistics, endorsements and profit promises are not added.

## Implemented journeys

- Shared Home, Academy, Books, Webinars, Resources, About and Contact navigation, mobile menu, theme toggle, cart and learning workspace.
- Homepage: course paths, books, teaching approach, founder, free resources, FAQ and relevant calls to action. No unconfirmed webinar dates or testimonials.
- Catalog search, topic, level, format, language, author and maximum preview-price filters; price sorting, reset and empty states. Only English and the supplied educator currently exist. Print/bundle filters correctly show no results.
- Three dedicated book and three course URLs, prerequisites, audience, sample duration, proposed modules/chapters, related material, availability and publication/access caveats. Prices are illustrative, products not for sale.
- Course comparison, eight original free reading lessons, exercises and one knowledge check per lesson, notes, completion and a downloadable CSV practice journal. Notes and progress are local only.
- Persistent cart with quantities, removal, validated guest details, unpaid summary and explicitly labeled sandbox success/failure/cancel/retry. Sandbox results never grant real paid access. No payment details collected. Demo receipt and links to free samples are available in the workspace for the current session.
- Webinar page with a real empty state, contact draft flow and no fictitious registration.
- Public route titles/descriptions, canonical and social metadata, breadcrumb schema, preview Book/Course schema without offers or reviews, LearningResource schema, sitemap, noindex transactional/404 routes and a static 404 document.

## Run and verify

```sh
npm ci
npm run build -- --base-href /
SITE_ORIGIN=https://your-confirmed-domain.example npm run prerender:amplify
SITE_ORIGIN=https://your-confirmed-domain.example node scripts/check-seo.mjs
SITE_BASE=/ CHROME_PATH=/tmp/chromium node scripts/check-ui.mjs
```

The last command can use an installed Playwright Chromium instead by omitting CHROME_PATH. For GitHub project Pages, build with `/aafxx-angular/` and run `npm run prerender`; the existing main deployment is unchanged. CI now validates pushes to `develop` and uploads screenshots/static output. It does not deploy main.

`amplify.yml` runs the scripts that actually exist and publishes `dist/aafxx/browser`. The packaged Chromium is extracted by `prerender:amplify`. Set `SITE_ORIGIN` to the exact HTTPS origin in Amplify, without path or trailing components. If unset, the build succeeds as a noindex preview, with no guessed canonical or sitemap. `example.org` is used solely as an offline validation fixture, not in production source or deployment settings.

The prerender manifest covers 29 routes. Static nested route files support direct loads. Configure the host to serve `404.html` with HTTP 404 for unknown paths; do not redirect every missing URL to the homepage with HTTP 200. An existing Amplify console-wide rewrite may need adjustment outside this repository.

## Required before live commercial launch

1. Confirm book titles, prices, manuscripts, cover rights, publication dates, ISBNs, formats and licence terms. Current covers and catalogue are explicitly preview-only.
2. Confirm paid curricula, instructor approvals, duration, languages, access periods and any completion-certificate policy. Free lessons are introductory website content, not extracts of the founder’s unpublished books.
3. Supply a verified support inbox, legal business identity, support hours and reviewed privacy/refund/cancellation terms. The current contact form opens a draft with no recipient.
4. Connect an identity provider, server-side orders and hosted payment checkout. Calculate prices/taxes on the server; verify signed, idempotent payment webhooks and grant access only from verified order state. No client-side sandbox value is an entitlement.
5. Add protected storage, authorization per resource, expiring signed downloads, progress sync and transactional email. Real purchases currently remain locked.
6. Confirm countries, currencies and payment methods actually supported. Physical shipping, print editions and bundles are unavailable, rather than simulated.
7. Supply confirmed event dates, instructor, time zone, capacity and registration service before publishing webinars.
8. Confirm the production domain, host 404 behavior, Search Console ownership and any analytics/consent requirements. No live market-data service is connected.

## Quality limits

Automated functional, overflow, metadata and keyboard checks are recorded in `VALIDATION.md`. Accessibility targets WCAG 2.2 AA; automated tests do not certify full conformance. Local lab LCP/CLS observations are not field Core Web Vitals. INP and deployed network performance require real deployment/user measurement; no unmeasured scores are claimed.
