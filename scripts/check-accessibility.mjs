import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import assert from "node:assert/strict";
import { routes, privateRoutes } from "./routes.mjs";
const root = "dist/aafxx/browser",
  base = process.env.SITE_BASE || "/aafxx-angular/";
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split("?")[0]).slice(base.length);
  if (!extname(path)) path += "index.html";
  const file = resolve(root, path);
  if (!file.startsWith(resolve(root) + "/")) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      {
        ".js": "text/javascript",
        ".css": "text/css",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".html": "text/html",
      }[extname(file)] || "text/plain",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(await readFile(join(root, "404.html")));
  }
}).listen(4174);
import AxeBuilder from "@axe-core/playwright";
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? {
          executablePath: process.env.CHROME_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : {}),
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const reports = [];
  for (const theme of ["dark", "light"]) {
    await page.goto("http://localhost:4174" + base);
    await page.evaluate((t) => localStorage.setItem("aafxx-theme", t), theme);
    for (const route of [
      "",
      "books/",
      "courses/",
      "books/trading-with-discipline/",
      "resources/forex-basics/",
      "webinars/",
      "contact/",
      "account/",
    ]) {
      await page.goto("http://localhost:4174" + base + route);
      await page.locator("main h1").waitFor();
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      reports.push({
        theme,
        route: route || "home",
        violations: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  }
  await mkdir("screenshots", { recursive: true });
  await writeFile(
    "screenshots/accessibility.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(
    JSON.stringify(
      reports.filter((r) => r.violations.length),
      null,
      2,
    ),
  );
  assert(
    reports.every((r) => !r.violations.length),
    "Accessibility violations found",
  );
  console.log(
    "Automated accessibility checks passed on 8 pages in both themes.",
  );
} finally {
  await browser?.close();
  server.close();
}
