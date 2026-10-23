import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { allRoutes, publicRoutes, redirects } from "./routes.mjs";
import { configureBuild } from "./configure-build.mjs";

const root = "dist/aafxx/browser";
const config = await configureBuild(root);
const { base, preview, origin } = config;
const index = await readFile(join(root, "index.html"));
const mime = { ".js": "text/javascript", ".css": "text/css", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".html": "text/html", ".json": "application/json", ".woff2": "font/woff2" };
// Ephemeral build-only server. Never competes with the supervised visual preview.
const server = createServer(async (req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400).end(); return; }
  if (!path.startsWith(base)) { res.writeHead(404).end(); return; }
  const relative = path.slice(base.length);
  const file = resolve(root, relative || "index.html");
  if (!file.startsWith(resolve(root) + "/")) { res.writeHead(403).end(); return; }
  try {
    // Always bootstrap each route from the fresh entrypoint, not a previous prerender.
    if (!extname(relative)) throw new Error("route");
    const content = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }).end(content);
  } catch {
    if (extname(relative)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": "text/html" }).end(index);
  }
});
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
const address = server.address();
const localOrigin = `http://127.0.0.1:${address.port}`;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: JSON.parse(process.env.CHROME_ARGS || '["--no-sandbox","--disable-dev-shm-usage"]') } : {}),
  });
  const context = await browser.newContext();
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
  for (const route of allRoutes) {
    await page.goto(localOrigin + base + (route ? route + "/" : ""), { waitUntil: "networkidle" });
    await page.waitForSelector("app-root h1", {state: "attached"});
    await page.waitForFunction(() => Boolean(document.querySelector("app-root h1")?.textContent?.trim()));
    await page.evaluate(() => window.dispatchEvent(new Event("seo-origin")));
    const count = await page.locator("h1").count();
    if (count !== 1) throw new Error(`Expected one heading on ${route || "home"}, got ${count}.`);
    const actualPath = new URL(page.url()).pathname;
    const expectedPath = base + ((redirects[route] ?? route) ? (redirects[route] ?? route) + "/" : "");
    if (actualPath !== expectedPath) throw new Error(`Wrong canonical navigation for ${route}: ${actualPath}; expected ${expectedPath}`);
    let html = (await page.content()).replace(/ ng-version="[^"]*"/g, "");
    if (html.includes(localOrigin)) throw new Error(`Build origin leaked into ${route || "home"}.`);
    const dir = join(root, route);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), html);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  await writeFile(join(root, "404.html"), await readFile(join(root, "404/index.html")));
  const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  if (preview) await rm(join(root, "sitemap.xml"), { force: true });
  else await writeFile(join(root, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + publicRoutes.map((route) => `  <url><loc>${escapeXml(origin + base + (route ? route + "/" : ""))}</loc></url>`).join("\n") + "\n</urlset>\n");
  // Allow crawling so search engines can read noindex. Do not block its discovery with Disallow: /.
  await writeFile(join(root, "robots.txt"), "User-agent: *\nAllow: /\n" + (preview ? "# Development environment: every HTML page carries noindex.\n" : `Sitemap: ${origin + base}sitemap.xml\n`));
  await writeFile(join(root, "prerender-report.json"), JSON.stringify({ ...config, canonicalRoutes: publicRoutes.length, renderedRoutes: allRoutes.length, redirects }, null, 2) + "\n");
  console.log(`Prerendered ${allRoutes.length} routes (${preview ? "noindex development" : origin + base}).`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
