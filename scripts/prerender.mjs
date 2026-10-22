import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
const root = "dist/aafxx/browser";
const base = process.env.SITE_BASE || "/aafxx-angular/";
const preview = process.env.SITE_PREVIEW === "true";
const origin = process.env.SITE_ORIGIN || "https://subair71.github.io";
import { routes, privateRoutes, aliasRoutes } from "./routes.mjs";
const index = await readFile(join(root, "index.html"));
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".html": "text/html",
};
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]).replace(base, "");
  const file = resolve(root, path || "index.html");
  if (!file.startsWith(resolve(root) + "/")) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    res.setHeader("Content-Type", types[extname(path)] || "text/html");
    res.end(await readFile(file));
  } catch {
    res.setHeader("Content-Type", "text/html");
    res.end(index);
  }
}).listen(4173);
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? {
          executablePath: process.env.CHROME_PATH,
          args: JSON.parse(
            process.env.CHROME_ARGS ||
              '["--no-sandbox","--disable-dev-shm-usage"]',
          ),
        }
      : {}),
  });
  const context = await browser.newContext();
  for (const route of [...routes, ...aliasRoutes]) {
    const page = await context.newPage();
    await page.goto(
      "http://localhost:4173" + base + (route ? route + "/" : ""),
    );
    await page.waitForSelector("app-root h1");
    await page.evaluate(
      ({ origin, preview }) => {
        for (const [name, content] of [
          ["site-origin", origin],
          ["site-preview", String(preview)],
        ]) {
          let meta = document.querySelector(`meta[name="${name}"]`);
          if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", name);
            document.head.append(meta);
          }
          meta.setAttribute("content", content);
        }
        window.dispatchEvent(new Event("seo-origin"));
        // Initial HTML must not contain a guessed canonical domain for a preview.
        if (preview) {
          document.querySelector('meta[name="site-origin"]')?.remove();
          document.querySelector('link[rel="canonical"]')?.remove();
          document
            .querySelectorAll(
              'meta[property="og:url"],meta[property="og:image"],meta[name="twitter:image"],script[type="application/ld+json"]',
            )
            .forEach((el) => el.remove());
        }
      },
      { origin, preview },
    );
    const html = (await page.content()).replace(/ ng-version="[^"]*"/g, "");
    const dir = join(root, route);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), html);
    await page.close();
  }
  await writeFile(
    join(root, "404.html"),
    await readFile(join(root, "404/index.html")),
  );
  if (!preview) {
    await writeFile(
      join(root, "sitemap.xml"),
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        routes
          .filter((r) => !privateRoutes.includes(r))
          .map(
            (r) =>
              "<url><loc>" +
              origin +
              base +
              (r ? r + "/" : "") +
              "</loc></url>",
          )
          .join("") +
        "</urlset>",
    );
  } else {
    await rm(join(root, "sitemap.xml"), { force: true });
  }
  await writeFile(
    join(root, "robots.txt"),
    "User-agent: *\nAllow: /\n" +
      (!preview ? "Sitemap: " + origin + base + "sitemap.xml\n" : ""),
  );
  console.log(
    `Prerendered ${routes.length} routes (${preview ? "noindex preview" : origin + base}).`,
  );
} finally {
  await browser?.close();
  server.close();
}
