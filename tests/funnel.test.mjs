import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Compile the same production modules, without introducing a browser or a test-only copy.
const directory = mkdtempSync(join(tmpdir(), "aafxx-commerce-"));
for (const name of ["catalogue", "integration-config", "commerce", "funnel-config", "funnel"]) {
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


const { amazonFor, whatsappUrl, submitLead, verifyOrder, selectedCheckout, purchaseAction } = require(join(directory, 'funnel.js'));
const { funnelConfig } = require(join(directory,'funnel-config.js'));
const readyForms = () => {const c=structuredClone(integrationConfig);Object.assign(c.forms,{apiBase:'https://api.example.test',leadsReady:true,privacyApproved:true});return c;};
const lead=()=>({name:'Reader',email:'reader@example.test',country:'',kind:'books',bookId:'all',format:'undecided',consent:true,website:'',startedAt:Date.now()-5000});
test('Amazon destinations require an explicitly verified book-specific ASIN and exact allowed HTTPS product URL',()=>{
  const c=structuredClone(funnelConfig);c.amazon[BOOKS[0].id]={url:'https://www.amazon.com/dp/B012345678',asin:'B012345678',verified:true};
  assert.equal(amazonFor(BOOKS[0],c),'https://www.amazon.com/dp/B012345678');assert.equal(amazonFor(BOOKS[1],c),null);
  for(const url of ['https://www.amazon.com.evil.test/dp/B012345678','https://www.amazon.com/dp/B999999999','javascript:alert(1)','https://user:pass@www.amazon.com/dp/B012345678','https://www.amazon.com/dp/B012345678?redirect=1']){c.amazon[BOOKS[0].id].url=url;assert.equal(amazonFor(BOOKS[0],c),null);}
  c.amazon[BOOKS[0].id].url='https://www.amazon.com/dp/B012345678';c.amazon[BOOKS[0].id].verified=false;assert.equal(amazonFor(BOOKS[0],c),null);
});
test('WhatsApp accepts only an approved number or exact wa.me path without altering the supplied WhatsApp destination',()=>{
  assert.equal(whatsappUrl('+97312345678'),'https://wa.me/97312345678');assert.equal(whatsappUrl(''),null);
  assert.equal(whatsappUrl('https://wa.me/97312345678'),whatsappUrl('+97312345678'));
  for(const value of ['https://evil.test/97312345678','https://wa.me/97312345678?text=other','123','+0123456789'])assert.equal(whatsappUrl(value),null);
});
test('launch registration requires durable backend acknowledgement; unavailable, invalid and failed submissions cannot succeed',async()=>{
  let calls=0;const fetcher=async()=>{calls++;return new Response(JSON.stringify({ok:true,accepted:true}),{status:202});};
  assert.equal((await submitLead(lead(),integrationConfig,fetcher)).ok,false);assert.equal(calls,0);
  const c=readyForms();assert.equal((await submitLead({...lead(),consent:false},c,fetcher)).ok,false);assert.equal(calls,0);
  assert.equal((await submitLead(lead(),c,fetcher)).ok,true);
  assert.equal((await submitLead(lead(),c,async()=>new Response(JSON.stringify({ok:true}),{status:200}))).ok,false);
  assert.equal((await submitLead(lead(),c,async()=>new Response('{}',{status:503}))).ok,false);
});
test('browser order verification cannot infer success from parameters and rejects unsafe download URLs',async()=>{
  const c=readyForms();c.payments.verifiedPaymentWorkflowReady=true;c.payments.digital.privateDeliveryReady=true;
  const response=(result)=>async()=>new Response(JSON.stringify(result),{status:200});
  assert.equal(await verifyOrder('cs_test_x','reader@example.test',c,response({ok:true,status:'pending'})),null);
  const order={title:BOOKS[0].title,sku:BOOKS[0].formats.pdf.sku,format:'pdf',amountTotal:2700,currency:'usd',transactionId:'a'.repeat(64),files:[{name:'book.pdf',url:'https://api.example.test/download?token=signed'}]};
  assert.equal((await verifyOrder('cs_test_x','reader@example.test',c,response({ok:true,status:'paid',order}))).amountTotal,2700);
  for(const url of ['javascript:alert(1)','https://other.test/download?token=stolen','https://api.example.test/other?token=x']){const bad=structuredClone(order);bad.files[0].url=url;await assert.rejects(verifyOrder('cs_test_x','reader@example.test',c,response({ok:true,status:'paid',order:bad})));}
  await assert.rejects(verifyOrder('cs_test_x','reader@example.test',integrationConfig,response({ok:true,status:'paid',order})));
});
test('unconfigured and unknown checkout selections never supply a functioning payment URL',()=>{
  assert.equal(selectedCheckout('made-up'),null);assert.equal(selectedCheckout(BOOKS[0].formats.print.sku).state.available,false);
  assert.equal(selectedCheckout(BOOKS[0].formats.print.sku).price,47);
  assert.equal(selectedCheckout(BOOKS[0].formats.pdf.sku).state.available,false);assert.equal(selectedCheckout(BUNDLE.sku).state.url,null);
});

// Both formats now use the same Stripe review flow; paperback must not fall
// through to an old Amazon promotion or accidentally buy the PDF edition.
test('all eight PDF and print buttons resolve the selected Stripe SKU, amount and edition',()=>{
  const c=structuredClone(integrationConfig);
  Object.assign(c.payments,{provider:"stripe",policiesApproved:true,verifiedPaymentWorkflowReady:true});
  c.payments.digital.privateDeliveryReady=true;c.payments.print.fulfilmentReady=true;
  for(const book of BOOKS) for(const format of ['pdf','print']){
    const v=book.formats[format];
    c.payments.links[v.sku]={test:{url:`https://buy.stripe.com/test_Book${book.number}${format}`,sku:v.sku,environment:'test',stripeProductId:`prod_Book${book.number}${format}`,stripePriceId:`price_Book${book.number}${format}`,amountCents:v.price*100,currency:'usd',merchantVerified:true}};
    c.payments.digital.contentReadySkus.push(v.sku);c.payments.print.shippingReadySkus.push(v.sku);
    const a=purchaseAction(book,format,'/aafxx-angular/',c,context);
    assert.equal(a.available,true);assert.equal(a.external,false);
    assert.equal(a.href,`/aafxx-angular/checkout/?sku=${v.sku}`);
    assert.equal(a.label,`Buy ${format==='pdf'?'PDF':'Print'} — $${v.price}`);
    const selected=selectedCheckout(v.sku,c,context);
    assert.equal(selected.price,v.price);assert.equal(selected.title,book.title);
    assert.equal(selected.format,format==='pdf'?'eBook (PDF)':'Print');
    assert.equal(selected.state.url,c.payments.links[v.sku].test.url);
  }
});
test('blocked PayPal purchases lead to an honest order review for each format',()=>{
  for(const book of BOOKS) for(const format of ['pdf','print']){
    const a=purchaseAction(book,format,'/');
    assert.equal(a.available,false);
    assert.equal(a.href,`/checkout/?sku=${book.formats[format].sku}`);
    assert.doesNotMatch(a.label,/Amazon|Pre-Order/);
  }
});

test('PayPal never advertises instant delivery or permits a purchase before destination, USD and fulfilment verification',()=>{
  const c=structuredClone(integrationConfig);
  assert.equal(whatsappUrl(), 'https://wa.me/97334352786');
  assert.equal(checkoutFor(BOOKS[0],'pdf',c).reason,'paypal-profile-unavailable');
  assert.doesNotMatch(purchaseAction(BOOKS[0],'pdf','/',c).label,/Instant Download/);
  Object.assign(c.payments.paypal,{destinationVerified:true,usdVerified:true,paymentVerificationReady:true,digitalDeliveryReady:true,shippingCaptureReady:true,bundleDeliveryReady:true});
  for(const book of BOOKS)for(const format of ['pdf','print']){
    const a=purchaseAction(book,format,'/',c);
    assert.equal(a.available,true);assert.equal(a.external,true);
    assert.equal(a.href,`https://www.paypal.com/paypalme/AAFXMLSOLUTI/${format==='pdf'?27:47}`);
    assert.equal(a.label,format==='pdf'?'Buy PDF - $27 USD (Instant Download)':'Buy Paperback - $47 USD');
  }
  assert.equal(bundleCheckout(c).url,'https://www.paypal.com/paypalme/AAFXMLSOLUTI/97');
  for(const key of ['destinationVerified','usdVerified','paymentVerificationReady','digitalDeliveryReady','shippingCaptureReady','bundleDeliveryReady']){
    c.payments.paypal[key]=false;
    assert.equal(bundleCheckout(c).available,false,key);
    c.payments.paypal[key]=true;
  }
  c.payments.paypal.links.pdf='https://www.paypal.com.evil.test/paypalme/AAFXMLSOLUTI/27';
  assert.equal(checkoutFor(BOOKS[0],'pdf',c).available,false);
});
test('checklist UI requires server confirmation that the admin email was accepted',async()=>{
  const c=readyForms();const data={...lead(),kind:'checklist'};
  const response=(result)=>async()=>new Response(JSON.stringify(result),{status:202});
  assert.equal((await submitLead(data,c,response({ok:true,accepted:true}))).ok,false);
  assert.equal((await submitLead(data,c,response({ok:true,accepted:true,notification:'queued'}))).ok,true);
});
