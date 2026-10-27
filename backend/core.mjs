import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const EXPECTED_PRICES = Object.fromEntries([
  ...[1, 2, 3, 4].flatMap((n) => [[`aafxx-book-${n}-pdf`, 2700], [`aafxx-book-${n}-print`, 4700]]),
  ["aafxx-four-book-bundle", 9700],
]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION = /^cs_(?:test_|live_)?[A-Za-z0-9]+$/;
const cleanEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const hash = (value, key) => createHmac("sha256", key).update(value).digest("hex");
const objectId = (value) => typeof value === "string" ? value : value?.id;
const seconds = () => Math.floor(Date.now() / 1000);

export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function validateSubmission(kind, input, config, now = Date.now()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new RequestError(400, "Invalid submission.");
  const email = cleanEmail(input.email);
  if (!EMAIL.test(email) || email.length > 254 || input.consent !== true || input.consentVersion !== config.privacyVersion) throw new RequestError(400, "Check the email address and consent fields.");
  const elapsed = now - input.startedAt;
  if (typeof input.website !== "string" || input.website !== "" || !Number.isFinite(input.startedAt) || elapsed < 3000 || elapsed > 2 * 60 * 60 * 1000) throw new RequestError(400, "Refresh the form and try again.");
  const result = { email, consent: true, consentVersion: config.privacyVersion, consentAt: new Date(now).toISOString() };
  if (kind === "contact") for (const [key, maximum] of [["name", 100], ["subject", 200], ["message", 5000]]) {
    if (typeof input[key] !== "string" || !input[key].trim() || input[key].length > maximum || (key !== "message" && /[\r\n]/.test(input[key]))) throw new RequestError(400, "Check the name, subject and message fields.");
    result[key] = input[key].trim();
  }
  if (kind === "leads") {
    if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100 || /[\r\n]/.test(input.name) || typeof input.country !== "string" || input.country.length > 80 || /[\r\n]/.test(input.country)) throw new RequestError(400, "Check the name and country fields.");
    if (!["books", "checklist", "mentorship"].includes(input.kind) || !["all", "aafxx-complete-library", ...[1,2,3,4].map(n=>`aafxx-book-${n}`)].includes(input.bookId) || !["pdf", "print", "undecided"].includes(input.format)) throw new RequestError(400, "Choose a valid book and format.");
    if (input.kind !== "books" && (input.bookId !== "all" || input.format !== "undecided")) throw new RequestError(400, "Invalid registration selection.");
    Object.assign(result, { name: input.name.trim(), country: input.country.trim(), kind: input.kind, bookId: input.bookId, format: input.format });
  }
  return result;
}

