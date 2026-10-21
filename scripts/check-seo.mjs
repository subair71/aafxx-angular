import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root='dist/aafxx/browser';
const preview=process.argv.includes('--preview');
const routes=['','about','books','courses','strategies','achievements','contact','faq','privacy','terms','checkout','account'];
const titles=new Set(), descriptions=new Set();
for(const route of routes) {
  const html=await readFile(`${root}/${route ? route+'/' : ''}index.html`,'utf8');
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/ )?.[1];
  assert(title && description,`Missing metadata on ${route}`);
  titles.add(title);descriptions.add(description);
  assert(!html.includes('http://localhost:4173'),`Local URL leaked on ${route}`);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  if(preview) {
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert(!html.includes('rel="canonical"'));
  } else {
    assert.match(html, /rel="canonical"/);
    assert.match(html, /application\/ld\+json/);
    assert(html.includes(process.env.SITE_ORIGIN),`Origin missing on ${route}`);
    if(['checkout','account'].includes(route)) assert.match(html,/name="robots" content="noindex,follow"/);
  }
}
assert.equal(titles.size,12);assert.equal(descriptions.size,12);
if(!preview) {
 const sitemap=await readFile(`${root}/sitemap.xml`,'utf8');
 assert.equal((sitemap.match(/<loc>/g)||[]).length,10);
 assert(!sitemap.includes('/checkout/')&&!sitemap.includes('/account/'));
}
console.log(`SEO checks passed for 12 ${preview?'preview':'indexable'} routes.`);
