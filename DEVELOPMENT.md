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
