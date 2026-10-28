import { BOOKS, BUNDLE, type Book, type BookFormat } from "./catalogue";
import { integrationConfig, type IntegrationConfig, type PaymentEnvironment } from "./integration-config";

export interface CheckoutState {
  available: boolean;
  url: string | null;
  message: string;
  reason: string;
  sku: string;
  environment: PaymentEnvironment;
}

export interface CheckoutContext {
  preview: boolean;
  environment: PaymentEnvironment;
}

export type PaymentProvider = "stripe" | "benefitpay";

export interface CheckoutProviderAdapter {
  readonly provider: PaymentProvider;
  checkoutFor(book: Book, format: BookFormat): CheckoutState;
  bundleCheckout(): CheckoutState;
}

function runtimeContext(): CheckoutContext {
  if (typeof document === "undefined") return { preview: true, environment: "test" };
  return {
    preview: document.querySelector('meta[name="site-preview"]')?.getAttribute("content") !== "false",
    environment: document.querySelector('meta[name="payment-environment"]')?.getAttribute("content") === "live" ? "live" : "test",
  };
}

export function formatPrice(amount: number): string {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)}`;
}

function checkoutReference(
  sku: string,
  price: number,
  config: IntegrationConfig,
  context: CheckoutContext,
): CheckoutState {
  const environment = config.payments.environment;
  const unavailable = (reason: string): CheckoutState => ({ available: false, url: null, message: "Purchasing is not available yet. Please check back for release details.", reason, sku, environment });
  if (context.environment !== environment) return unavailable("environment-mismatch");
  if (environment === "live" && (context.preview || !config.payments.liveApproved)) return unavailable("live-not-approved");
  if (!config.payments.policiesApproved) return unavailable("policies-awaiting-approval");
  if (!config.payments.verifiedPaymentWorkflowReady) return unavailable("payment-verification-not-ready");
  const reference = config.payments.links[sku]?.[environment];
  if (!reference) return unavailable("payment-link-missing");
  if (!reference.merchantVerified || reference.sku !== sku || reference.environment !== environment || reference.amountCents !== Math.round(price * 100) || reference.currency !== "usd" || !/^price_[A-Za-z0-9]+$/.test(reference.stripePriceId) || !/^prod_[A-Za-z0-9]+$/.test(reference.stripeProductId)) return unavailable("payment-reference-unverified");
  try {
    const url = new URL(reference.url);
    if (url.protocol !== "https:" || url.hostname !== "buy.stripe.com" || url.port || url.username || url.password || url.hash || url.search || !/^\/(?:test_)?[A-Za-z0-9]+$/.test(url.pathname)) return unavailable("payment-link-invalid");
    if (url.pathname.startsWith("/test_") !== (environment === "test")) return unavailable("payment-link-mode-mismatch");
    return { available: true, url: url.href, message: environment === "test" ? "Opens Stripe test checkout. No live payment is taken." : "Continue to secure checkout with Stripe.", reason: "ready", sku, environment };
  } catch {
    return unavailable("payment-link-invalid");
  }
}

export function checkoutFor(book: Book, format: BookFormat, config: IntegrationConfig = integrationConfig, context: CheckoutContext = runtimeContext()): CheckoutState {
  const variant = book.formats[format];
  const result = checkoutReference(variant.sku, variant.price, config, context);
  const ready = format === "pdf"
    ? config.payments.digital.privateDeliveryReady && config.payments.digital.contentReadySkus.includes(variant.sku)
    : config.payments.print.fulfilmentReady && config.payments.print.shippingReadySkus.includes(variant.sku);
  if (!ready) return { ...result, available: false, url: null, message: format === "pdf" ? "Register for the eBook launch notification. No payment is collected." : "Print ordering is not open yet. Register for updates; no payment is collected.", reason: format === "pdf" ? "digital-delivery-not-ready" : "print-fulfilment-not-ready" };
  return result;
}

export function bundleCheckout(config: IntegrationConfig = integrationConfig, context: CheckoutContext = runtimeContext()): CheckoutState {
  const result = checkoutReference(BUNDLE.sku, BUNDLE.price, config, context);
  const bundle = config.payments.bundle;
  if (!bundle.contentsConfirmed || !bundle.format || !bundle.contentsLabel.trim()) return { ...result, available: false, url: null, message: "Bundle format and delivery details will be confirmed before ordering opens.", reason: "bundle-contents-unconfirmed" };
  const contentsMatch = bundle.includedSkus.length === 4 && new Set(bundle.includedSkus).size === 4 && BOOKS.every((book) => {
    const selected = (["pdf", "print"] as const).filter((format) => bundle.includedSkus.includes(book.formats[format].sku));
    return selected.length === 1 && (bundle.format === "mixed" || selected[0] === bundle.format);
  });
  if (!contentsMatch || bundle.format === "mixed" && (!bundle.includedSkus.some((sku) => sku.endsWith("-pdf")) || !bundle.includedSkus.some((sku) => sku.endsWith("-print")))) return { ...result, available: false, url: null, message: "Bundle contents will be confirmed before ordering opens.", reason: "bundle-contents-unconfirmed" };
  const deliveryReady = bundle.fulfilmentReady && bundle.includedSkus.every((sku) => sku.endsWith("-pdf")
    ? config.payments.digital.privateDeliveryReady && config.payments.digital.contentReadySkus.includes(sku)
    : config.payments.print.fulfilmentReady && config.payments.print.shippingReadySkus.includes(sku));
  if (!deliveryReady) return { ...result, available: false, url: null, message: "Bundle purchasing is not available yet.", reason: "bundle-fulfilment-not-ready" };
  return result;
}

/** Provider boundary only: BenefitPay requires a separate verified integration. */
export function resolveCheckoutProvider(provider: PaymentProvider = "stripe", config: IntegrationConfig = integrationConfig, context: CheckoutContext = runtimeContext()): CheckoutProviderAdapter {
  if (provider === "stripe") return {
    provider,
    checkoutFor: (book, format) => checkoutFor(book, format, config, context),
    bundleCheckout: () => bundleCheckout(config, context),
  };
  if (provider !== "benefitpay") throw new Error("Unsupported payment provider.");
  const unavailable = (sku: string): CheckoutState => ({
    available: false,
    url: null,
    message: "BenefitPay is not available yet.",
    reason: "benefitpay-not-implemented",
    sku,
    environment: config.payments.environment,
  });
  return {
    provider,
    checkoutFor: (book, format) => unavailable(book.formats[format].sku),
    bundleCheckout: () => unavailable(BUNDLE.sku),
  };
}

export interface FormSubmission {
  email: string;
  consent: boolean;
  /** Honeypot. Keep empty for human visitors. */
  website: string;
  /** Time at which the form was displayed, in milliseconds since epoch. */
  startedAt: number;
}
export interface ContactSubmission extends FormSubmission { name: string; subject: string; message: string }
export interface SubmissionResult { ok: boolean; message: string }

function validApiBase(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && !value.endsWith("/");
  } catch { return false; }
}

export function integrationAvailable(kind: "contact" | "waitlist" | "leads", config: IntegrationConfig = integrationConfig): boolean {
  return config.forms.privacyApproved && Boolean(config.forms.privacyVersion.trim()) && config.forms[kind === "contact" ? "contactReady" : kind === "leads" ? "leadsReady" : "waitlistReady"] && validApiBase(config.forms.apiBase);
}

async function submit(kind: "contact" | "waitlist", data: FormSubmission | ContactSubmission, config: IntegrationConfig, fetcher: typeof fetch): Promise<SubmissionResult> {
  if (!integrationAvailable(kind, config)) return { ok: false, message: kind === "waitlist" ? "Waitlist registration is not open yet. Please check back soon." : "Online enquiries are not available yet. Please check back soon." };
  const email = data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !data.consent) return { ok: false, message: "Enter a valid email address and confirm your consent." };
  if (kind === "contact") {
    const contact = data as ContactSubmission;
    if (!contact.name.trim() || !contact.subject.trim() || !contact.message.trim() || contact.name.length > 100 || contact.subject.length > 200 || contact.message.length > 5000) return { ok: false, message: "Complete your name, subject and message within the field limits." };
  }
  if (data.website.trim() || !Number.isFinite(data.startedAt)) return { ok: false, message: "We could not accept this submission. Refresh the page and try again." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(`${config.forms.apiBase}/${kind}`, {
      method: "POST", mode: "cors", credentials: "omit", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email, consentVersion: config.forms.privacyVersion }), signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.accepted !== true || result?.ok !== true) return { ok: false, message: response.status === 429 ? "Too many attempts. Please wait a few minutes before trying again." : "Your submission was not accepted. Please try again later." };
    return { ok: true, message: kind === "waitlist" ? "You’re on the AAFXX Expert Advisors waitlist. Your interest has been registered." : "Your enquiry has been received. Thank you for contacting AAFXX." };
  } catch {
    return { ok: false, message: "We could not confirm receipt. Check your connection and try again." };
  } finally { clearTimeout(timeout); }
}

export function submitContact(data: ContactSubmission, config: IntegrationConfig = integrationConfig, fetcher: typeof fetch = fetch): Promise<SubmissionResult> {
  return submit("contact", data, config, fetcher);
}
export function submitWaitlist(data: FormSubmission, config: IntegrationConfig = integrationConfig, fetcher: typeof fetch = fetch): Promise<SubmissionResult> {
  return submit("waitlist", data, config, fetcher);
}

export function downloadRecoveryAvailable(config: IntegrationConfig = integrationConfig): boolean {
  return config.payments.verifiedPaymentWorkflowReady && config.payments.digital.privateDeliveryReady && config.forms.privacyApproved && validApiBase(config.forms.apiBase);
}

export async function recoverDownloads(data: { sessionId: string; email: string; website: string; startedAt: number }, config: IntegrationConfig = integrationConfig, fetcher: typeof fetch = fetch): Promise<SubmissionResult> {
  if (!downloadRecoveryAvailable(config)) return { ok: false, message: "Order recovery is not available yet." };
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(data.sessionId.trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.website.trim() || !Number.isFinite(data.startedAt)) return { ok: false, message: "Enter the order reference and email address used at checkout." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(`${config.forms.apiBase}/recover`, {
      method: "POST", mode: "cors", credentials: "omit", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, sessionId: data.sessionId.trim(), email: data.email.trim().toLowerCase() }), signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true || result?.accepted !== true) return { ok: false, message: response.status === 429 ? "Too many attempts. Please wait a few minutes." : "Your request was not accepted. Please try again later." };
    return { ok: true, message: "If these details match a paid digital order, fresh download links will be sent to its original email address." };
  } catch { return { ok: false, message: "We could not confirm your request. Please try again." }; }
  finally { clearTimeout(timeout); }
}
