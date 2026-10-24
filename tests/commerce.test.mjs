import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Compile the same production modules, without introducing a browser or a test-only copy.
const directory = mkdtempSync(join(tmpdir(), "aafxx-commerce-"));
for (const name of ["catalogue", "integration-config", "commerce"]) {
  const source = readFileSync(new URL(`../src/app/${name}.ts`, import.meta.url), "utf8");
  writeFileSync(join(directory, `${name}.js`), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText);
}
after(() => rmSync(directory, { recursive: true, force: true }));
const require = createRequire(import.meta.url);
const { BOOKS, BUNDLE } = require(join(directory, "catalogue.js"));
const { integrationConfig } = require(join(directory, "integration-config.js"));
const { checkoutFor, bundleCheckout, resolveCheckoutProvider, submitContact, submitWaitlist, integrationAvailable } = require(join(directory, "commerce.js"));
const context = { preview: true, environment: "test" };

function readyConfig() {
  const config = structuredClone(integrationConfig);
  Object.assign(config.payments, { policiesApproved: true, verifiedPaymentWorkflowReady: true });
  config.payments.digital.privateDeliveryReady = true;
  config.payments.print.fulfilmentReady = true;
  for (const book of BOOKS) for (const format of ["pdf", "print"]) {
    const variant = book.formats[format];
    config.payments.links[variant.sku] = { test: {
      url: `https://buy.stripe.com/test_Book${book.number}${format}`,
      sku: variant.sku, environment: "test", stripeProductId: `prod_Book${book.number}${format}`,
      stripePriceId: `price_Book${book.number}${format}`, amountCents: variant.price * 100, currency: "usd", merchantVerified: true,
    } };
    config.payments.digital.contentReadySkus.push(variant.sku);
    config.payments.print.shippingReadySkus.push(variant.sku);
  }
  return config;
}

test("all eight selections resolve to the matching validated SKU and USD amount", () => {
  const config = readyConfig();
  const seen = new Set();
  for (const book of BOOKS) for (const format of ["pdf", "print"]) {
    const result = checkoutFor(book, format, config, context);
    assert.equal(result.available, true);
    assert.equal(result.sku, book.formats[format].sku);
    assert.equal(result.url, config.payments.links[result.sku].test.url);
    assert.equal(book.formats[format].price, format === "pdf" ? 27 : 47);
    seen.add(result.sku);
  }
  assert.equal(seen.size, 8);
});

test("missing delivery, shipping, policy or verification configuration fails closed", () => {
  for (const book of BOOKS) for (const format of ["pdf", "print"]) {
    const result = checkoutFor(book, format);
    assert.equal(result.available, false);
    assert.equal(result.url, null);
  }
  for (const change of [
    (c) => c.payments.digital.privateDeliveryReady = false,
    (c) => c.payments.digital.contentReadySkus = [],
    (c) => c.payments.policiesApproved = false,
    (c) => c.payments.verifiedPaymentWorkflowReady = false,
  ]) {
    const c = readyConfig(); change(c);
    assert.equal(checkoutFor(BOOKS[0], "pdf", c, context).available, false);
  }
  const c = readyConfig(); c.payments.print.shippingReadySkus = [];
  assert.equal(checkoutFor(BOOKS[0], "print", c, context).url, null);
});

test("tampered destinations, mismatched prices and unverified Stripe references cannot open checkout", () => {
  const changes = [
    { url: "https://buy.stripe.com.evil.example/test_x" },
    { url: "https://evil.example/redirect?to=https://buy.stripe.com/test_x" },
    { url: "https://buy.stripe.com/test_x?prefilled_email=another@example.com" },
    { url: "https://name:password@buy.stripe.com/test_x" },
    { url: "javascript:alert(1)" },
    { url: "https://buy.stripe.com/liveLink" },
    { amountCents: 4700 }, { currency: "eur" }, { sku: BOOKS[1].formats.pdf.sku },
    { merchantVerified: false }, { environment: "live" }, { stripePriceId: "" },
  ];
  for (const change of changes) {
    const c = readyConfig();
    Object.assign(c.payments.links[BOOKS[0].formats.pdf.sku].test, change);
    const result = checkoutFor(BOOKS[0], "pdf", c, context);
    assert.equal(result.available, false, JSON.stringify(change));
    assert.equal(result.url, null);
  }
});

test("live references require both production build metadata and explicit approval", () => {
  const c = readyConfig();
  const sku = BOOKS[0].formats.pdf.sku;
  c.payments.environment = "live";
  c.payments.liveApproved = true;
  c.payments.links[sku].live = { ...c.payments.links[sku].test, environment: "live", url: "https://buy.stripe.com/LiveBook1" };
  assert.equal(checkoutFor(BOOKS[0], "pdf", c, context).available, false);
  assert.equal(checkoutFor(BOOKS[0], "pdf", c, { preview: true, environment: "live" }).available, false);
  assert.equal(checkoutFor(BOOKS[0], "pdf", c, { preview: false, environment: "live" }).available, true);
  c.payments.liveApproved = false;
  assert.equal(checkoutFor(BOOKS[0], "pdf", c, { preview: false, environment: "live" }).available, false);
});

