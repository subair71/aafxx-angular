> October 24 sales-funnel update: see [SALES_FUNNEL.md](SALES_FUNNEL.md) for current storefront destinations, Amazon paperback routing, lead/checklist APIs, order-status verification and operational limitations. The older Stripe print backend remains supported but is not exposed by the new storefront.

# AAFXX commerce and enquiry setup

## Current state

The branch contains the approved four-book catalogue, format-specific USD pricing, validated Stripe Payment Link routing, fail-closed availability checks, real HTTP form clients, and an optional AWS integration backend. **Purchasing, digital delivery, print fulfilment and online submissions are not operational in the supplied configuration.** No Stripe account objects, AWS resources, email deliveries, paid PDF uploads or live transactions were created during this implementation.

| Component | Implemented in source | External dependency |
| --- | --- | --- |
| Four books and eight variants | `src/app/catalogue.ts`, with supplied original cover images | Final paid PDFs |
| PDF / Print selectors | Each selection has its own stable SKU and price | Eight merchant-verified Payment Links |
| Four-book bundle | USD 97; contents and format gates | Merchant confirmation of one edition of each book |
| Stripe handoff | Allowed Stripe host, product/price/SKU checks, test/live separation | Verified Stripe products, prices and completion settings |
| Payment verification | Signed snapshot webhooks and Stripe-owned session retrieval | Deployed backend and private Stripe keys in Secrets Manager |
| Digital entitlement | One durable order record per Stripe Checkout Session | Private uploaded PDFs, deployed S3/DynamoDB and approved email sender |
| PDF access | Signed 24-hour recovery links; 5-minute S3 download redirects | Backend deployment and successful delivery test |
| Print order | Verified shipping settings and a durable merchant fulfilment record | Approved countries, rates and actual dispatch arrangements |
| Contact / EA waitlist | Validation, explicit consent, rate limits and durable storage | Deployed API and merchant-approved privacy/retention terms |
| BenefitPay | Reserved `CheckoutProviderAdapter` through `resolveCheckoutProvider('benefitpay')`; always unavailable with no URL | Separate merchant integration, payment verification and fulfilment testing before implementation |

The original AAFXX logo and all four cover JPEGs have now been supplied. Byte-exact originals are retained in `design-assets/originals/`, and the catalogue points to optimized WebP covers. `integrationConfig.brand.logo` uses `assets/brand/aafxx-logo.svg`, which embeds the original bitmap with surrounding black whitespace trimmed through its viewBox. See [ASSETS.md](ASSETS.md) for the exact mapping. These public artwork files do not include the paid book contents: final PDFs and A3 Checklist artwork remain pending. Unavailable or unverified contact details and destinations remain empty; supplying artwork does not enable checkout or fulfilment.

## Public configuration

Use `src/app/integration-config.ts` for **public** configuration. Payment Link URLs, Stripe product IDs and price IDs are public identifiers. Secret API keys, webhook signing secrets, S3 credentials and token-signing secrets never belong in this file, Angular environment files, Amplify frontend environment variables, or the compiled app.

| Product | PDF SKU / USD | Print SKU / USD |
| --- | --- | --- |
| ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE | `aafxx-book-1-pdf` / 27 | `aafxx-book-1-print` / 47 |
| FOREX LOW IN, MIDDLE OUT | `aafxx-book-2-pdf` / 27 | `aafxx-book-2-print` / 47 |
| BBB FLOW & LEADER ALIGNMENT | `aafxx-book-3-pdf` / 27 | `aafxx-book-3-print` / 47 |
| PROF STANDARD | `aafxx-book-4-pdf` / 27 | `aafxx-book-4-print` / 47 |
| Complete library | `aafxx-four-book-bundle` / 97 | Format must be confirmed |

For each enabled SKU, configure its independently verified `test` or `live` reference:

