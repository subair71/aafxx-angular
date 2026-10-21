import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import assert from "node:assert/strict";
const root = "dist/aafxx/browser",
  base = process.env.SITE_BASE || "/aafxx-angular/";
const server = createServer(async (req, res) => {
  let path = req.url.split("?")[0].replace(base, "");
  if (!extname(path)) path += "index.html";
  try {
    res.setHeader(
      "Content-Type",
      {
        ".js": "text/javascript",
        ".css": "text/css",
        ".jpeg": "image/jpeg",
        ".html": "text/html",
      }[extname(path)] || "text/html",
    );
    res.end(await readFile(join(root, path)));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(4174);
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
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4174" + base + "books/");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  assert(
    await page
      .getByRole("button", { name: "Continue to payment" })
      .isDisabled(),
  );
  await page.getByLabel("Full name").fill("Client Review");
  await page.getByLabel("Email for access").fill("review@example.com");
  await page.getByLabel("Country / region").selectOption("Nigeria");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: "Review order" }).click();
  assert(
    await page
      .getByRole("button", { name: "Create order summary" })
      .isDisabled(),
  );
  await page.locator("input[type=checkbox]").check();
  await page.getByRole("button", { name: "Create order summary" }).click();
  await page.getByText("Payment pending", { exact: false }).waitFor();
  assert.equal(await page.locator("input[type=password]").count(), 0);
  await mkdir("screenshots", { recursive: true });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => localStorage.setItem("aafxx-theme", t), theme);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "",
        "about/",
        "books/",
        "courses/",
        "strategies/",
        "achievements/",
        "faq/",
        "contact/",
        "checkout/",
        "account/",
        "privacy/",
        "terms/",
      ]) {
        await page.goto("http://localhost:4174" + base + route);
        await page.waitForSelector("h1");
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `Overflow ${route} at ${width}`,
        );
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          theme,
        );
        if (["", "books/", "checkout/", "about/"].includes(route))
          await page.screenshot({
            path: `screenshots/${route.replace("/", "") || "home"}-${theme}-${width}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:4174" + base);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .locator("#primary-navigation")
    .getByRole("link", { name: "Courses", exact: true })
    .click();
  await page.getByRole("heading", { name: "Online Training" }).waitFor();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.deepEqual(errors, []);
  console.log(
    "Checkout, validation, routes and responsive overflow checks passed.",
  );
} finally {
  await browser?.close();
  server.close();
}