/** Verify Stripe-owned price and product objects against the server allowlist. */
export function validateSession(session, config) {
  if (!session || !SESSION.test(session.id || "") || session.mode !== "payment" || session.livemode !== (config.mode === "live") || session.currency !== "usd") throw new RequestError(422, "Unexpected checkout session.");
  const lines = session.line_items;
  if (!lines || lines.has_more || lines.data?.length !== 1) throw new RequestError(422, "Unexpected checkout contents.");
  const line = lines.data[0];
  const price = line.price;
  const product = config.products?.find((p) => p.enabled && p.stripePriceId === price?.id);
  if (!product || EXPECTED_PRICES[product.sku] !== product.priceCents || price.currency !== "usd" || price.unit_amount !== product.priceCents || price.type !== "one_time" || objectId(price.product) !== product.stripeProductId || objectId(session.payment_link) !== product.stripePaymentLinkId || line.quantity !== 1 || line.amount_subtotal !== product.priceCents || session.amount_subtotal !== product.priceCents) throw new RequestError(422, "Checkout does not match an approved product.");
  const details = session.total_details || {};
  const tax = details.amount_tax ?? 0;
  const shipping = details.amount_shipping ?? 0;
  if ((details.amount_discount ?? 0) !== 0 || !Number.isSafeInteger(tax) || tax < 0 || !Number.isSafeInteger(shipping) || shipping < 0 || session.amount_total !== product.priceCents + tax + shipping) throw new RequestError(422, "Checkout total requires review.");
  const email = cleanEmail(session.customer_details?.email);
  if (!EMAIL.test(email) || email.length > 254) throw new RequestError(422, "A delivery email address is required.");
  if (config.mode === "test" && !config.testRecipientAllowlist?.includes(email)) throw new RequestError(422, "Test delivery recipient is not approved.");
  if (!["pdf", "print", "mixed"].includes(product.format) || !product.fulfilmentApproved) throw new RequestError(422, "Product fulfilment is not approved.");
  if (product.sku.endsWith("-pdf") && product.format !== "pdf" || product.sku.endsWith("-print") && product.format !== "print") throw new RequestError(422, "Product format does not match its SKU.");
  let includedSkus = [product.sku];
  if (product.sku === "aafxx-four-book-bundle") {
    includedSkus = product.includedSkus || [];
    if (!product.contentsConfirmed || includedSkus.length !== 4 || new Set(includedSkus).size !== 4 || ![1, 2, 3, 4].every((n) => {
      const selected = ["pdf", "print"].filter((format) => includedSkus.includes(`aafxx-book-${n}-${format}`));
      return selected.length === 1 && (product.format === "mixed" || selected[0] === product.format);
    })) throw new RequestError(422, "Bundle contents are not confirmed.");
    if (product.format === "mixed" && (!includedSkus.some((sku) => sku.endsWith("-pdf")) || !includedSkus.some((sku) => sku.endsWith("-print")))) throw new RequestError(422, "Mixed bundle contents do not match its format.");
  }
  const digitalSkus = includedSkus.filter((sku) => sku.endsWith("-pdf"));
  const files = product.files || [];
  if (files.length !== digitalSkus.length || new Set(files.map((f) => f.key)).size !== digitalSkus.length || new Set(files.map((f) => f.sku)).size !== digitalSkus.length || files.some((f) => !digitalSkus.includes(f.sku) || !/^paid-content\/[A-Za-z0-9/_-]+\.pdf$/.test(f.key) || !/^[A-Za-z0-9 _-]+\.pdf$/.test(f.filename))) throw new RequestError(422, "Private PDF content does not match the purchased editions.");
  let shippingDetails = null;
  if (product.format !== "pdf") {
    shippingDetails = session.collected_information?.shipping_details || session.shipping_details;
    const rate = objectId(session.shipping_cost?.shipping_rate);
    if (!shippingDetails?.name || !shippingDetails.address?.line1 || !shippingDetails.address?.country || !product.shipping?.countries?.includes(shippingDetails.address.country) || (!product.shipping.rateIds?.includes(rate) && !(product.shipping.freeApproved === true && shipping === 0 && !rate))) throw new RequestError(422, "Shipping configuration requires review.");
  }
  return { product, email, shippingDetails };
}

export function createDownloadToken(order, fileIndex, key) {
  if (typeof key !== "string" || key.length < 32) throw new Error("A strong download token secret is required.");
  const payload = Buffer.from(JSON.stringify({ order: order.sessionId, file: fileIndex, version: order.downloadVersion, expires: order.downloadExpiresAt })).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function readDownloadToken(token, key, now = seconds()) {
  if (typeof token !== "string" || token.length > 2000 || typeof key !== "string" || key.length < 32) throw new RequestError(403, "This download link is invalid.");
  const parts = token.split(".");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) throw new RequestError(403, "This download link is invalid.");
  const signature = Buffer.from(parts[1], "base64url");
  const expected = createHmac("sha256", key).update(parts[0]).digest();
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) throw new RequestError(403, "This download link is invalid.");
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); } catch { throw new RequestError(403, "This download link is invalid."); }
  if (!SESSION.test(payload.order || "") || !Number.isInteger(payload.file) || payload.file < 0 || typeof payload.version !== "string" || !Number.isSafeInteger(payload.expires)) throw new RequestError(403, "This download link is invalid.");
  if (payload.expires <= now) throw new RequestError(410, "This download link has expired. Request a fresh link from the order recovery form.");
  return payload;
}

/**
 * Pure request handling with injected storage/Stripe/email adapters for testing.
 * No public endpoint accepts a browser-supplied payment amount or storage key.
 */
