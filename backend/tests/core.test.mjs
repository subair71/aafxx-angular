import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createApi, createDownloadToken, readDownloadToken, validateSession, validateSubmission } from "../core.mjs";

const stripe = new Stripe("sk_test_local_unit_fixture");
const webhookSecret = "whsec_local_unit_fixture_only";
const origin = "https://branch.example.test";
const now = () => Math.floor(Date.now() / 1000);

function fixture() {
  const product = { enabled: true, sku: "aafxx-book-1-pdf", title: "ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE", stripePriceId: "price_pdf1", stripeProductId: "prod_pdf1", stripePaymentLinkId: "plink_pdf1", priceCents: 2700, format: "pdf", fulfilmentApproved: true, files: [{ sku: "aafxx-book-1-pdf", key: "paid-content/book-1.pdf", filename: "AAFXX-Book-1.pdf" }] };
  const config = { mode: "test", paymentsEnabled: true, contactEnabled: true, waitlistEnabled: true, privacyVersion: "2026-10-23", contactRetentionDays: 90, waitlistRetentionDays: 365, rateLimitSalt: "R".repeat(44), downloadTokenSecret: "D".repeat(44), testRecipientAllowlist: ["reader@example.test"], products: [product], allowedOrigins: [origin], publicApiBase: "https://api.example.test" };
  let session = { id: "cs_test_fixture1", mode: "payment", livemode: false, currency: "usd", payment_status: "paid", payment_link: "plink_pdf1", amount_subtotal: 2700, amount_total: 2700, total_details: { amount_tax: 0, amount_shipping: 0, amount_discount: 0 }, customer_details: { email: "reader@example.test" }, line_items: { has_more: false, data: [{ quantity: 1, amount_subtotal: 2700, price: { id: "price_pdf1", product: "prod_pdf1", currency: "usd", unit_amount: 2700, type: "one_time" } }] } };
  const records = new Map(), submissions = new Map(), receipts = [], signed = [];
  const store = {
    rateLimit: async () => true,
    async persistSubmission(kind, id, data) { submissions.set(`${kind}:${id}`, data); },
    async getOrder(id) { return records.get(id); },
    async recordUnpaid(id, status, sku) { if (!records.has(id) || ["pending", "failed"].includes(records.get(id).paymentStatus)) records.set(id, { sessionId: id, paymentStatus: status, sku }); },
    async recordPaid(order) { if (!records.has(order.sessionId) || ["pending", "failed"].includes(records.get(order.sessionId).paymentStatus)) records.set(order.sessionId, order); return records.get(order.sessionId); },
    async claimDelivery(id, lease, until) { const order = records.get(id); if (order.receiptSent || order.leaseUntil > now()) return false; Object.assign(order, { lease, leaseUntil: until }); return true; },
    async markDelivered(id, lease) { const order = records.get(id); assert.equal(order.lease, lease); order.receiptSent = true; delete order.lease; delete order.leaseUntil; },
    async releaseDelivery(id, lease) { const order = records.get(id); if (order.lease === lease) { delete order.lease; delete order.leaseUntil; } },
    async extendDownload(id, expires) { const order = records.get(id); order.downloadExpiresAt = Math.max(order.downloadExpiresAt, expires); return order; },
  };
  const deps = { config, store,
    verifyWebhook: (raw, signature) => stripe.webhooks.constructEvent(raw, signature, webhookSecret),
    retrieveSession: async () => structuredClone(session),
    async sendReceipt(order, files) { receipts.push({ email: order.email, files }); },
    async signDownload(file) { signed.push(file); return "https://private-s3.example.test/short-lived-download"; },
  };
  const api = createApi(deps);
  const webhook = (type = "checkout.session.completed", alterations = {}) => {
    const body = JSON.stringify({ id: "evt_local1", object: "event", type, livemode: false, data: { object: { id: session.id } }, ...alterations });
    return { rawPath: "/stripe/webhook", requestContext: { http: { method: "POST", sourceIp: "192.0.2.1" } }, headers: { "Stripe-Signature": stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret }) }, body };
  };
  return { config, product, deps, api, store, records, receipts, submissions, signed, webhook, get session() { return session; }, set session(value) { session = value; } };
}

