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
  await page.getByLabel("Find a resource").fill("discipline");
  assert.equal(
    await page.locator(".catalogue-section .cards article").count(),
    1,
  );
  await page.getByLabel("Find a resource").fill("not-in-catalogue");
  await page.getByRole("heading", { name: "No matching resources" }).waitFor();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByLabel("Format", { exact: true }).selectOption("Print");
  assert.equal(
    await page.locator(".catalogue-section .cards article").count(),
    0,
  );
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByLabel("Maximum preview price").fill("20");
  assert.equal(
    await page.locator(".catalogue-section .cards article").count(),
    1,
  );
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Sort by").selectOption("price-low");
  assert.match(
    await page.locator(".catalogue-section .cards article").first().innerText(),
    /Trading With Discipline/,
  );
  await page.getByRole("button", { name: "View book details" }).first().click();
  assert.match(page.url(), /books\/trading-with-discipline\/$/);
  await page.reload();
  await page
    .getByRole("heading", { name: "Trading With Discipline", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Add to sandbox cart", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Shopping cart" }).waitFor();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("heading", { name: "Total: $38" }).waitFor();
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.reload();
  await page.getByRole("button", { name: "Open cart, 1 items" }).click();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  assert(
    await page
      .getByRole("button", { name: "Continue to payment" })
      .isDisabled(),
  );
  await page.getByLabel("Full name").fill("Review User");
  await page.getByLabel("Email for access").fill("invalid");
  await page.getByLabel("Country / region").selectOption("India");
  assert(
    await page
      .getByRole("button", { name: "Continue to payment" })
      .isDisabled(),
  );
  await page.getByLabel("Email for access").fill("review@example.com");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: "Review order" }).click();
  assert(
    await page
      .getByRole("button", { name: "Run sandbox payment" })
      .isDisabled(),
  );
  await page.locator("input[type=checkbox]").check();
  for (const outcome of ["failed", "canceled", "success"]) {
    await page.getByLabel("Sandbox result").selectOption(outcome);
    await page.getByRole("button", { name: "Run sandbox payment" }).click();
    if (outcome === "failed")
      await page.getByText("Demo payment failed.", { exact: false }).waitFor();
    else if (outcome === "canceled")
      await page
        .getByText("Demo payment canceled.", { exact: false })
        .waitFor();
    else
      await page
        .getByText("SANDBOX PAYMENT COMPLETE", { exact: true })
        .waitFor();
  }
  assert.equal(await page.locator("input[type=password]").count(), 0);
  await page
    .getByRole("button", { name: "Open learning workspace", exact: true })
    .click();
  await page
    .getByText("Demo access only. No purchase was made.", { exact: true })
    .waitFor();
  result.checks.push(
    "Book discovery, unavailable variants, price filter, sort, deep links, persistent cart, quantity totals, checkout validation, failed/canceled/success sandbox and no paid unlock",
  );
  await goto("courses/");
  await page.getByLabel("Level", { exact: true }).selectOption("Advanced");
  assert.equal(
    await page.locator(".catalogue-section .cards article").count(),
    1,
  );
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("button", { name: "Compare course", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Compare course", exact: true })
    .first()
    .click();
  assert.equal(await page.locator("tbody tr").count(), 2);
  result.checks.push("Course level filtering and comparison");
  await goto("resources/forex-basics/");
  await page.getByLabel("USD", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  assert(
    await page
      .getByRole("button", { name: "Mark lesson complete" })
      .isDisabled(),
  );
  await page.getByLabel("EUR", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await page.getByLabel("Your study notes").fill("Review the base currency.");
  await page.reload();
  assert.equal(
    await page.getByLabel("Your study notes").inputValue(),
    "Review the base currency.",
  );
  await page.getByRole("button", { name: "Completed ✓" }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download practice journal" }).click();
  assert.equal(
    (await downloadPromise).suggestedFilename(),
    "aafxx-practice-journal.csv",
  );
  result.checks.push(
    "Quiz correctness, completion, persistent notes and journal download",
  );
  await goto("a-page-that-does-not-exist/");
  await page.getByText("404 / PAGE NOT FOUND", { exact: true }).waitFor();
  assert.match(
    await page.locator("meta[name=robots]").getAttribute("content"),
    /noindex/,
  );
  result.checks.push("Unknown route renders noindex 404");
  await mkdir("screenshots", { recursive: true });
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
