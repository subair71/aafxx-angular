import assert from 'node:assert/strict';
import { startCheckServer, launchCheckBrowser } from './browser-check-support.mjs';
import { mkdir } from 'node:fs/promises';
const server=await startCheckServer();
const browser=await launchCheckBrowser();
try {
  await mkdir('screenshots/stitch-review',{recursive:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    for(const route of ['', 'books/']) {
      await page.goto(server.origin+'/'+route,{waitUntil:'domcontentloaded'});
      await page.locator('main h1').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:`screenshots/stitch-review/${route?'books':'home'}-${width}.png`,fullPage:true});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      const images=await page.locator('img').evaluateAll(xs=>xs.filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src));
      assert.equal(overflow,false,`${route} overflows at ${width}px`);
      assert.deepEqual(images,[],`${route} has broken images`);
      assert.equal(await page.evaluate(()=>document.fonts.check('400 16px \"EB Garamond\"') && document.fonts.check('400 16px Manrope')),true);
      const covers=await page.locator('.bundle-titles img').evaluateAll(xs=>xs.map(x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y})));
      assert.equal(covers.length,4);
      assert.ok(covers.every((r,i)=>i===0||(r.x>covers[i-1].x&&Math.abs(r.y-covers[0].y)<2)),'Bundle covers must remain in one horizontal row');
      console.log(JSON.stringify({route,width,overflow,images}));
    }
  }
  await page.getByRole('button',{name:'Trend & Alignment',exact:true}).click();
  if(await page.locator('.book-card').count()!==1)throw Error('Book category filter failed');
  await page.getByRole('button',{name:'All Volumes (4)',exact:true}).click();
  if(await page.locator('.book-card').count()!==4)throw Error('Book category reset failed');
  console.log(JSON.stringify({errors,filters:'passed'}));
  if(errors.length)throw Error('Browser runtime errors');
} finally {await browser.close();await server.close();}
