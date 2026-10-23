# AAFXX Trading Academy & Books Shop

Angular 20 website for **AAFXX – Anybody Wins Trading Academy**, founded by **Prince Prof. Berthram Chidi Eke**. The current implementation uses a black-and-gold design with a dark default, a persistent light option, responsive navigation, four merchant-specified books, and retained introductory learning resources.

## Current implementation branch

- Repository: `subair71/aafxx-angular`
- Implementation: **`dev-aafxx` only**
- Base: latest fetched `origin/develop` at **`4542b9ecb2d1e6c2d418385ac121bd37058add97`**
- No merge into `develop` or `main` is part of this work.
- A separate AWS Amplify deployment has **not been performed or verified**. The existing `develop` deployment is not a target for these changes.

## Included experience

- Home, Books Shop, four book detail pages, academy learning paths, Standard Checklist overview, founder/about, contact, FAQ and policy structures.
- Eight preserved free learning guides with search, topic filters, practice questions and a downloadable study journal.
- PDF/Print selection with USD 27 / USD 47 pricing and stable, format-specific product identifiers.
- A USD 97 four-book bundle whose contents and delivery remain gated on merchant confirmation.
- Centralized Stripe Payment Link configuration with test/live separation and unavailable states when payment or fulfilment is not ready.
- Expert Advisors page announcing the planned 2027 release, with a consent-based waitlist interface.
- Real HTTP clients for contact/waitlist submissions and an optional, **undeployed** AWS backend for storage, signed payment webhooks, private PDF delivery and recovery.
- Route-specific SEO, static prerendering, legacy URL compatibility, development `noindex`, and meaningful automated checks.

| Book | Subtitle | PDF | Print |
| --- | --- | --- | --- |
| ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE | The AAFXX Standard Checklist | USD 27 | USD 47 |
| FOREX LOW IN, MIDDLE OUT | The 5M/15M Execution Bible | USD 27 | USD 47 |
| BBB FLOW & LEADER ALIGNMENT | Mastering Trend Flow | USD 27 | USD 47 |
| PROF STANDARD | 1000 Wealth Creators Playbook | USD 27 | USD 47 |

All four books are attributed to Prince Prof. Berthram Chidi Eke. The USD 97 bundle's format is unconfirmed; it must not be described as a print bundle or advertised with an unsupported saving.

## Development design preview

![Current AAFXX development homepage](docs/design-preview.jpg)

Browser capture of the implemented homepage. The text wordmark and labelled artwork placeholders remain until the original assets are supplied. This is a local development preview, not a verified Amplify deployment.

## Run locally

Use Node.js 22 and the committed lockfiles.

```bash
npm ci
npm start
```

The ordinary Angular development server uses `http://localhost:4200`.

```bash
npm run check:config
npm run check:commerce
npm ci --prefix backend
npm --prefix backend test
npm run build -- --base-href /
npm run prerender:amplify
npm run check:seo -- --preview
```

The build output is `dist/aafxx/browser`. Builds default to a development environment: no search indexing, no guessed canonical domain, and test-mode payment configuration. An explicit approved production origin and production environment are needed for indexable output. `dev-aafxx` cannot enable indexing or live payments through inherited Amplify app settings.

## What is still required for launch

**Purchasing, paid PDF delivery, printed-book fulfilment, and online enquiry/waitlist registration are not operational in the supplied configuration.** The website shows unavailable states honestly and does not simulate payment, registration, delivered enquiries, or downloads.

Only the text brief was attached for this implementation. The original AAFXX logo, four original book covers, final paid PDFs and A3 Checklist artwork were not available. Existing certificate/biography artwork remains in the repository and is not relabelled as those missing assets.

Launch also requires merchant-verified Stripe links and product/price mappings, confirmed bundle contents, print destinations/rates/dispatch arrangements, approved policies and contact details, deployed backend services, genuine end-to-end integration tests, and verified branch hosting. The mission of 1000 Wealth Creators remains an educational aspiration, not a claim of achieved or guaranteed financial results.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture and scope, [VALIDATION.md](VALIDATION.md) for measured results and pending checks, [docs/COMMERCE_SETUP.md](docs/COMMERCE_SETUP.md) for integration setup, and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the isolated Amplify deployment process.