test("bundle cannot be sold on price alone; contents and matching delivery must be confirmed", () => {
  const c = readyConfig();
  c.payments.links[BUNDLE.sku] = { test: { ...c.payments.links[BOOKS[0].formats.pdf.sku].test, sku: BUNDLE.sku, amountCents: 9700 } };
  assert.equal(bundleCheckout(c, context).available, false);
  c.payments.bundle = { contentsConfirmed: true, format: "pdf", contentsLabel: "All four PDF editions", includedSkus: BOOKS.map((book) => book.formats.pdf.sku), fulfilmentReady: true };
  assert.equal(bundleCheckout(c, context).available, true);
  c.payments.digital.privateDeliveryReady = false;
  assert.equal(bundleCheckout(c, context).url, null);
});

test("reserved BenefitPay never falls through to configured test or live Stripe checkout", () => {
  for (const environment of ["test", "live"]) {
    const c = readyConfig();
    c.payments.environment = environment;
    c.payments.liveApproved = true;
    c.payments.bundle = { contentsConfirmed: true, format: "pdf", contentsLabel: "All four PDF editions", includedSkus: BOOKS.map((book) => book.formats.pdf.sku), fulfilmentReady: true };
    c.payments.links[BUNDLE.sku] = { test: { ...c.payments.links[BOOKS[0].formats.pdf.sku].test, sku: BUNDLE.sku, amountCents: 9700, url: "https://buy.stripe.com/test_ProviderBundle" } };
    if (environment === "live") for (const references of Object.values(c.payments.links)) {
      references.live = { ...references.test, environment: "live", url: references.test.url.replace("/test_", "/") };
    }
    const mode = { preview: environment === "test", environment };
    const stripeProvider = resolveCheckoutProvider("stripe", c, mode);
    const reserved = resolveCheckoutProvider("benefitpay", c, mode);
    assert.equal(reserved.provider, "benefitpay");
    for (const book of BOOKS) for (const format of ["pdf", "print"]) {
      assert.deepEqual(stripeProvider.checkoutFor(book, format), checkoutFor(book, format, c, mode));
      assert.equal(stripeProvider.checkoutFor(book, format).available, true);
      assert.equal(reserved.checkoutFor(book, format).available, false);
      assert.equal(reserved.checkoutFor(book, format).url, null);
    }
    assert.deepEqual(stripeProvider.bundleCheckout(), bundleCheckout(c, mode));
    assert.equal(stripeProvider.bundleCheckout().available, true);
    assert.equal(reserved.bundleCheckout().available, false);
    assert.equal(reserved.bundleCheckout().url, null);
    assert.equal(reserved.bundleCheckout().reason, "benefitpay-not-implemented");
  }
});

function formConfig() {
  const c = readyConfig();
  c.forms = { apiBase: "https://api.example.test", contactReady: true, waitlistReady: true, privacyApproved: true, privacyVersion: "2026-10-23" };
  return c;
}
const form = { name: "A reader", email: "reader@example.test", subject: "Books", message: "Please tell me when ordering opens.", consent: true, website: "", startedAt: Date.now() - 5000 };

test("forms stay unavailable until a real HTTPS destination and approved privacy handling exist", async () => {
  let called = false;
  const result = await submitContact(form, integrationConfig, async () => { called = true; });
  assert.equal(result.ok, false);
  assert.equal(called, false);
  const c = formConfig(); c.forms.apiBase = "http://api.example.test";
  assert.equal(integrationAvailable("contact", c), false);
});

test("form success requires a server acceptance acknowledgement; errors never simulate delivery", async () => {
  const c = formConfig();
  for (const response of [
    new Response(JSON.stringify({ ok: true }), { status: 200 }),
    new Response(JSON.stringify({ ok: true, accepted: true }), { status: 500 }),
    new Response("not json", { status: 200 }),
    new Response(JSON.stringify({ ok: false, accepted: false }), { status: 429 }),
  ]) {
    assert.equal((await submitContact(form, c, async () => response)).ok, false);
  }
  assert.equal((await submitWaitlist(form, c, async () => { throw new Error("offline"); })).ok, false);
  let payload;
  const accepted = await submitContact(form, c, async (url, options) => {
    assert.equal(url, "https://api.example.test/contact");
    payload = JSON.parse(options.body);
    return new Response(JSON.stringify({ ok: true, accepted: true }), { status: 202 });
  });
  assert.equal(accepted.ok, true);
  assert.equal(payload.consentVersion, "2026-10-23");
  assert.equal(payload.email, form.email);
});

test("invalid consent, email and honeypot submissions do not reach the API", async () => {
  const c = formConfig();
  for (const change of [{ consent: false }, { email: "bad" }, { website: "spam" }, { message: "" }]) {
    let called = false;
    const result = await submitContact({ ...form, ...change }, c, async () => { called = true; });
    assert.equal(result.ok, false);
    assert.equal(called, false);
  }
});
