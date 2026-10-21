import chromium from '@sparticuz/chromium';
process.env.SITE_BASE = '/';
// Set SITE_ORIGIN to the branch's exact https://...amplifyapp.com URL in Amplify.
if (!process.env.SITE_ORIGIN) {
  throw new Error('Set SITE_ORIGIN to this Amplify branch URL before deploying.');
}
const origin = new URL(process.env.SITE_ORIGIN);
if (origin.protocol !== 'https:' || origin.pathname !== '/') {
  throw new Error('SITE_ORIGIN must be an HTTPS origin without a path.');
}
process.env.SITE_ORIGIN = origin.origin;
process.env.CHROME_PATH ||= await chromium.executablePath();
await import('./prerender.mjs');
