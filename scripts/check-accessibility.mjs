import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { startCheckServer, launchCheckBrowser } from "./browser-check-support.mjs";
const server = await startCheckServer();
let browser;
try {
  browser = await launchCheckBrowser();
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  const page = await context.newPage();
  const reports = [];
  for (const theme of ["dark", "light"]) {
    await page.goto(server.origin + server.config.base);
    await page.evaluate((value) => localStorage.setItem("aafxx-theme", value), theme);
    for (const route of ["", "books", "books/anybody-wins-anytime-anyday-anywhere", "academy", "checklist", "expert-advisors", "contact", "checkout/success", "launch-notifications", "mentorship", "about-author", "registration-confirmed", "risk-disclaimer", "checkout"]) {
      await page.goto(server.origin + server.config.base + (route ? route + "/" : ""));
      await page.locator("main h1").waitFor();
      const result = await new AxeBuilder({page}).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      reports.push({theme, route: route || "home", violations: result.violations.map((violation) => ({id: violation.id, impact: violation.impact, description: violation.description, nodes: violation.nodes.map((node) => ({target: node.target, summary: node.failureSummary}))}))});
    }
  }
  await mkdir("screenshots", {recursive: true});
  await writeFile("screenshots/accessibility.json", JSON.stringify(reports, null, 2));
  const failures = reports.filter((report) => report.violations.length);
  if (failures.length) console.error(JSON.stringify(failures, null, 2));
  assert.equal(failures.length, 0, "Accessibility violations found");
  console.log("Automated WCAG 2.2 AA-tagged accessibility checks passed on 14 pages in both themes (28 scans).");
} finally {
  await browser?.close();
  await server.close();
}
