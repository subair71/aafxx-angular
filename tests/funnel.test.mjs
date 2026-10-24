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


const { amazonFor, whatsappUrl, submitLead, verifyOrder, selectedCheckout } = require(join(directory, 'funnel.js'));
const { funnelConfig } = require(join(directory,'funnel-config.js'));
const readyForms = () => {const c=structuredClone(integrationConfig);Object.assign(c.forms,{apiBase:'https://api.example.test',leadsReady:true,privacyApproved:true});return c;};
const lead=()=>({name:'Reader',email:'reader@example.test',country:'',kind:'books',bookId:'all',format:'undecided',consent:true,website:'',startedAt:Date.now()-5000});
test('Amazon destinations require an explicitly verified book-specific ASIN and exact allowed HTTPS product URL',()=>{
  const c=structuredClone(funnelConfig);c.amazon[BOOKS[0].id]={url:'https://www.amazon.com/dp/B012345678',asin:'B012345678',verified:true};
  assert.equal(amazonFor(BOOKS[0],c),'https://www.amazon.com/dp/B012345678');assert.equal(amazonFor(BOOKS[1],c),null);
  for(const url of ['https://www.amazon.com.evil.test/dp/B012345678','https://www.amazon.com/dp/B999999999','javascript:alert(1)','https://user:pass@www.amazon.com/dp/B012345678','https://www.amazon.com/dp/B012345678?redirect=1']){c.amazon[BOOKS[0].id].url=url;assert.equal(amazonFor(BOOKS[0],c),null);}
  c.amazon[BOOKS[0].id].url='https://www.amazon.com/dp/B012345678';c.amazon[BOOKS[0].id].verified=false;assert.equal(amazonFor(BOOKS[0],c),null);
});
test('WhatsApp accepts only an approved number or exact wa.me path and adds a mentorship message',()=>{
  assert.match(whatsappUrl('+97312345678'),/^https:\/\/wa\.me\/97312345678\?text=/);assert.equal(whatsappUrl(''),null);
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
  assert.equal(selectedCheckout('made-up'),null);assert.equal(selectedCheckout(BOOKS[0].formats.print.sku),null);
  assert.equal(selectedCheckout(BOOKS[0].formats.pdf.sku).state.available,false);assert.equal(selectedCheckout(BUNDLE.sku).state.url,null);
});