export function createApi(deps) {
  const { config, store } = deps;
  const response = (statusCode, body, origin = "", additional = {}) => ({
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", ...(origin ? { "access-control-allow-origin": origin, "vary": "Origin" } : {}), ...additional },
    body: JSON.stringify(body),
  });
  async function rateLimit(event, scope, limit = 5) {
    const ip = event.requestContext?.http?.sourceIp;
    if (!ip || !config.rateLimitSalt || config.rateLimitSalt.length < 32) throw new RequestError(503, "Service configuration is incomplete.");
    const window = Math.floor(seconds() / 60);
    const allowed = await store.rateLimit(`RATE#${scope}#${hash(ip, config.rateLimitSalt)}#${window}`, limit, (window + 2) * 60);
    if (!allowed) throw new RequestError(429, "Too many attempts. Please wait a few minutes.");
  }
  async function emailOrder(order) {
    const files = order.files.map((file, index) => ({ name: file.filename, url: `${config.publicApiBase}/download?token=${encodeURIComponent(createDownloadToken(order, index, config.downloadTokenSecret))}` }));
    await deps.sendReceipt(order, files);
  }
  async function webhook(raw, headers) {
    if (!config.paymentsEnabled) throw new RequestError(503, "Payment handling is not enabled.");
    let event;
    try { event = deps.verifyWebhook(raw, headers["stripe-signature"]); } catch { throw new RequestError(400, "Invalid webhook signature."); }
    if (event.livemode !== (config.mode === "live")) throw new RequestError(400, "Webhook environment mismatch.");
    if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type)) return { ok: true, ignored: true };
    const sessionId = event.data?.object?.id;
    if (!SESSION.test(sessionId || "")) throw new RequestError(400, "Invalid checkout reference.");
    const session = await deps.retrieveSession(sessionId);
    if (session.id !== sessionId) throw new RequestError(422, "Checkout reference mismatch.");
    const { product, email, shippingDetails } = validateSession(session, config);
    if (session.payment_status !== "paid") {
      await store.recordUnpaid(sessionId, event.type.endsWith("failed") ? "failed" : "pending", product.sku);
      return { ok: true, pending: true };
    }
    const now = seconds();
    let order = await store.recordPaid({
      sessionId, sku: product.sku, title: product.title, format: product.format,
      email, files: product.files || [], shippingDetails, amountTotal: session.amount_total,
      currency: "usd", paymentStatus: "paid", mode: config.mode,
      createdAt: new Date().toISOString(), downloadVersion: randomUUID(), downloadExpiresAt: now + 86400,
      fulfilmentStatus: product.format === "pdf" ? "digital-ready" : "awaiting-dispatch",
    });
    if (order.paymentStatus !== "paid") return { ok: true, ignored: true };
    if (order.receiptSent) return { ok: true, duplicate: true };
    const lease = randomUUID();
    // A retry must remain eligible if a previous worker died while holding its lease.
    if (!await store.claimDelivery(sessionId, lease, now + 90)) throw new RequestError(503, "Payment delivery is already being processed. Retry later.");
    try {
      if (order.downloadExpiresAt < now + 300) order = await store.extendDownload(sessionId, now + 86400);
      await emailOrder(order);
      await store.markDelivered(sessionId, lease, new Date().toISOString());
    } catch (error) {
      await store.releaseDelivery(sessionId, lease);
      throw error;
    }
    return { ok: true };
  }
  return async (event) => {
    const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path || "/";
    const origin = config.allowedOrigins?.includes(headers.origin) ? headers.origin : "";
    try {
      if (method === "POST" && path === "/stripe/webhook") {
        const raw = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
        if (raw.length > 512000) throw new RequestError(413, "Request is too large.");
        return response(200, await webhook(raw, headers));
      }
      if (method === "GET" && path === "/download") {
        await rateLimit(event, "download", 20);
        const token = readDownloadToken(event.queryStringParameters?.token, config.downloadTokenSecret);
        const order = await store.getOrder(token.order);
        if (!order || order.paymentStatus !== "paid" || order.mode !== config.mode || order.downloadVersion !== token.version || order.downloadExpiresAt < token.expires || !order.files[token.file]) throw new RequestError(403, "This download is not available.");
        const url = await deps.signDownload(order.files[token.file]);
        return response(303, { ok: true }, "", { location: url });
      }
      if (!["/contact", "/waitlist", "/recover", "/leads", "/order-status"].includes(path)) return response(404, { ok: false, message: "Endpoint not found." });
      if (!origin) throw new RequestError(403, "Origin is not permitted.");
      if (method === "OPTIONS") return response(204, null, origin, { "access-control-allow-methods": "POST,OPTIONS", "access-control-allow-headers": "Content-Type", "access-control-max-age": "600" });
      if (method !== "POST") throw new RequestError(405, "Method not allowed.");
      if (!headers["content-type"]?.toLowerCase().startsWith("application/json")) throw new RequestError(415, "Send JSON data.");
      const raw = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
      if (raw.length > 12000) throw new RequestError(413, "Request is too large.");
      let input;
      try { input = JSON.parse(raw.toString("utf8")); } catch { throw new RequestError(400, "Invalid JSON data."); }
      await rateLimit(event, path, ["/recover", "/order-status"].includes(path) ? 2 : 5);
      if (path === "/order-status") {
        if (!config.paymentsEnabled) throw new RequestError(503, "Order verification is not available.");
        const email = cleanEmail(input?.email);
        if (!EMAIL.test(email) || email.length > 254 || !SESSION.test(input?.sessionId || "")) throw new RequestError(400, "Check the order reference and checkout email.");
        const unavailable = () => response(200, { ok: true, status: "unconfirmed" }, origin);
        const order = await store.getOrder(input.sessionId);
        // A query parameter, Stripe redirect or browser assertion can never establish payment.
        if (!order || order.paymentStatus !== "paid" || order.mode !== config.mode || order.email !== email) return unavailable();
        const session = await deps.retrieveSession(input.sessionId);
        const verified = validateSession(session, config);
        if (session.id !== order.sessionId || session.payment_status !== "paid" || session.status !== "complete" || verified.email !== email || verified.product.sku !== order.sku || session.amount_total !== order.amountTotal) return unavailable();
        // Re-read after the provider call so an operator revocation remains authoritative.
        const current = await store.getOrder(order.sessionId);
        if (current?.paymentStatus !== "paid" || current.downloadVersion !== order.downloadVersion) return unavailable();
        const files = current.downloadExpiresAt > seconds() ? current.files.map((file, index) => ({ name: file.filename, url: `${config.publicApiBase}/download?token=${encodeURIComponent(createDownloadToken(current, index, config.downloadTokenSecret))}` })) : [];
        return response(200, { ok: true, status: "paid", order: {
          title: current.title, sku: current.sku, format: current.format, amountTotal: current.amountTotal, currency: current.currency,
          transactionId: hash(`analytics:${current.sessionId}`, config.rateLimitSalt), files,
        } }, origin);
      }
      if (path === "/recover") {
        if (!config.paymentsEnabled) throw new RequestError(503, "Order recovery is unavailable.");
        const email = cleanEmail(input?.email);
        if (!EMAIL.test(email) || email.length > 254 || !SESSION.test(input?.sessionId || "") || input.website !== "" || !Number.isFinite(input.startedAt) || Date.now() - input.startedAt < 3000 || Date.now() - input.startedAt > 7200000) throw new RequestError(400, "Check the order reference and email address.");
        const order = await store.getOrder(input.sessionId);
        // Do not disclose whether the order/email exists to this unauthenticated caller.
        if (order?.paymentStatus === "paid" && order.mode === config.mode && order.email === email && order.files.length) {
          // Extending the allowed window does not alter an older token's signed expiry.
          // Existing valid links remain usable even if this email attempt fails.
          const refreshed = await store.extendDownload(order.sessionId, seconds() + 86400);
          await emailOrder(refreshed);
        }
        return response(202, { ok: true, accepted: true, message: "If the details match a paid digital order, fresh links will be sent to its original email address." }, origin);
      }
      const kind = path.slice(1);
      if (!config[`${kind}Enabled`] || !config.privacyVersion) throw new RequestError(503, "Registrations are not available yet.");
      const data = validateSubmission(kind, input, config);
      const retention = config[`${kind}RetentionDays`];
      if (!Number.isInteger(retention) || retention < 1 || retention > 730) throw new RequestError(503, "Data retention must be configured.");
      const id = kind === "waitlist" ? hash(data.email, config.rateLimitSalt) : kind === "leads" ? hash(`${data.email}:${data.kind}:${data.bookId}:${data.format}`, config.rateLimitSalt) : randomUUID();
      if (kind === "leads") {
        const day = Math.floor(seconds() / 86400);
        if (!await store.rateLimit(`EMAIL#${hash(data.email, config.rateLimitSalt)}#${day}`, 8, (day+2)*86400)) throw new RequestError(429, "Too many attempts. Please try again later.");
      }
      await store.persistSubmission(kind, id, { ...data, createdAt: new Date().toISOString(), expiresAt: seconds() + retention * 86400 });
      if (kind === "leads" && data.kind === "checklist" && config.checklist?.approved && config.checklist?.key) {
        let delivery = "pending";
        try { delivery = await deps.sendChecklist(id, data); } catch { /* Durable lead remains accepted; retry can resume delivery. */ }
        return response(202, { ok: true, accepted: true, delivery }, origin);
      }
      return response(202, { ok: true, accepted: true }, origin);
    } catch (error) {
      // Never return Stripe/SDK messages, email addresses, tokens, or secret details.
      return response(error instanceof RequestError ? error.status : 503, { ok: false, accepted: false, message: error instanceof RequestError ? error.message : "We could not complete this request. Please try again later." }, origin);
    }
  };
}
