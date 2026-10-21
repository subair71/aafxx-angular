import chromium from '@sparticuz/chromium';
process.env.SITE_BASE = '/';
if (process.env.SITE_ORIGIN) {
  const origin = new URL(process.env.SITE_ORIGIN);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
    throw new Error('SITE_ORIGIN must be an HTTPS origin without a path, query, credentials or fragment.');
  }
  process.env.SITE_ORIGIN = origin.origin;
} else {
  // Never invent a branch hostname or publish another site's canonical URLs.
  console.warn('SITE_ORIGIN is unset: building a noindex preview. Set the exact public HTTPS origin to enable canonical URLs and sitemap generation.');
  process.env.SITE_PREVIEW = 'true';
}
process.env.CHROME_PATH ||= await chromium.executablePath();
process.env.CHROME_ARGS ||= JSON.stringify(chromium.args);
await import('./prerender.mjs');
