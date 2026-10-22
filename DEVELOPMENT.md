# AA FXX education and book marketing platform

Implementation target: `develop`. Angular 20 is retained. No `main` merge or hosting configuration change is required by this work.

## Source audit and decisions

The starting branch contained a single standalone Angular component with pathname-based navigation, six preview catalogue entries, eight original lessons, supplied founder documents, SVG concept covers, SEO/prerender tooling and AWS Amplify configuration. There was no verified contact recipient, enquiry backend, real checkout, identity provider or confirmed commercial catalogue. The previous prices were illustrative and its checkout was a sandbox.

The application now uses one coherent navy/teal design with dark as the first-paint default, a persistent light option, compact mobile navigation, restrained chart artwork, responsive cards, CSS transitions and reduced-motion overrides. Existing local images and catalogue URLs are retained. No external font or market-data request is needed.

## Pages and journeys

- Home: learning pathway, proposed course highlights, book concepts, learning approach, original guides, FAQ and enquiry CTA.
- `/courses/`: search, level, topic and learning-format filters with truthful empty states. No confirmed live/self-paced programmes are implied.
- `/books/`: searchable, topic/level-filtered concept catalogue. Three existing detail URLs retain labelled placeholder covers. No invented prices, stock, authorship, formats, editions or purchase buttons.
- Six detail pages: proposed topics/outcomes, audience, prerequisites, module-related free guides, related listings, FAQs and title-specific enquiry links.
- `/resources/`: eight expanded original introductory guides, topic/search filters, related reading, breadcrumbs, knowledge questions and a CSV practice journal. No login, paid access or progress dashboard is shown.
- About, supplied archive, learning frameworks, FAQ, privacy information and terms remain accessible.
- Old `/checkout/` and `/account/` URLs show truthful unavailable-service pages with alternatives and `noindex`. Webinars show no confirmed event dates. No simulated transaction or certificate/access entitlement remains.
- `/academy/` and its three detail aliases have prerendered documents and canonicals pointing to the preserved `/courses/` URLs. Unknown routes render a noindex 404 page.

## Enquiries and required business input

`src/app/enquiry-config.ts` has an intentionally empty `email`. Only populate it with a business-approved, verified address. With a verified address, the form opens an addressed email draft; it does not claim delivery. Without one, the form validates name, reply email and message, then copies or downloads a text enquiry for the visitor to share with an existing academy contact. Clipboard rejection has a download fallback. Selection is stored in the contact URL so it survives refresh and shared links. Form details are not sent to a server or saved in local storage.

Still required from the business:

1. Verified public contact channel and legal/privacy contact information. Direct delivery cannot be enabled from the repository's current information.
2. Approved course titles, curriculum, instructors, format, duration, schedules, fees and availability. Existing entries remain explicitly proposed learning paths.
3. Confirmed book authorship, publication rights, manuscript descriptions, licensed covers, language, edition, formats, prices, availability and retailer links. Existing concepts are not presented as available inventory.
4. Exact production `SITE_ORIGIN` in Amplify to enable production canonicals and sitemap. No domain is guessed.

## SEO, hosting and performance

Unique titles/descriptions, canonical URLs, Open Graph/Twitter metadata, semantic headings and breadcrumb/website/learning-resource schema are updated on navigation and present in generated HTML. Concept listings do not emit Book/Course offers, ratings or unverified product schema.

`amplify.yml` references `build` and `prerender:amplify`, both present and exercised. An absent `SITE_ORIGIN` deliberately generates a noindex preview without guessed canonical URLs or sitemap. With an HTTPS origin configured, indexable public routes receive a sitemap. Legacy transaction/account and 404 URLs are excluded. Configure hosting to return `404.html` with status 404 for missing URLs; an Amplify console rewrite can override this and needs deployment-level verification.

The final application is approximately 303 kB raw / 82 kB estimated compressed including Angular and polyfills. The existing small single-component routing approach is preserved instead of adding a routing dependency solely for code splitting. Local SVG covers, system fonts, lazy archive/catalogue images and CSS-only animation keep requests light.

## Commands

```sh
npm ci
npm run build -- --base-href /
SITE_ORIGIN=https://YOUR-VERIFIED-DOMAIN npm run prerender:amplify
SITE_ORIGIN=https://YOUR-VERIFIED-DOMAIN npm run check:seo
SITE_BASE=/ CHROME_PATH=/tmp/chromium npm run check:ui
SITE_BASE=/ CHROME_PATH=/tmp/chromium npm run check:a11y
```

For GitHub project Pages, the existing workflow builds `/aafxx-angular/` and uses `npm run prerender`. Validation on `develop` continues to upload built HTML and screenshots; it does not publish `main`.