```ts
{
  url: "", // Merchant-supplied public Stripe Payment Link; never invent this.
  sku: "aafxx-book-1-pdf",
  environment: "test",
  stripeProductId: "", // Actual matching Stripe Product ID.
  stripePriceId: "",   // Actual matching one-time Stripe Price ID.
  amountCents: 2700,
  currency: "usd",
  merchantVerified: false
}
```

Keep `merchantVerified` false until the actual Stripe page has been checked for book, format, amount, currency, permitted quantities, tax/shipping settings and completion behavior. The implementation accepts only HTTPS `buy.stripe.com` links, with no credentials, query parameters, fragment or unexpected port. Custom Stripe domains require a deliberate code and validation update. Test references must use `/test_…`; live references must not.

The following gates must all pass before a link is exposed:

1. The configured environment matches the built page's `payment-environment` metadata.
2. Live mode additionally requires `site-preview=false` and `liveApproved=true`. The `dev-aafxx` build enforces preview/test mode; do not loosen that restriction for live testing.
3. Purchase policy terms have been approved, and the verified payment workflow has been tested.
4. PDF SKUs have genuine private content and working delivery. Print SKUs have approved shipping and merchant fulfilment arrangements.
5. The configured Payment Link matches its SKU, amount, currency and mode.

Unavailable states never provide a fake checkout destination. Merely changing a readiness flag does not make a backend or Stripe integration operational.

`resolveCheckoutProvider()` defaults to the Stripe adapter and delegates to the existing guarded `checkoutFor` and `bundleCheckout` functions. The reserved BenefitPay adapter never falls back to a Stripe link, including when live Stripe configuration is ready. It adds no customer-facing payment option, network request or operational BenefitPay support.

### Bundle contents

Configure `payments.bundle.contentsConfirmed`, `format`, `contentsLabel`, `includedSkus` and `fulfilmentReady` together. `includedSkus` must contain exactly one edition of each of the four books. A PDF bundle contains the four PDF SKUs; a print bundle contains the four print SKUs. A mixed bundle must explicitly identify its digital and printed editions, and both delivery paths must be ready. Server-side configuration independently checks the same contents and grants only the selected PDFs.

The USD 11 comparison is valid only after confirmation of all four PDF editions: `4 × 27 − 97 = 11`. Do not advertise that comparison for an unconfirmed, print or mixed bundle.

## Stripe setup and confirmation behavior

Create the eight individual one-time prices in USD. Create a separate bundle product and price only after its contents are confirmed. Disable adjustable quantities and unapproved promotion/discount options for these fixed-price Payment Links. The backend rejects an unexpected quantity, extra line item, price, product, currency, discount or total.

Use the hosted Stripe confirmation page, or configure the Payment Link's after-payment redirect to the verified branch's `/checkout/success` route. Stripe supports `{CHECKOUT_SESSION_ID}` in that redirect. This identifier is for correlation and recovery; **a browser visit or URL parameter never proves payment**. A configurable cancellation redirect is not assumed for Payment Links; `/checkout/cancel` is an informational route.

Before enabling print variants, confirm permitted countries, shipping rates, address collection and who will dispatch each order. The backend requires the collected shipping country and configured shipping rate to match its allowlist. Explicitly approved free shipping is supported only where configured. The current amount validation expects zero or additive/exclusive taxes; if merchant-approved inclusive tax or discounts are required, adapt and test the server calculation before enabling those links.

Configure a signed **snapshot** webhook for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

The handler verifies Stripe's signature over the original request bytes, checks the event environment, retrieves the Checkout Session with its real line-item Price/Product data, and validates the server allowlist. Unpaid sessions remain pending or failed. Only `payment_status=paid` creates a paid entitlement. Repeated, concurrent and out-of-order events do not create additional entitlements. The endpoint deliberately returns a retryable failure while another worker holds a delivery lease.

## Optional AWS backend

