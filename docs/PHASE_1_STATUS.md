# AAFXX Phase 1 — books shop

The October 28 brief supersedes the earlier Amazon paperback launch plan and the Stitch headline. The existing Stitch layout remains, with the requested ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE headline and merchant-supplied description.

| Requirement | Current implementation |
| --- | --- |
| Name, founder and brand | AAFXX – Anybody Wins Trading Academy; Prince Prof. Berthram Chidi Eke; supplied original black/gold logo retained because it is already available |
| Four books | All requested titles, subtitles and supplied covers are present |
| Prices | USD 27 PDF, USD 47 print, USD 97 four-book bundle |
| Stripe buy buttons | Both formats now use the selected SKU in the Stripe order-review flow; buttons remain disabled until genuine payment and fulfilment configuration is ready |
| Bundle | USD 97 button present; PDF/print/mixed contents still require merchant confirmation |
| EAs | Coming 2027, merchant-provided “Tested by Prince Prof.” copy, waitlist interface only; no EA sales |
| Contact | Manama, Bahrain / Online Global and supplied social handles linked; email and WhatsApp remain unspecified |
| Visual design | Black/gold/white, responsive Stitch-based layouts, local EB Garamond and Manrope fonts |
| Checklist | Existing image slot retained; no identified A3 Checklist image or final download supplied |
| Hosting | Existing AWS Amplify configuration retained; this code update does not establish that a deployment succeeded or a final domain is connected |

## Required to accept orders

1. Supply eight public Stripe Payment Links: one USD 27 PDF and one USD 47 print link for each book. Supply the USD 97 bundle link and confirm its included formats. Matching Stripe product and price identifiers can be collected during configuration; no secret key belongs in frontend source or chat.
2. Supply the final four paid PDFs and the intended delivery process, plus print shipping countries, shipping charges and fulfilment arrangements.
3. Supply actual WhatsApp and email details, and the A3 Checklist image if it should be shown.
4. Connect the existing contact/waitlist API to a deployed service. An existing email-marketing or hosted waitlist service can be used instead once its destination is supplied. Forms currently cannot register subscribers.
5. Confirm the merchant's purchase/refund terms and complete test purchases and delivery checks before activating live payment mode. BenefitPay remains unconnected; its hosted checkout details or merchant integration are needed if it is required at launch.

The configuration is still test/noindex. Live Stripe checkout, PDF delivery, print fulfilment, waitlist persistence and BenefitPay are not claimed to be operational merely because the UI is present. No fake payment URL or contact detail is used.
