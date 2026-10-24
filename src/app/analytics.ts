import { funnelConfig } from './funnel-config';
import { BOOKS, BUNDLE } from './catalogue';
type EventName = 'book_viewed' | 'buy_now_clicked' | 'begin_checkout' | 'purchase' | 'bundle_selected' | 'email_lead_submitted' | 'checklist_requested' | 'whatsapp_mentorship_clicked' | 'mentorship_applied' | 'page_view';
const allowedProducts = new Set(['all', BUNDLE.id, BUNDLE.sku, ...BOOKS.flatMap(b => [b.id, b.formats.pdf.sku, b.formats.print.sku])]);
let enabled = false;
const sent = new Set<string>();
function gtag(..._args: unknown[]) { (window as any).dataLayer.push(arguments); }
export function analyticsConfigured() { return funnelConfig.analytics.approved && /^G-[A-Z0-9]+$/.test(funnelConfig.analytics.measurementId); }
export function analyticsConsent(allow: boolean) {
  try { localStorage.setItem('aafxx-analytics', allow ? 'granted' : 'denied'); } catch {}
  if (!allow) { enabled = false; if ((window as any).dataLayer) gtag('consent', 'update', { analytics_storage: 'denied' }); return; }
  if (!analyticsConfigured() || enabled) return;
  enabled = true;
  (window as any).dataLayer ||= [];
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', funnelConfig.analytics.measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname, page_referrer: '' });
  if (!document.getElementById('aafxx-analytics')) { const script = document.createElement('script'); script.id = 'aafxx-analytics'; script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + funnelConfig.analytics.measurementId; document.head.append(script); }
}
export function analyticsPreference(): string { try { return localStorage.getItem('aafxx-analytics') || ''; } catch { return ''; } }
export function track(name: EventName, data: { product?: string; kind?: string; amount?: number; transactionId?: string } = {}) {
  if (!enabled) return;
  const fields: Record<string, unknown> = { page_location: location.origin + location.pathname, page_referrer: '' };
  if (data.product && allowedProducts.has(data.product)) fields['item_id'] = data.product;
  if (data.kind && ['books', 'checklist', 'mentorship'].includes(data.kind)) fields['lead_kind'] = data.kind;
  if (name === 'purchase') {
    if (!data.transactionId || !/^[a-f0-9]{64}$/.test(data.transactionId) || !Number.isFinite(data.amount) || sent.has(data.transactionId)) return;
    try { if (sessionStorage.getItem('aafxx-purchase-' + data.transactionId)) return; sessionStorage.setItem('aafxx-purchase-' + data.transactionId, '1'); } catch {}
    sent.add(data.transactionId);
    fields['transaction_id'] = data.transactionId; fields['value'] = data.amount; fields['currency'] = 'USD';
    fields['items'] = [{ item_id: data.product, quantity: 1 }];
  }
  gtag('event', name, fields);
}
