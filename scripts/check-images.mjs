// Reproduce the deployed SPA rewrite that returns HTML for .webp/.jpeg requests.
// Check both <img> covers and the founder portrait rendered as a CSS background.
import assert from 'node:assert/strict';
import { bookSlugs } from './routes.mjs';
import { startCheckServer, launchCheckBrowser } from './browser-check-support.mjs';

const server = await startCheckServer();
let browser;
try {
  browser = await launchCheckBrowser();
  const page = await browser.newPage();
  await page.route(/\.(webp|jpeg)(?:\?.*)?$/, route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>SPA fallback</title>',
  }));
  let checkedPages = 0;
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'books', ...bookSlugs.map(slug => 'books/' + slug), 'about', 'about-author']) {
      await page.goto(server.origin + server.config.base + (route ? route + '/' : ''));
      await page.locator('main h1').waitFor();
      const failures = await page.evaluate(async () => {
        const images = Array.from(document.images);
        for (const element of document.querySelectorAll('[role="img"]')) {
          const source = getComputedStyle(element).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
          if (source) { const image = new Image(); image.src = source; images.push(image); }
        }
        return (await Promise.all(images.map(async image => {
          image.loading = 'eager';
          try { await image.decode(); return null; }
          catch { return image.currentSrc || image.src; }
        }))).filter(Boolean);
      });
      assert.deepEqual(failures, [], `Broken images on ${route || 'home'} at ${width}px`);
      checkedPages++;
    }
  }
  console.log(`Image checks passed on ${checkedPages} desktop/mobile pages with the deployed extension rewrite reproduced.`);
} finally {
  await browser?.close();
  await server.close();
}
