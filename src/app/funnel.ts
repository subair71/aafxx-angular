import { BOOKS, BUNDLE, Book, BookFormat } from './catalogue';
import { checkoutFor, bundleCheckout, integrationAvailable, FormSubmission, SubmissionResult, CheckoutContext, PAYPAL_BUTTON_LABELS } from './commerce';
import { integrationConfig, IntegrationConfig } from './integration-config';
import { funnelConfig } from './funnel-config';

export type LeadKind = 'books' | 'checklist' | 'mentorship';
export interface LeadSubmission extends FormSubmission {
  name: string; country: string; kind: LeadKind; bookId: string; format: 'pdf' | 'print' | 'undecided';
}

export function amazonFor(book: Book, config = funnelConfig): string | null {
  const listing = config.amazon[book.id];
  if (!listing?.verified || !/^[A-Z0-9]{10}$/.test(listing.asin)) return null;
  try {
    const url = new URL(listing.url);
    if (url.protocol !== 'https:' || !['www.amazon.com', 'www.amazon.co.uk', 'www.amazon.in', 'www.amazon.com.au', 'www.amazon.de', 'www.amazon.fr', 'www.amazon.ae'].includes(url.hostname) || url.username || url.password || url.port || url.search || url.hash || url.pathname !== `/dp/${listing.asin}`) return null;
    return url.href;
  } catch { return null; }
}

export function notificationHref(base: string, bookId = 'all', format: string = 'undecided') {
  return `${base}launch-notifications/?book=${encodeURIComponent(bookId)}&format=${encodeURIComponent(format)}`;
}
export function checkoutHref(base: string, sku: string) { return `${base}checkout/?sku=${encodeURIComponent(sku)}`; }
export function purchaseAction(book: Book, format: BookFormat, base: string, config: IntegrationConfig = integrationConfig, context?: CheckoutContext) {
  const state = checkoutFor(book, format, config, context);
  if (config.payments.provider === 'paypal') return {
    href: state.available ? state.url! : checkoutHref(base, state.sku),
    label: format === 'pdf' && !state.available ? 'Buy PDF - $27 USD' : PAYPAL_BUTTON_LABELS[format],
    external: state.available, available: state.available, message: state.message,
  };
  const label = `Buy ${format === 'pdf' ? 'PDF' : 'Print'} — $${book.formats[format].price}`;
  return { href: state.available ? checkoutHref(base, state.sku) : notificationHref(base, book.id, format), label, external: false, available: state.available, message: state.message };
}
export function selectedCheckout(sku: string, config: IntegrationConfig = integrationConfig, context?: CheckoutContext) {
  if (sku === BUNDLE.sku) return { title: BUNDLE.title, format: config.payments.provider === 'paypal' ? 'PDF + Paperback + Bonus' : config.payments.bundle.contentsLabel || 'Format awaiting confirmation', price: 97, state: bundleCheckout(config, context) };
  for (const book of BOOKS) for (const format of ['pdf', 'print'] as const) {
    if (book.formats[format].sku === sku) return { title: book.title, format: format === 'pdf' ? 'eBook (PDF)' : 'Print', price: book.formats[format].price, state: checkoutFor(book, format, config, context) };
  }
  return null;
}
export function whatsappUrl(value = integrationConfig.brand.whatsapp): string | null {
  // Accept an approved E.164 number or an exact wa.me link; reject other hosts and query strings.
  const raw = value.trim();
  const number = raw.startsWith('https://wa.me/') ? raw.slice(14) : raw.replace(/^\+/, '').replace(/ /g, '');
  if (!/^[1-9][0-9]{7,14}$/.test(number)) return null;
  return `https://wa.me/${number}`;
}
export function leadsAvailable(config = integrationConfig) { return integrationAvailable('leads', config); }

export async function postApi(path: string, body: unknown, config: IntegrationConfig = integrationConfig, fetcher: typeof fetch = fetch): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(`${config.forms.apiBase}/${path}`, { method: 'POST', credentials: 'omit', mode: 'cors', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true) throw new Error(response.status === 429 ? 'Too many attempts. Please wait a few minutes.' : 'We could not confirm your request. Please try again.');
    return result;
  } finally { clearTimeout(timer); }
}
export async function submitLead(data: LeadSubmission, config = integrationConfig, fetcher: typeof fetch = fetch): Promise<SubmissionResult & { delivery?: string }> {
  if (!leadsAvailable(config)) return { ok: false, message: 'Registration is being prepared. Please check back soon; your details have not been sent.' };
  if (!data.name.trim() || data.name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 254 || !data.consent || data.website || data.country.length > 80) return { ok: false, message: 'Check your name, email address and consent.' };
  try {
    const result = await postApi('leads', { ...data, email: data.email.trim().toLowerCase(), consentVersion: config.forms.privacyVersion }, config, fetcher);
    if (result.accepted !== true) return { ok: false, message: 'We could not confirm your registration. Please try again.' };
    if (data.kind === 'checklist' && result.notification !== 'queued') return { ok: false, message: 'We could not confirm the registration email. Please try again or contact admin@aafxx.com.' };
    return { ok: true, message: 'Your interest has been registered. Thank you for joining the AAFXX learning community.', delivery: result.delivery };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Please try again later.' }; }
}

export interface VerifiedOrder { title: string; sku: string; format: string; amountTotal: number; currency: string; transactionId: string; files: { name: string; url: string }[] }
export async function verifyOrder(sessionId: string, email: string, config = integrationConfig, fetcher: typeof fetch = fetch): Promise<VerifiedOrder | null> {
  if (!config.payments.verifiedPaymentWorkflowReady || !config.payments.digital.privateDeliveryReady || !config.forms.privacyApproved || !/^https:\/\//.test(config.forms.apiBase)) throw new Error('Order verification is pending configuration. Refer to your payment receipt or contact the academy.');
  const response = await postApi('order-status', { sessionId, email }, config, fetcher);
  if (response.status !== 'paid') return null;
  const order = response.order;
  if (!order || !/^[a-f0-9]{64}$/.test(order.transactionId) || !Number.isSafeInteger(order.amountTotal) || order.amountTotal < 2700 || order.currency !== 'usd' || !Array.isArray(order.files)) throw new Error('Order details could not be verified.');
  // Accept download links only from the configured backend. Never render arbitrary response URLs.
  const origin = new URL(config.forms.apiBase).origin;
  if (order.files.some((file: any) => { try { const url = new URL(file.url); return url.origin !== origin || url.pathname !== '/download' || !url.searchParams.get('token'); } catch { return true; } })) throw new Error('Download details could not be verified.');
  return order;
}
