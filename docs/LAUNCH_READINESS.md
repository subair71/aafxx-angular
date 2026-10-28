# AAFXX launch verification — 28 October 2026

This change targets `develop` in `subair71/aafxx-angular`. The existing Angular
design, assets, dark default and AWS Amplify hosting are retained. It does not
merge into `main` or change DNS. This report supersedes earlier Stripe-only
launch instructions for the current Books Shop.

## Implemented

- Business: `admin@aafxx.com`; founder: `berthram@aafxx.com` (clickable mail links).
- Footer WhatsApp: `+973 3435 2786`, linked to `https://wa.me/97334352786`.
- Footer location: `Manama, Bahrain - Online Global`.
- Founder email on the founder/author pages and contact page.
- PayPal as the shop's selected provider, retaining the existing Stripe backend
  for compatibility. All three supplied URLs and exact launch labels are
  centralized in `integration-config.ts` / `commerce.ts`.
- Current failed verification keeps purchases disabled. PDF buttons omit
  “(Instant Download)” until payment and private delivery are verified; the
  requested full label is configured for the ready state. Review links explain
  the current failure and provide the business email. No paid PDFs are public.
- Server-side Amazon SES notification for every successful checklist
  registration. Fixed recipient: `admin@aafxx.com`. Exact subject:
  `New AAFXX Checklist Registration`. The plain-text body includes name, email,
  country, registration type, book selection, format, consent, consent version,
  form timestamp and honeypot value, plus receipt time. Visitor input cannot
  choose the recipient, subject or sender.
- Required-field validation, origin restrictions, payload limits, anti-spam and
  rate limits remain. Success requires durable storage AND an SES message ID.
  If sending fails, the API returns failure and a retry sends again. An SES
  message ID means provider acceptance, not confirmed inbox delivery. A retry
  after an ambiguous network timeout can produce duplicate admin notifications.

## Payment blockers — do not make the $27 purchase yet

All three exact supplied links were opened in the browser on 28 October 2026:

| Product | URL | Observed result |
| --- | --- | --- |
| PDF, $27 | https://www.paypal.com/paypalme/AAFXMLSOLUTI/27 | “We can’t find this profile” |
| Paperback, $47 | https://www.paypal.com/paypalme/AAFXMLSOLUTI/47 | Same error |
| Bundle, $97 | https://www.paypal.com/paypalme/AAFXMLSOLUTI/97 | Same error |

No merchant identity, checkout amount, currency or shipping fields could be
verified. Restore/enable this PayPal.Me profile or provide the working merchant
links. These amount-only URLs use the account's default currency; verify that
it is USD. PayPal documents an explicit currency suffix such as `27USD`, but
the supplied links have been preserved exactly, not silently changed.

Source: https://www.paypal.com/us/cshelp/article/paypalme-frequently-asked-questions-help432

The existing payment handler verifies **Stripe** events and Stripe session IDs;
it does not verify PayPal transactions. To complete launch, provide/configure:

1. A working PayPal Business checkout and server-side payment confirmation
   integration, with merchant identity, USD totals, order/product mapping,
   duplicate-event handling and confirmed paid status. The three shared links
   alone do not identify which of the four book titles was bought.
2. Approved final PDFs and bonus files in private storage, product-to-file
   mappings, and a tested expiring download/receipt flow after confirmed payment.
3. Paperback/bundle buyer name, complete postal address, country and required
   contact details collected and persisted with the paid order. Confirm supported
   destinations, shipping charges and fulfillment ownership. Verify the bundle's
   exact physical/digital/bonus contents with the merchant.
4. Approved purchase/refund/shipping terms, which remain incomplete in the existing
   project. Do not set readiness flags merely because the PayPal account is live.

## Checklist email activation and delivery test

The live frontend currently has no API base. The code is implemented but this
session has no AWS deployment credentials or accessible Amplify console, so no
real test email was sent and no inbox delivery is claimed.

Required access/configuration:

1. AWS account and region for the existing Amplify application and the separate
   API stack. Deploy `backend/template.yaml` with a real Secrets Manager config,
   `AllowedOrigin` equal to the exact development origin, and an SES-verified
   `SenderEmail` / `SenderIdentityArn`. Keep all credentials server-side.
2. Set the config's `publicApiBase` from the actual stack output, independent
   strong rate-limit/download secrets, `leadsEnabled: true`, retention and the
   matching privacy version. Stripe payment handling may remain disabled.
3. Confirm SES sending access (or verify the recipient if SES is sandboxed), and
   confirm `admin@aafxx.com`'s mailbox/forwarding destination works. Existing MX
   records show Namecheap forwarding; they do not prove the alias exists.
4. Set `integrationConfig.forms.apiBase` to the deployed HTTPS origin, and enable
   `leadsReady` / `privacyApproved` only after the actual service/privacy setup.
   Existing unrelated contact/waitlist flags need not change.
5. Submit a clearly labeled QA checklist registration through the site. Verify
   the exact subject and every field in the receiving inbox, then test provider
   failure feedback. Local mocked SES tests are not a replacement for this step.

The free checklist download itself also needs its approved PDF configured under
`free-content/`; it is separate from the required admin registration notification.

## Domain findings and required access

Google Public DNS queries on 28 October 2026 returned:

| Record | Current result |
| --- | --- |
| Apex A / AAAA | No answers (domain exists, no website address) |
| `www` CNAME | NXDOMAIN |
| NS | `dns1.registrar-servers.com`, `dns2.registrar-servers.com` |
| MX | `eforward1`, `eforward2`, `eforward3.registrar-servers.com` at priority 10; `eforward4` at 15; `eforward5` at 20 |
| TXT | `v=spf1 include:spf.efwd.registrar-servers.com ~all` |

The existing development URL responded with HTTP 200:
https://develop.d1xofga5gcylou.amplifyapp.com

`http://aafxx.com` and `https://aafxx.com` could not be loaded. HTTPS/certificate
and the HTTP-to-HTTPS redirect therefore remain unverified. Namecheap was signed
out; the AWS console could not be accessed. No DNS records were modified.

To restore: provide authenticated Namecheap access to the `aafxx.com` Advanced
DNS zone and access to Amplify Domain management in the correct AWS account and
region (or its exact returned DNS records and certificate status). Export the
current full zone first. Keep the Namecheap nameservers, MX, SPF, DKIM, DMARC and
all existing verification records. Public queries cannot enumerate every
verification hostname. Add only the actual Amplify-provided apex ALIAS, `www`
CNAME and certificate-validation CNAME, then verify certificate issuance and
the HTTPS redirect. Do not guess a CloudFront hostname or pin its IP addresses.

Source: https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-a-third-party-dns-provider.html

## Verification

Angular production build, 7 build-config tests, 9 commerce tests, 9 funnel tests,
23 backend tests and backend syntax checks passed locally. The tests include
PayPal readiness gates, all eight book/format selections, email notification
failure/retry, exact subject/recipient/fields and protection against unpaid or
forged downloads. No real payment or email was made by these tests.

Browser tests were updated for the current purchase review and official contacts,
including all footer values at 320/390/768/1440 widths. The local browser runner
could not start in this environment; use the `develop` GitHub validation run for
executed responsive, image, cross-browser and accessibility results. Live domain,
PayPal checkout and actual email delivery are separate launch blockers regardless
of CI status.
