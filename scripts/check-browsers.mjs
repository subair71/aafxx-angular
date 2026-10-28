// Cross-engine smoke checks; iPhone WebKit emulation is not a physical-device test.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit, devices } from 'playwright';
import { startCheckServer } from './browser-check-support.mjs';
const server = await startCheckServer();
const reports=[];
const scenarios=[
  {name:'Chromium desktop',engine:chromium,launch:{},context:{viewport:{width:1440,height:900}}},
  {name:'Firefox desktop',engine:firefox,launch:{},context:{viewport:{width:1366,height:900}}},
  {name:'Microsoft Edge desktop',engine:chromium,launch:{channel:'msedge'},context:{viewport:{width:1366,height:900}}},
  {name:'WebKit iPhone 13 emulation',engine:webkit,launch:{},context:{...devices['iPhone 13']}},
  {name:'WebKit tablet',engine:webkit,launch:{},context:{viewport:{width:768,height:1024},hasTouch:true}},
];
try{
  for(const scenario of scenarios){
    const browser=await scenario.engine.launch({headless:true,...scenario.launch});
    try{
      const context=await browser.newContext(scenario.context);const page=await context.newPage();const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const goto=async(route='')=>{await page.goto(server.origin+server.config.base+route);await page.locator('main h1').waitFor();};
      await goto('books/');
      assert.equal(await page.locator('.book-card').count(),4);
      const first=page.locator('.book-card').first();
      await first.getByRole('button',{name:'Paperback',exact:true}).click();
      assert.match(await first.locator('.book-price').innerText(),/47/);
      await first.getByRole('link',{name:'Review purchase details',exact:true}).click();
      assert.match(page.url(),/checkout\/\?sku=aafxx-book-1-print/);
      assert.match(await page.locator('main').innerText(),/PayPal payment page could not be verified/);
      await goto('launch-notifications/');
      await page.getByLabel('Full Name',{exact:true}).fill('QA Reader');
      await page.getByLabel('Email Address',{exact:true}).fill('qa@example.test');
      await page.locator('app-lead-form input[type="checkbox"]').check();
      assert(await page.getByRole('button',{name:'Register for Launch Notifications',exact:true}).isDisabled());
      await goto('books/');await page.getByRole('link',{name:'Review bundle details',exact:true}).click();
      assert.match(page.url(),/checkout\/\?sku=aafxx-four-book-bundle/);
      for(const route of ['','books/','launch-notifications/','mentorship/','about-author/','checklist/','privacy-policy/','terms/','refund-policy/','risk-disclaimer/','registration-confirmed/','checkout/success/?session_id=cs_test_forged&paid=true','checkout/cancel/']){
        await goto(route);
        assert.equal(await page.locator('main h1').count(),1,scenario.name+' '+route);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow: '+scenario.name+' '+route);
        assert.equal(await page.locator('a[href*="/download?token="]').count(),0);
        if(route.startsWith('checkout/success')){assert.match(await page.locator('main').innerText(),/No purchase is confirmed/);assert.equal(await page.getByRole('heading',{name:'Thank You for Joining the AAFXX Learning Community!'}).count(),0);}
        if(route==='registration-confirmed/')assert.match(await page.locator('main').innerText(),/No registration is confirmed/);
      }
      assert.deepEqual(errors,[],scenario.name);
      reports.push({browser:scenario.name,status:'passed',routes:13,checks:['paperback selection','selected book and format','bundle selection','disabled unconfigured submissions','no false purchase/registration','no overflow','no application errors']});
      console.log(scenario.name+': passed');
    }finally{await browser.close();}
  }
  await mkdir('screenshots',{recursive:true});await writeFile('screenshots/cross-browser.json',JSON.stringify(reports,null,2));
}finally{await server.close();}