`backend/template.yaml` is an **undeployed** AWS SAM template. It provisions a dedicated HTTP API, one Node.js Lambda, a DynamoDB table and a private versioned S3 bucket. It does not replace Amplify, change the existing `develop` website or alter production DNS. The table and bucket are retained if the stack is removed. The function can read PDFs but cannot upload or publicly expose them.

The backend exposes:

| Method / path | Behavior |
| --- | --- |
| `POST /contact` | Validate and persist a consented enquiry; acknowledge only after storage succeeds |
| `POST /waitlist` | Validate and persist email/consent; handle repeat registration without exposing membership |
| `POST /stripe/webhook` | Verify signed Stripe events and create/reconcile a paid order |
| `GET /download?token=…` | Verify a private expiring token, check paid order state, and redirect to a five-minute S3 URL |
| `POST /recover` | Send fresh download links only to the matching paid order's original email address |

Contact and waitlist endpoints store records; they do not claim that a staff member has read the message, and they do not send marketing messages. The core tests use local adapters. No customer information is sent to AWS or Stripe by the tests.

### Deployment prerequisites and sequence

1. Confirm merchant ownership of the Stripe and AWS accounts, policy terms, data retention, sender identity and fulfilment arrangements. The current code alone does not establish those facts.
2. Create a dedicated Secrets Manager secret. Start from the **shape** in `backend/config.example.json`, replacing placeholders inside Secrets Manager, not in a committed file. Use separate randomly generated secrets of at least 32 bytes for `rateLimitSalt` and `downloadTokenSecret`. Keep the payment and form feature flags false initially. Set mode to `test` and leave `publicApiBase` empty until the stack returns its actual API origin. The backend remains unavailable while that origin is missing.
3. Verify the merchant's sender identity in Amazon SES in the selected region. Account sending restrictions, recipient verification, production access, bounces and suppression must be checked before email delivery can be declared ready.
4. From `backend/`, run `npm ci`, `npm test` and `npm run check`. With the AWS CLI/SAM CLI installed and authorized account access, run `sam build` and `sam deploy --guided --stack-name aafxx-integrations-dev`. Supply the exact verified development origin, existing secret ARN, sender email and SES identity ARN. These deployment commands were **not** executed during this task.
5. Read the actual `ApiBase`, `PrivatePdfBucket` and `DataTable` outputs. Copy the exact `ApiBase` value into the private secret's `publicApiBase` field, with no trailing slash. Do not guess endpoints or bucket names. This post-deployment secret setting avoids a circular dependency between SAM's HTTP API integration and the Lambda function; the template does not inject an API reference into the function's environment. Configure the exact allowed development origin, with no wildcard and no trailing slash. The template allows one origin per deployment; keep test and live infrastructure separate. Leave all feature flags false until the remaining setup and validation steps pass.
6. Upload the genuine purchased PDFs under `paid-content/` in the returned private bucket, with `application/pdf` content type. Keep them out of Angular `public/` and Git. The server checks object existence and content type before sending download links.
7. Configure real Stripe prices, products and Payment Link IDs in the private product allowlist. Set `testRecipientAllowlist` to merchant-approved test mailboxes. Test-mode deliveries to any other recipient are rejected.
8. Register the signed snapshot webhook at the returned API origin plus `/stripe/webhook`. Store its signing secret in Secrets Manager. Enable payment processing only after these objects and final content exist.
9. Perform the end-to-end test cases listed below. Then populate the corresponding public test Payment Links and readiness fields.
10. Enable contact/waitlist endpoints only after storage, abuse controls, consent wording and retention have been approved and tested. Set `forms.apiBase` to the actual HTTPS origin and set public `forms.privacyVersion` to the same version as private `privacyVersion`. Keep `privacyApproved=false` until the page's terms match the approved handling.

An example server-side **product shape** follows. It is intentionally disabled and contains no usable Stripe references or keys:

