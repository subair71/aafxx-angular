import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { allRoutes, routes, privateRoutes, publicRoutes, redirects, bookSlugs } from "./routes.mjs";
const root = "dist/aafxx/browser";
const config = JSON.parse(await readFile(`${root}/build-environment.json`, "utf8"));
const { preview, origin, base } = config;
if (process.argv.includes("--preview")) assert.equal(preview, true, "Expected a preview build.");
const meta = (head, key) => head.match(new RegExp(`<meta\\b[^>]*(?:name|property)=["']${key.replaceAll(":", "\\:")}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"))?.[1];
const titles = new Map(), descriptions = new Map();
for (const route of allRoutes) {
  const html = await readFile(`${root}/${route ? route + "/" : ""}index.html`, "utf8");
  const head = html.split("</head>")[0];
  const canonicalRoute = redirects[route] ?? route;
  const title = head.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = meta(head, "description");
  assert(title && description, `Missing title/description on ${route || "home"}`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `Heading count on ${route}`);
  assert(!/https?:\/\/(localhost|127\.0\.0\.1|terminal\.local)/.test(head), `Local origin leaked on ${route}`);
  assert.equal(meta(head, "site-preview"), String(preview));
  assert.equal(meta(head, "payment-environment"), config.paymentEnvironment);
  assert(meta(head, "og:title") && meta(head, "og:description"), `Missing social metadata on ${route}`);
  if (routes.includes(route)) {
    assert(!titles.has(title), `Duplicate title on ${route} and ${titles.get(title)}`);
    assert(!descriptions.has(description), `Duplicate description on ${route} and ${descriptions.get(description)}`);
    titles.set(title, route); descriptions.set(description, route);
  }
  const robots = meta(head, "robots");
  if (preview || privateRoutes.includes(canonicalRoute)) assert.equal(robots, "noindex,follow", `Indexing leak on ${route}`);
  else assert.match(robots, /^index,follow/);
  const canonical = head.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/)?.[1];
  const schemas = [...head.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)];
  if (preview) {
    assert(!canonical, `Preview has canonical: ${route}`);
    assert.equal(schemas.length, 0, `Preview schema uses an unapproved origin: ${route}`);
    assert(!meta(head, "og:url"));
  } else {
    assert.equal(canonical, origin + base + (canonicalRoute ? canonicalRoute + "/" : ""), `Canonical mismatch on ${route}`);
    assert.equal(meta(head, "og:url"), canonical);
    assert.equal(schemas.length, 1, `Missing or duplicate schema on ${route}`);
    const schema = JSON.parse(schemas[0][1]);
    assert.equal(schema["@context"], "https://schema.org");
    assert(schema["@graph"].some((node) => node["@type"] === "EducationalOrganization"));
    assert(!/aggregateRating|ratingValue|reviewCount|isbn/.test(schemas[0][1]), `Unapproved product claims on ${route}`);
    if (bookSlugs.some((slug) => canonicalRoute === `books/${slug}`)) {
      const book = schema["@graph"].find((node) => Array.isArray(node["@type"]) && node["@type"].includes("Book") && node["@type"].includes("Product"));
      assert(book, `Book/Product schema absent on ${route}`);
      assert.equal(book.author.name, "Prince Prof. Berthram Chidi Eke");
      if (config.paymentEnvironment === "test") assert(!book.offers, "Test-only offers must not be published to search engines");
    }
  }
}
const robots = await readFile(`${root}/robots.txt`, "utf8");
assert.match(robots, /User-agent: \*/);
if (preview) {
  await assert.rejects(access(`${root}/sitemap.xml`), {code: "ENOENT"});
  assert(!robots.includes("Sitemap:"));
  assert.equal(config.paymentEnvironment, "test");
} else {
  const sitemap = await readFile(`${root}/sitemap.xml`, "utf8");
  assert.equal((sitemap.match(/<loc>/g) || []).length, publicRoutes.length);
  for (const route of [...privateRoutes, ...Object.keys(redirects)]) assert(!sitemap.includes(`<loc>${origin + base + route}/</loc>`), `Excluded route leaked into sitemap: ${route}`);
  assert(robots.includes(`Sitemap: ${origin + base}sitemap.xml`));
}
const fallback = await readFile(`${root}/404.html`, "utf8");
assert.equal(meta(fallback.split("</head>")[0], "robots"), "noindex,follow");
console.log(`SEO checks passed across ${allRoutes.length} rendered URLs (${routes.length} canonical pages; ${preview ? "noindex/test environment" : "production metadata"}).`);