function request(path, data = {}, method = "POST") {
  return { rawPath: path, headers: { origin, "Content-Type": "application/json" }, requestContext: { http: { method, sourceIp: "192.0.2.1" } }, body: JSON.stringify(data) };
}
const submission = () => ({ name: "A reader", email: "reader@example.test", subject: "Books", message: "Please confirm availability.", consent: true, consentVersion: "2026-10-23", website: "", startedAt: Date.now() - 5000 });
const body = (response) => JSON.parse(response.body);

test("contact and waitlist acknowledge only durable storage; duplicate waitlist uses one private key", async () => {
  const f = fixture();
  assert.equal((await f.api(request("/contact", submission()))).statusCode, 202);
  assert.equal((await f.api(request("/waitlist", submission()))).statusCode, 202);
  assert.equal((await f.api(request("/waitlist", submission()))).statusCode, 202);
  assert.equal(f.submissions.size, 2);
  for (const record of f.submissions.values()) assert.equal(record.consentVersion, "2026-10-23");
  f.store.persistSubmission = async () => { throw new Error("storage unavailable"); };
  const failed = await f.api(request("/contact", submission()));
  assert.equal(failed.statusCode, 503);
  assert.equal(body(failed).accepted, false);
});

test("unknown origins, invalid consent, honeypots and rapid form automation are rejected", async () => {
  const f = fixture();
  const external = request("/contact", submission()); external.headers.origin = "https://unknown.example.test";
  assert.equal((await f.api(external)).statusCode, 403);
  for (const alteration of [{ consent: false }, { consentVersion: "old" }, { website: "spam" }, { startedAt: Date.now() }, { name: "" }, { email: "not an email" }]) {
    assert.equal((await f.api(request("/contact", { ...submission(), ...alteration }))).statusCode, 400);
  }
  assert.equal(f.submissions.size, 0);
});

test("rate limits return 429 before any durable form record or receipt", async () => {
  const f = fixture(); f.store.rateLimit = async () => false;
  const result = await f.api(request("/waitlist", submission()));
  assert.equal(result.statusCode, 429);
  assert.equal(body(result).accepted, false);
  assert.equal(f.submissions.size, 0);
});

test("actual Stripe SDK signature checks reject changed raw bytes and wrong environments", async () => {
  const f = fixture();
  const changed = f.webhook(); changed.body += " ";
  assert.equal((await f.api(changed)).statusCode, 400);
  assert.equal((await f.api(f.webhook("checkout.session.completed", { livemode: true }))).statusCode, 400);
  assert.equal(f.records.size, 0);
  assert.equal(f.receipts.length, 0);
  const encoded = f.webhook(); encoded.body = Buffer.from(encoded.body).toString("base64"); encoded.isBase64Encoded = true;
  assert.equal((await f.api(encoded)).statusCode, 200);
  assert.equal(f.receipts.length, 1);
});

test("wrong price, product, payment link, currency, quantity or total never grants files", async () => {
  const alterations = [
    (s) => s.line_items.data[0].price.id = "price_other",
    (s) => s.line_items.data[0].price.product = "prod_other",
    (s) => s.payment_link = "plink_other",
    (s) => s.currency = "eur",
    (s) => s.line_items.data[0].quantity = 2,
    (s) => s.amount_total = 1,
    (s) => s.amount_subtotal = 2600,
    (s) => s.total_details.amount_discount = 100,
    (s) => s.line_items.has_more = true,
    (s) => s.customer_details.email = "unapproved@example.test",
  ];
  for (const alter of alterations) {
    const f = fixture(); alter(f.session);
    assert.equal((await f.api(f.webhook())).statusCode, 422);
    assert.equal(f.receipts.length, 0);
    assert.equal(f.records.size, 0);
  }
});

test("unpaid/delayed payments persist pending or failed state without fulfilment, then fulfil on verified payment", async () => {
  const f = fixture(); f.session.payment_status = "unpaid";
  assert.equal((await f.api(f.webhook())).statusCode, 200);
  assert.equal(f.records.get(f.session.id).paymentStatus, "pending");
  assert.equal(f.receipts.length, 0);
  await f.api(f.webhook("checkout.session.async_payment_failed"));
  assert.equal(f.records.get(f.session.id).paymentStatus, "failed");
  f.session.payment_status = "paid";
  await f.api(f.webhook("checkout.session.async_payment_succeeded"));
  assert.equal(f.records.get(f.session.id).paymentStatus, "paid");
  assert.equal(f.receipts.length, 1);
  // An out-of-order failure event cannot downgrade a session Stripe currently reports paid.
  await f.api(f.webhook("checkout.session.async_payment_failed"));
  assert.equal(f.records.get(f.session.id).paymentStatus, "paid");
  assert.equal(f.receipts.length, 1);
});

