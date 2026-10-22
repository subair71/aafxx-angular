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
let browser;
const result = { checks: [], responsivePages: 0, labMetrics: [], errors: [] };
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
  const page = await browser.newPage();
  page.on("pageerror", (e) => result.errors.push(e.message));
  const goto = async (route) => {
    await page.goto("http://localhost:4174" + base + route);
    await page.locator("main h1").waitFor();
  };
  await goto("");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  result.checks.push("Dark default and persistent light/dark preference");
  await goto("books/");
  await page.getByLabel("Search books").fill("discipline");
  assert.equal(await page.locator(".book-card").count(), 1);
  await page.getByLabel("Search books").fill("not-in-catalogue");
  await page.getByRole("heading", { name: "No matching books" }).waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByLabel("Topic", { exact: true })
    .selectOption("Technical Analysis");
  assert.equal(await page.locator(".book-card").count(), 1);
  await page.getByRole("link", { name: "Explore book", exact: false }).click();
  assert.match(page.url(), /books\/the-5-minute-chart\/$/);
  await page.reload();
  await page
    .getByRole("heading", { name: "The 5-Minute Chart", exact: true })
    .waitFor();
  await page.getByRole("link", { name: "Enquire About This Book" }).click();
  assert.equal(
    await page.getByLabel("Enquiry about").inputValue(),
    "The 5-Minute Chart",
  );
  await page.reload();
  assert.equal(
    await page.getByLabel("Enquiry about").inputValue(),
    "The 5-Minute Chart",
  );
  assert(
    await page
      .getByRole("button", { name: "Copy enquiry", exact: true })
      .isDisabled(),
  );
  await page.getByLabel("Your name").fill("Review User");
  await page.getByLabel("Email address").fill("invalid");
  await page
    .getByLabel("Your message")
    .fill("Please confirm publication and availability.");
  assert(
    await page
      .getByRole("button", { name: "Copy enquiry", exact: true })
      .isDisabled(),
  );
  await page.getByLabel("Email address").fill("review@example.com");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy enquiry", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Enquiry copied" })
    .waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /The 5-Minute Chart/);
  assert.match(copied, /Please confirm publication/);
  assert.match(
    await page.locator(".form-status").innerText(),
    /Nothing has been sent/,
  );
  // Permission failure must offer a real alternative, never claim delivery.
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("denied");
    };
  });
  await page.getByRole("button", { name: "Copy enquiry", exact: true }).click();
  await page.getByText("Copy was unavailable.", { exact: false }).waitFor();
  const enquiryDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download enquiry", exact: true })
    .click();
  const enquiryFile = await enquiryDownload;
  assert.equal(enquiryFile.suggestedFilename(), "aafxx-enquiry.txt");
  assert.match(
    await readFile(await enquiryFile.path(), "utf8"),
    /The 5-Minute Chart/,
  );
  result.checks.push(
    "Book search/topic filtering, deep links, persistent enquiry subject, validation, real clipboard copy, denied clipboard fallback and draft download",
  );
  await goto("courses/");
  await page.getByLabel("Level", { exact: true }).selectOption("Advanced");
  assert.equal(await page.locator(".course-card").count(), 1);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Learning format").selectOption("Live online");
  await page.getByRole("heading", { name: "No matching courses" }).waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .locator(".course-card")
    .first()
    .getByRole("link", { name: "Explore learning path" })
    .click();
  await page.getByRole("link", { name: "Enquire About This Course" }).click();
  assert.equal(
    await page.getByLabel("Enquiry about").inputValue(),
    "Forex Foundations",
  );
  await goto("academy/");
  assert.match(
    await page.locator("link[rel=canonical]").getAttribute("href"),
    /courses\/$/,
  );
  await goto("resources/");
  await page.getByLabel("Search resources").fill("risk");
  assert.equal(await page.locator(".resource-card").count(), 2);
  await goto("resources/forex-basics/");
  await page.getByLabel("USD", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("status").filter({ hasText: "Try again." }).waitFor();
  await page.getByLabel("EUR", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("status").filter({ hasText: "Correct." }).waitFor();
  const journalDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download practice journal" }).click();
  assert.equal(
    (await journalDownload).suggestedFilename(),
    "aafxx-practice-journal.csv",
  );
  result.checks.push(
    "Course level/format filters, contextual course enquiries, academy aliases, resource search, quiz feedback and CSV download",
  );
  await goto("a-page-that-does-not-exist/");
  await page.getByText("404 / PAGE NOT FOUND", { exact: true }).waitFor();
  assert.match(
    await page.locator("meta[name=robots]").getAttribute("content"),
    /noindex/,
  );
  result.checks.push("Unknown route renders noindex 404");
  await mkdir("screenshots", { recursive: true });
  const internalLinks = new Set();
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("aafxx-theme", t), theme);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await goto(route ? route + "/" : "");
        assert.equal(await page.locator("h1").count(), 1, route);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `Overflow: ${route} ${width}`,
        );
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          theme,
        );
        await page.evaluate(async () => {
          await Promise.all(
            Array.from(document.images).map((img) => {
              img.loading = "eager";
              return img.decode();
            }),
          );
        });
        if (privateRoutes.includes(route))
          assert.match(
            await page.locator("meta[name=robots]").getAttribute("content"),
            /noindex/,
          );
        const links = await page
          .locator("a[href]")
          .evaluateAll((nodes) => nodes.map((n) => n.href));
        for (const link of links)
          if (link.startsWith("http://localhost:4174"))
            internalLinks.add(link.split("#")[0]);
        assert.equal(
          await page
            .getByRole("button", { name: /sandbox|cart|portal/i })
            .count(),
          0,
        );
        result.responsivePages++;
        if (
          [390, 1440].includes(width) &&
          [
            "",
            "books",
            "courses",
            "resources/forex-basics",
            "books/trading-with-discipline",
          ].includes(route)
        )
          await page.screenshot({
            path: `screenshots/${route.replaceAll("/", "-") || "home"}-${theme}-${width}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await goto("");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").innerText(), "Skip to content");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .locator("#primary-navigation")
    .getByRole("link", { name: "Academy", exact: true })
    .click();
  assert.match(page.url(), /courses\/$/);
  result.checks.push(
    "Keyboard skip link, mobile navigation, all routes in both themes at 320/390/768/1440",
  );
  // Local lab observations, not field Core Web Vitals or a Lighthouse score.
  await page.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__metrics.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  for (const route of ["", "books/", "resources/forex-basics/"]) {
    await goto(route);
    await page.waitForTimeout(600);
    result.labMetrics.push({
      route: route || "home",
      viewport: 390,
      ...(await page.evaluate(() => window.__metrics)),
    });
  }
  for (const url of internalLinks) {
    const response = await page.request.get(url);
    assert(
      response.ok(),
      `Broken internal link: ${url} (${response.status()})`,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goto("");
  assert.equal(
    await page
      .locator(".hero-copy")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  result.checks.push(
    `Verified ${internalLinks.size} internal links; reduced motion disables animation`,
  );
  assert.deepEqual(result.errors, []);
  await writeFile(
    "screenshots/validation.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  server.close();
}
