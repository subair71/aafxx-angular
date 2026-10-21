# AAFXX frontend handoff

The light-theme Angular frontend includes founder biography, supplied artwork, resource details, persistent cart, checkout details/payment preference/review/local summary, learning workspace, FAQ, privacy and terms.

## Before commercial launch
- Confirm catalogue titles, prices, curricula and actual deliverable files; existing catalogue values were retained for the client presentation.
- Obtain a verified contact inbox; contact currently opens an email draft without a recipient.
- Connect server-side authentication, order persistence, hosted payment checkout and verified webhooks. Never grant access from client-side payment status.
- Connect course progress, ebook delivery and transactional email.
- Review founder-supplied qualifications and performance claims. The site does not guarantee profits.
- Confirm business-specific legal terms, tax/refund policies and privacy requirements.
- Update canonical origin in prerender.mjs and component metadata if the production domain changes; submit sitemap in Search Console after domain verification.

No payment credentials are requested, checkout details stay in memory, and order summaries are explicitly local/unpaid. Cart storage contains only product IDs and quantities.

## Build
npm ci
npm run build -- --base-href /aafxx-angular/
npx playwright install --with-deps chromium
npm run prerender

The Pages workflow generates HTML for public routes plus noindex account/checkout routes. Sitemap excludes transactional routes. On GitHub project Pages, robots.txt lives below the project path; domain-wide robots control requires access to the host root.

## Stitch design branch

`feature/stitch-academy-redesign` implements the supplied light and dark reference designs as Angular templates and CSS. Light is the default; the accessible theme button persists the selected theme in local storage. The shared design covers all 12 routes, cart, resource details, student portal and all checkout steps.

Reference market prices, invented testimonials, reader counts and accreditation claims were not imported. The chart is explicitly illustrative, and the existing AAFXX biography, product catalogue and unpaid checkout behaviour are retained.

The branch-only `Validate academy redesign` workflow runs build, pre-render and UI checks and uploads a review artifact containing static output and mobile/desktop screenshots. It does not deploy GitHub Pages.

## Amplify branch deployment

The root `amplify.yml` builds this branch at `/` and pre-renders all routes. In the Amplify branch environment, set `SITE_ORIGIN` to the exact HTTPS branch URL shown by Amplify (no path). Build output is `dist/aafxx/browser`. The build uses the packaged Chromium binary for Amazon Linux compatibility. Keep this as a separate preview branch; no main-branch merge is required.

For an existing Amplify app with custom build settings, ensure the branch uses the repository `amplify.yml`. Preserve existing production branches and custom domains. The root deployment has route directories for direct navigation, and image URLs follow the configured base path.