```json
{
  "enabled": false,
  "sku": "aafxx-book-1-pdf",
  "title": "ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE",
  "format": "pdf",
  "priceCents": 2700,
  "stripePriceId": "",
  "stripeProductId": "",
  "stripePaymentLinkId": "",
  "fulfilmentApproved": false,
  "files": [{
    "sku": "aafxx-book-1-pdf",
    "key": "paid-content/book-1.pdf",
    "filename": "AAFXX-Book-1.pdf"
  }]
}
```

The object key above is an intended private location, not a statement that a file exists. Printed variants use `files: []` and an approved `shipping` object containing `countries`, `rateIds` and an explicit `freeApproved` flag. Bundles additionally require `contentsConfirmed: true` and the same `includedSkus` as the public configuration. Each file's `sku` must match exactly one included digital edition; a mixed bundle must not grant the PDFs of its printed editions.

### Delivery, recovery and operational limits

After a paid order is verified, its private links are submitted through SES to the email supplied by Stripe. Each link has a signed 24-hour expiry and grants access only to an allowed file on that paid order. The actual S3 redirect expires after five minutes. URLs are bearer credentials: keep them private, use HTTPS and avoid logging tokens. Responses use `no-store` and `no-referrer`.

Recovery accepts the order's Checkout Session reference and email. It always returns the same generic acknowledgement for a well-formed request, and sends only when both values match a paid digital order. An existing link keeps its original signed expiry; asking for a fresh link does not invalidate a still-valid link if the email attempt fails.

Order entitlements are idempotent. **Receipt email delivery is at least once, not exactly once:** if SES accepts an email and the subsequent database acknowledgement fails, a retry can send the same receipt again. It does not create another entitlement or dispatch another printed order. SES acceptance is recorded; inbox delivery, bounce handling and operational alerting require verification in the deployed account. Printed dispatch is a merchant-operated queue (`fulfilmentStatus=awaiting-dispatch`), not an invented carrier integration.

Refunds, disputes, customer-service approvals and physical dispatch are not automatically administered by this small integration. An authorized operator can revoke a digital order by setting `paymentStatus` to `revoked` in its protected order record; subsequent checkout webhook replays cannot re-enable it. The merchant must define and test the actual refund/revocation process before launch. No public endpoint permits this mutation.

Contact and waitlist retention periods in the example are proposed configuration values, not published commitments. Confirm them with the merchant, implement the required review/deletion process, and align the privacy page before accepting personal data. DynamoDB TTL is asynchronous; do not promise deletion at an exact instant. Order retention requires a separate merchant-approved operational policy.

## Verification before enabling sales

Run the local source checks:

```bash
node tests/commerce.test.mjs
npm --prefix backend ci
npm --prefix backend test
npm --prefix backend run check
```

The client tests cover selected-SKU routing, unsafe URLs, price/currency mismatches, missing fulfilment, development/live isolation, bundle contents and genuine form acknowledgement. The backend tests use Stripe's actual local signature verification and injected storage/email adapters to cover tampering, wrong mode/amount/product/link, delayed payments, duplicate/concurrent events, retryable leases, terminal revocation, expiring private tokens, recovery, and shipping/bundle permissions.

Cloud tests are still required for API Gateway raw-body forwarding, DynamoDB condition behavior, SES sender/recipient restrictions, S3 access, real form persistence, HTTP error feedback and all nine configured checkout variants. Test delayed payment success/failure, failed email delivery, expired download recovery, duplicate webhook replay, unapproved shipping countries and direct visits to success/cancel pages. Never use a live charge as a development test.

## Authoritative integration references

- [Stripe Payment Links after-payment behavior](https://docs.stripe.com/payment-links/post-payment)
- [Stripe fulfilment guidance](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page)
- [Stripe webhook signatures and event handling](https://docs.stripe.com/webhooks)
- [Stripe Payment Links shipping customization](https://docs.stripe.com/payment-links/customize)
- [Amazon S3 presigned URL behavior and limitations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