test("repeated and concurrent webhook delivery creates one entitlement and one successful receipt", async () => {
  const f = fixture();
  const results = await Promise.all([f.api(f.webhook()), f.api(f.webhook())]);
  assert(results.every((r) => [200, 503].includes(r.statusCode)));
  assert.equal(f.records.size, 1);
  assert.equal(f.receipts.length, 1);
  const replay = await f.api(f.webhook());
  assert.equal(replay.statusCode, 200);
  assert.equal(body(replay).duplicate, true);
  assert.equal(f.receipts.length, 1);
});

test("a worker-held lease returns retryable 503, and failed delivery can resume without a second entitlement", async () => {
  const f = fixture();
  const original = f.deps.sendReceipt;
  let attempts = 0;
  f.deps.sendReceipt = async (...args) => { if (attempts++ === 0) throw new Error("email temporarily unavailable"); return original(...args); };
  assert.equal((await f.api(f.webhook())).statusCode, 503);
  assert.equal(f.records.size, 1);
  assert.equal(f.receipts.length, 0);
  const order = f.records.get(f.session.id);
  order.lease = "crashed-worker"; order.leaseUntil = now() + 60;
  assert.equal((await f.api(f.webhook())).statusCode, 503);
  delete order.lease; delete order.leaseUntil;
  assert.equal((await f.api(f.webhook())).statusCode, 200);
  assert.equal(f.records.size, 1);
  assert.equal(f.receipts.length, 1);
});

test("partial email/store failure retains one entitlement but may retry the receipt", async () => {
  const f = fixture();
  const mark = f.store.markDelivered;
  let attempts = 0;
  f.store.markDelivered = async (...args) => { if (attempts++ === 0) throw new Error("storage unavailable after SES acceptance"); return mark(...args); };
  assert.equal((await f.api(f.webhook())).statusCode, 503);
  assert.equal(f.receipts.length, 1);
  assert.equal((await f.api(f.webhook())).statusCode, 200);
  assert.equal(f.records.size, 1);
  assert.equal(f.receipts.length, 2);
  assert.equal(f.receipts[0].files[0].url, f.receipts[1].files[0].url);
});

test("valid tokens authorize only an existing paid order's configured private file", async () => {
  const f = fixture(); await f.api(f.webhook());
  const token = new URL(f.receipts[0].files[0].url).searchParams.get("token");
  const download = request("/download", {}, "GET"); download.queryStringParameters = { token };
  const result = await f.api(download);
  assert.equal(result.statusCode, 303);
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(f.signed[0].key, "paid-content/book-1.pdf");
  f.records.get(f.session.id).paymentStatus = "revoked";
  assert.equal((await f.api(download)).statusCode, 403);
  assert.equal(f.signed.length, 1);
  assert.equal((await f.api(f.webhook())).statusCode, 200);
  assert.equal(f.records.get(f.session.id).paymentStatus, "revoked");
  assert.equal(f.receipts.length, 1);
  assert.equal((await f.api(download)).statusCode, 403);
});

test("forged, expired, wrong-version and out-of-range file tokens cannot produce a presigned URL", async () => {
  const f = fixture(); await f.api(f.webhook());
  const order = f.records.get(f.session.id);
  const tokens = [
    "paid=true",
    createDownloadToken(order, 0, "wrong".repeat(12)),
    createDownloadToken({ ...order, downloadExpiresAt: now() - 1 }, 0, f.config.downloadTokenSecret),
    createDownloadToken({ ...order, downloadVersion: "old" }, 0, f.config.downloadTokenSecret),
    createDownloadToken(order, 100, f.config.downloadTokenSecret),
  ];
  for (const token of tokens) {
    const event = request("/download", {}, "GET"); event.queryStringParameters = { token };
    assert([403, 410].includes((await f.api(event)).statusCode));
  }
  assert.equal(f.signed.length, 0);
});

