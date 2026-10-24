// Automated functional regressions for CI. Visual/Safari review is a separate task.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { allRoutes, redirects, bookSlugs } from "./routes.mjs";
import { startCheckServer, launchCheckBrowser } from "./browser-check-support.mjs";
const server = await startCheckServer();
let browser;
const report = { checks: [], responsivePages: 0, errors: [] };
try {
  browser = await launchCheckBrowser();
  const page = await browser.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  const href = (route = "") => server.origin + server.config.base + (route ? route + "/" : "");
  const goto = async (route = "") => { await page.goto(href(route)); await page.locator("main h1").waitFor(); };
  await goto();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.getByRole("button", {name: "Switch to light theme"}).click();
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.getByRole("button", {name: "Switch to dark theme"}).click();
  report.checks.push("Dark default and persistent light preference");

  await goto("books");
  assert.equal(await page.locator(".book-card").count(), 4);
  for (const card of await page.locator(".book-card").all()) {
    assert.match(await card.locator(".book-price").innerText(), /27/);
    await card.getByRole("button", {name: "Paperback", exact: true}).click();
    assert.equal(await card.getByRole("button", {name: "Paperback", exact: true}).getAttribute("aria-pressed"), "true");
    assert.match(await card.locator(".book-price").innerText(), /47/);
    assert.match(await card.locator(".purchase-action").getAttribute("href"), /launch-notifications\/\?book=aafxx-book-[1-4]&format=print/);
    assert.match(await card.locator(".purchase-action").innerText(), /Pre-Order on Amazon/);
    await card.getByRole("button", {name: "eBook", exact: true}).click();
    assert.match(await card.locator(".book-price").innerText(), /27/);
  }
  await page.getByLabel("Search books", {exact: true}).fill("BBB");
  assert.equal(await page.locator(".book-card").count(), 1);
  await page.getByLabel("Search books", {exact: true}).fill("not-a-real-book");
  assert.equal(await page.locator(".book-card").count(), 0);
  await page.getByLabel("Search books", {exact: true}).fill("");
  assert.equal(await page.locator(".book-card").count(), 4);
  report.checks.push("Four books, search, accessible eBook/Paperback state, $27/$47 prices and honest launch-notification destinations");

  for (const slug of bookSlugs) {
    await goto("books/" + slug);
    await page.reload();
    assert.equal(await page.locator("main h1").count(), 1);
    const action=page.locator(".detail-copy .button.full");
    assert.match(await action.getAttribute("href"), /launch-notifications/);
    assert.equal(await page.locator('a[href*="buy.stripe.com"],a[href*="amazon.com/dp/"]').count(),0);
  }
  await page.goto(href("checkout/success") + "?session_id=cs_test_forged&paid=true");
  await page.locator("main h1").waitFor();
  assert.equal(await page.locator('a[href$=".pdf"],a[href*="X-Amz-Signature"],a[download]').count(), 0);
  assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  report.checks.push("All book deep links/reload; query parameters cannot unlock a PDF or index a checkout page");

  assert.match(await page.locator('main').innerText(), /No purchase is confirmed/);
  assert.equal(await page.getByRole('heading',{name:'Thank You for Joining the AAFXX Learning Community!'}).count(),0);
  await goto('books');
  await page.getByRole('link',{name:'Register Interest in the Bundle',exact:true}).click();
  assert.equal(await page.getByLabel('Book selection',{exact:true}).inputValue(),'aafxx-complete-library');
  assert.match(await page.locator('app-lead-form').innerText(),/not a paid pre-order/);
  await page.getByLabel('Full Name',{exact:true}).fill('A Reader');
  await page.getByLabel('Email Address',{exact:true}).fill('reader@example.test');
  await page.locator('app-lead-form input[type="checkbox"]').check();
  assert(await page.getByRole('button',{name:'Register for Launch Notifications',exact:true}).isDisabled());
  await goto('registration-confirmed');
  assert.match(await page.locator('main').innerText(),/No registration is confirmed/);
  await goto('mentorship');
  assert(await page.getByRole('button',{name:'Submit Mentorship Application',exact:true}).isDisabled());
  assert.equal(await page.locator('a[href*="wa.me"]').count(),0);
  await goto('about-author');assert.equal(await page.locator('.author-portrait').count(),1);assert.match(await page.locator('main').innerText(),/late Ezi Achama Eke/);
  await goto();assert.equal(await page.locator('app-testimonials section').count(),0);
  report.checks.push('Bundle selection reaches the correct launch form; unavailable forms, direct confirmation URLs, missing WhatsApp and testimonials fail honestly; genuine author portrait and dedication render');

  // Native links must retain ampersands in subjects when opened in a new tab.
  await goto("books/bbb-flow-leader-alignment");
  const bookEnquiryUrl = await page.getByRole("link", {name: "Ask about this book", exact: true}).getAttribute("href");
  assert.equal(new URL(bookEnquiryUrl, server.origin).searchParams.get("subject"), "BBB FLOW & LEADER ALIGNMENT");
  await page.goto(new URL(bookEnquiryUrl, server.origin).href);
  assert.equal(await page.getByLabel("Enquiry about", {exact: true}).inputValue(), "BBB FLOW & LEADER ALIGNMENT");
  await page.reload();
  assert.equal(await page.getByLabel("Enquiry about", {exact: true}).inputValue(), "BBB FLOW & LEADER ALIGNMENT");
  assert(await page.getByRole("button", {name: "Copy enquiry", exact: true}).isDisabled());
  await page.getByLabel("Your name", {exact: true}).fill("Review User");
  await page.getByLabel("Email address", {exact: true}).fill("invalid-email");
  await page.getByLabel("Your message", {exact: true}).fill("Please confirm this edition's availability.");
  assert(await page.getByRole("button", {name: "Copy enquiry", exact: true}).isDisabled());
  await page.getByLabel("Email address", {exact: true}).fill("review@example.com");
  assert(await page.getByRole("button", {name: "Send enquiry", exact: true}).isDisabled());
  assert(!(await page.getByRole("button", {name: "Copy enquiry", exact: true}).isDisabled()));
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", {name: "Copy enquiry", exact: true}).click();
  await page.getByRole("status").filter({hasText: "Enquiry copied"}).waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /BBB FLOW & LEADER ALIGNMENT/);
  assert.match(copied, /Please confirm this edition/);
  assert.match(await page.locator(".form-status").innerText(), /Nothing has been sent/);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("denied"); }; });
  await page.getByRole("button", {name: "Copy enquiry", exact: true}).click();
  await page.getByRole("status").filter({hasText: "Copy is unavailable"}).waitFor();
  const draftDownload = page.waitForEvent("download");
  await page.getByRole("button", {name: "Download enquiry", exact: true}).click();
  const draft = await draftDownload;
  assert.equal(draft.suggestedFilename(), "aafxx-enquiry.txt");
  assert.match(await readFile(await draft.path(), "utf8"), /BBB FLOW & LEADER ALIGNMENT/);
  report.checks.push("Native and refreshed enquiry subjects retain ampersands; required/email validation, real clipboard copy, denied-copy fallback and actual draft download never claim delivery");

  await goto("academy");
  await page.getByRole("combobox", {name: "Level", exact: true}).selectOption("Advanced");
  assert.equal(await page.locator(".course-card").count(), 1);
  await page.getByRole("button", {name: "Reset filters", exact: true}).click();
  await page.getByRole("combobox", {name: "Topic", exact: true}).selectOption("Risk Management");
  assert.equal(await page.locator(".course-card").count(), 1);
  await page.locator(".course-card").getByRole("link", {name: "Explore learning path", exact: true}).click();
  const courseEnquiryUrl = await page.getByRole("link", {name: "Enquire About This Course", exact: true}).getAttribute("href");
  assert.equal(new URL(courseEnquiryUrl, server.origin).searchParams.get("subject"), "Risk & Trade Management");
  await goto("academy");
  await page.getByRole("combobox", {name: "Learning format", exact: true}).selectOption("Live online");
  assert.equal(await page.locator(".course-card").count(), 0);
  await page.getByRole("heading", {name: "No matching courses", exact: true}).waitFor();
  await page.getByRole("button", {name: "Clear filters", exact: true}).click();
  assert.equal(await page.locator(".course-card").count(), 3);
  await goto("resources");
  await page.getByLabel("Search resources", {exact: true}).fill("risk");
  assert.equal(await page.locator(".resource-card").count(), 2);
  await page.getByRole("button", {name: "Reset filters", exact: true}).click();
  await page.getByRole("combobox", {name: "Topic", exact: true}).selectOption("Trading Journals");
  assert.equal(await page.locator(".resource-card").count(), 1);
  await goto("resources/forex-basics");
  assert(await page.getByRole("button", {name: "Check answer", exact: true}).isDisabled());
  await page.getByLabel("USD", {exact: true}).check();
  await page.getByRole("button", {name: "Check answer", exact: true}).click();
  await page.getByRole("status").filter({hasText: "Try again."}).waitFor();
  await page.getByLabel("EUR", {exact: true}).check();
  await page.getByRole("button", {name: "Check answer", exact: true}).click();
  await page.getByRole("status").filter({hasText: "Correct."}).waitFor();
  const journalDownload = page.waitForEvent("download");
  await page.getByRole("button", {name: "Download practice journal", exact: true}).click();
  const journal = await journalDownload;
  assert.equal(journal.suggestedFilename(), "aafxx-practice-journal.csv");
  assert.match(await readFile(await journal.path(), "utf8"), /Instrument,Timeframe,Hypothesis/);
  report.checks.push("Preserved course level/topic/format filters, course enquiry URLs, resource filters, quiz feedback and journal CSV download");

  await goto("expert-advisors");
  await page.getByLabel("Email address", {exact: true}).fill("review@example.com");
  await page.getByRole("checkbox").check();
  assert(await page.getByRole("button", {name: "Join the Waitlist", exact: true}).isDisabled());
  assert.equal(await page.locator(".form-status").innerText(), "");
  report.checks.push("Valid waitlist data and consent cannot fabricate registration while its backend is unconfigured");

  for (const [route, target] of Object.entries(redirects)) {
    await goto(route);
    assert.equal(new URL(page.url()).pathname, server.config.base + target + "/");
  }
  await goto("a-page-that-does-not-exist");
  assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  assert.match(await page.locator("main").innerText(), /not found/i);
  report.checks.push("Legacy URL redirects and noindex unknown-route page");

  await mkdir("screenshots", {recursive: true});
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    for (const route of allRoutes) {
      await goto(route);
      assert.equal(await page.locator("h1").count(), 1, route);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow: ${route} at ${width}`);
      await page.evaluate(async () => { await Promise.all(Array.from(document.images).map((image) => { image.loading = "eager"; return image.decode(); })); });
      report.responsivePages++;
      if ([390,1440].includes(width) && ["", "books", "books/" + bookSlugs[0], "expert-advisors"].includes(route)) {
        await page.screenshot({path: `screenshots/${route.replaceAll("/", "-") || "home"}-${width}.png`, fullPage: true});
      }
    }
  }
  report.checks.push("All canonical and compatibility routes at 320/390/768/1440 widths, one H1, decodable images, no overflow");
  await page.setViewportSize({width: 390, height: 844});
  await goto();
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").innerText(), "Skip to content");
  await page.locator(".menu-toggle").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "true");
  await page.waitForFunction(() => document.activeElement?.matches("#primary-navigation a"));
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "false");
  assert.equal(await page.locator(":focus").getAttribute("aria-controls"), "primary-navigation");
  await page.emulateMedia({reducedMotion: "reduce"});
  await goto();
  assert(await page.evaluate(() => !document.getAnimations().some((animation) => animation.playState === "running")));
  report.checks.push("Keyboard skip link, Escape closes mobile navigation and restores focus, reduced motion");
  assert.deepEqual(report.errors, []);
  await writeFile("screenshots/validation.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
