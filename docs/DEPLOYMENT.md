# AAFXX `dev-aafxx` deployment

## Branch and hosting boundaries

Work starts from `origin/develop` commit `4542b9ecb2d1e6c2d418385ac121bd37058add97`.
Implementation belongs only to `dev-aafxx`. Neither the existing `develop` branch nor `main` is a deployment target for this change. The existing development site supplied in the brief is `https://develop.d1xofga5gcylou.amplifyapp.com`.

This project retains Angular 20 and the existing static prerendering approach. It does not require an Angular SSR runtime, a new hosting provider, or a replacement Amplify application.

The separate Amplify deployment is not verified merely by pushing code. Read its actual URL and successful job from Amplify after connecting the branch. Do not infer a working URL from its expected hostname.

## Add the branch in the existing Amplify app

1. Push and verify `dev-aafxx` in `subair71/aafxx-angular`.
2. In the existing Amplify application, open **App settings → Branch settings → Add branch**. Choose **dev-aafxx** and add it.
3. Under **Hosting → Environment variables → Manage variables**, add branch overrides specifically for `dev-aafxx`. Do not modify shared values used by `develop` or `main`.
4. Use the repository's `amplify.yml`. It installs the lockfile with Node 22, checks environment isolation, builds at `/`, prerenders, and validates generated metadata. The artifact directory is `dist/aafxx/browser`.
5. Start that branch's build. Confirm the completed job, the actual deployed branch URL, and the checks below. Do not alter production DNS.

AWS documentation: [Feature branch deployments](https://docs.aws.amazon.com/amplify/latest/userguide/multi-environments.html); [branch environment overrides](https://docs.aws.amazon.com/amplify/latest/userguide/setting-env-vars.html).

## Public build variables

| Variable | `dev-aafxx` | Future approved production |
| --- | --- | --- |
| `SITE_ENVIRONMENT` | `development` | `production` |
| `SITE_PREVIEW` | `true` | Unset or `false` |
| `SITE_ORIGIN` | Unset; no guessed origin | Exact approved HTTPS origin, without a path |
| `PAYMENT_ENVIRONMENT` | `test` | `live` only after merchant approval and successful end-to-end testing |
| `AWS_BRANCH` | Set by Amplify | Set by Amplify |

`dev-aafxx` and every other nonproduction Amplify branch are forced to `noindex` and test payment mode even when the application inherits production values. Indexable output requires an explicit production environment and a valid approved origin. Missing production origin fails the build instead of silently using another site. Development HTML contains `noindex,follow`, no production canonical, no guessed social URL, and no sitemap.

`SITE_BASE` must agree with the Angular base href. The Amplify wrapper sets it to `/`. The generic build also supports a subpath, for example the existing GitHub Pages path, provided both settings agree.

Only public settings are injected into HTML. Do not put Stripe secret keys, webhook signing secrets, private PDF URLs, AWS keys, or mail credentials in Angular configuration or frontend build variables. The commerce integration guide describes the separate server configuration.

## Build and validation

From the repository root:

```bash
npm ci
npm run check:config
npm run check:commerce
npm ci --prefix backend
npm --prefix backend test
npm run build -- --base-href /
npm run prerender:amplify
npm run check:seo -- --preview
```

The build generates `build-environment.json` and `prerender-report.json` alongside the static output. They contain public configuration and route counts, not credentials. Prerendering uses an ephemeral local build server so it does not occupy the visual preview port.

The GitHub validation workflow includes pushes to `dev-aafxx` and runs configuration, commerce, backend, generated-SEO, browser and accessibility checks. It has read-only repository permissions and no deployment step. The existing GitHub Pages deployment workflow is not expanded to include this branch.

`check:ui` verifies format and price changes, blocked unconfigured checkout, product deep links, old URL compatibility, forged success-query behavior, navigation, reduced motion, image decoding, and layout at representative widths. `check:a11y` scans representative pages in dark and light themes with WCAG 2.2 AA tags. They are regression checks, not a claim of real iPhone testing or complete accessibility certification.

For future production-metadata validation, use an explicit approved origin with `SITE_ENVIRONMENT=production` and a production branch context. A reserved `https://example.org` origin may be used only as a local test fixture, never as the deployment's actual origin. Never set a development branch to indexable merely to run a metadata check.

## Direct routes, old links, and 404 behavior

Prerendering generates a directory and `index.html` for every supported route. Amplify's static clean-URL handling can serve `/books/prof-standard/` from `/books/prof-standard/index.html`. Existing old URLs also receive prerendered content, and the Angular client replaces their URL with the corresponding canonical destination:

| Existing URL | Canonical destination |
| --- | --- |
| `/courses/` | `/academy/` |
| `/privacy/` | `/privacy-policy/` |
| `/strategies/` | `/checklist/` |
| `/achievements/` | `/about/` |
| Three former concept-book URLs | `/books/` |
| `/academy/<existing-course-slug>/` | `/courses/<existing-course-slug>/` |

These are compatibility pages and client-side redirects. They are not reported as HTTP 301 redirects. The manifest renders **43 URLs: 33 canonical pages and 10 compatibility aliases**. Only **25** are possible production sitemap entries. Compatibility paths, checkout-result/account/404 pages and the three pending policy pages do not appear in that sitemap. Pending policies remain `noindex` until the approved content and indexing settings are deliberately updated.

Inspect the existing Amplify redirect/rewrite rules before deployment verification. A blanket `200` rewrite to `/index.html` can hide generated route-specific HTML. The preferred static setup preserves existing generated files and uses the generated `/404.html` for unknown URLs with HTTP 404. AWS documents a `404` fallback from `/<*>` to `/404.html` and automatic clean URLs. Do not apply shared app-level rewrite changes if they could change `develop` or production behavior; first determine the actual scope of those settings. Host-level 404 behavior remains unverified until the deployed branch is tested.

Source: [Amplify redirects, rewrites, clean URLs, and custom 404](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html).

## Verify the actual deployed branch

- Confirm the build job succeeded for the intended `dev-aafxx` commit.
- Open the returned branch URL on desktop and an actual iPhone Safari device when available.
- Directly open and reload `/books/`, each of the four book URLs, `/academy/`, `/expert-advisors/`, and the policy pages.
- Inspect fetched HTML, not only the hydrated DOM: route-specific title, description, one H1, and `noindex` must already be present.
- Confirm assets load with correct MIME types. Check that unknown paths return HTTP 404 and display the app's not-found page.
- Check that `/sitemap.xml` is absent on development and no live payment is enabled.
- Follow each configured test Payment Link only after merchant product/price/delivery validation. Use Stripe test mode and test payment data. Do not charge a live card for QA.
- Verify the existing `develop` deployment has not been repointed.

Record build, browser, payment, and host results separately. Local tests do not prove that a hosted endpoint, shipping configuration, production payment, PDF delivery, or email submission works.