test("recovery never reveals order existence and sends only to the original matching email", async () => {
  const f = fixture(); await f.api(f.webhook());
  const previousToken = new URL(f.receipts[0].files[0].url).searchParams.get("token");
  const recovery = { sessionId: f.session.id, email: "stranger@example.test", website: "", startedAt: Date.now() - 5000 };
  const unmatched = await f.api(request("/recover", recovery));
  assert.equal(unmatched.statusCode, 202);
  assert.equal(f.receipts.length, 1);
  const matched = await f.api(request("/recover", { ...recovery, email: "reader@example.test" }));
  assert.deepEqual(body(matched), body(unmatched));
  assert.equal(f.receipts.length, 2);
  assert.equal(f.receipts[1].email, "reader@example.test");
  const event = request("/download", {}, "GET"); event.queryStringParameters = { token: previousToken };
  assert.equal((await f.api(event)).statusCode, 303);
  f.deps.sendReceipt = async () => { throw new Error("temporary email failure"); };
  assert.equal((await f.api(request("/recover", { ...recovery, email: "reader@example.test" }))).statusCode, 503);
  assert.equal((await f.api(event)).statusCode, 303);
});

test("print orders require an approved shipping country and an allowed rate before fulfilment", () => {
  const f = fixture();
  Object.assign(f.product, { sku: "aafxx-book-1-print", format: "print", priceCents: 4700, files: [], shipping: { countries: ["BH"], rateIds: ["shr_local"], freeApproved: false } });
  const s = f.session; s.amount_subtotal = 4700; s.amount_total = 5200; s.total_details.amount_shipping = 500;
  s.line_items.data[0].amount_subtotal = 4700; s.line_items.data[0].price.unit_amount = 4700;
  assert.throws(() => validateSession(s, f.config));
  s.collected_information = { shipping_details: { name: "A reader", address: { line1: "A supplied address", country: "BH" } } };
  s.shipping_cost = { shipping_rate: "shr_wrong" };
  assert.throws(() => validateSession(s, f.config));
  s.shipping_cost.shipping_rate = "shr_local";
  assert.equal(validateSession(s, f.config).product.format, "print");
});

test("private content keys cannot escape the approved prefix and bundle contents need explicit confirmation", () => {
  const f = fixture();
  f.product.files[0].key = "paid-content/../../secrets.pdf";
  assert.throws(() => validateSession(f.session, f.config));
  f.product.files = [1, 2, 3, 4].map((n) => ({ sku: `aafxx-book-${n}-pdf`, key: `paid-content/book-${n}.pdf`, filename: `Book-${n}.pdf` }));
  f.product.sku = "aafxx-four-book-bundle"; f.product.priceCents = 9700;
  const s = f.session; s.amount_total = s.amount_subtotal = s.line_items.data[0].amount_subtotal = s.line_items.data[0].price.unit_amount = 9700;
  assert.throws(() => validateSession(s, f.config));
  f.product.contentsConfirmed = true;
  f.product.includedSkus = [1, 2, 3, 4].map((n) => `aafxx-book-${n}-pdf`);
  assert.equal(validateSession(s, f.config).product.files.length, 4);
});

test("mixed bundles grant only their explicitly selected digital editions", () => {
  const f = fixture();
  Object.assign(f.product, { sku: "aafxx-four-book-bundle", priceCents: 9700, format: "mixed", contentsConfirmed: true,
    includedSkus: ["aafxx-book-1-pdf", "aafxx-book-2-pdf", "aafxx-book-3-print", "aafxx-book-4-print"],
    files: [1, 2].map((n) => ({ sku: `aafxx-book-${n}-pdf`, key: `paid-content/book-${n}.pdf`, filename: `Book-${n}.pdf` })),
    shipping: { countries: ["BH"], rateIds: [], freeApproved: true },
  });
  const s = f.session; s.amount_total = s.amount_subtotal = s.line_items.data[0].amount_subtotal = s.line_items.data[0].price.unit_amount = 9700;
  s.collected_information = { shipping_details: { name: "A reader", address: { line1: "A supplied address", country: "BH" } } };
  assert.equal(validateSession(s, f.config).product.files.length, 2);
  f.product.files.push({ sku: "aafxx-book-3-pdf", key: "paid-content/book-3.pdf", filename: "Book-3.pdf" });
  assert.throws(() => validateSession(s, f.config));
});
