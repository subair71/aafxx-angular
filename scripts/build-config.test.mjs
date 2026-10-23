import { test } from "node:test";
import assert from "node:assert/strict";
import { readBuildConfig } from "./build-config.mjs";
import { allRoutes, publicRoutes, redirects, bookSlugs } from "./routes.mjs";

test("unconfigured builds do not invent domains or enable live payments", () => {
  assert.deepEqual(readBuildConfig({}), {branch: "", preview: true, origin: "", base: "/", paymentEnvironment: "test"});
});
test("dev-aafxx cannot become indexable or enable live payment through inherited app settings", () => {
  const config = readBuildConfig({ AWS_BRANCH: "dev-aafxx", SITE_ENVIRONMENT: "production", SITE_ORIGIN: "https://example.org", SITE_PREVIEW: "false", PAYMENT_ENVIRONMENT: "live" });
  assert.equal(config.preview, true);
  assert.equal(config.origin, "");
  assert.equal(config.paymentEnvironment, "test");
});
test("all nonproduction branches remain previews", () => {
  assert.equal(readBuildConfig({AWS_BRANCH: "develop", SITE_ENVIRONMENT: "production", SITE_ORIGIN: "https://example.org"}).preview, true);
});
test("production indexing requires explicit environment and approved origin", () => {
  assert.equal(readBuildConfig({SITE_ORIGIN: "https://example.org"}).preview, true);
  assert.throws(() => readBuildConfig({SITE_ENVIRONMENT: "production"}), /SITE_ORIGIN/);
  const config = readBuildConfig({AWS_BRANCH: "main", SITE_ENVIRONMENT: "production", SITE_ORIGIN: "https://example.org/", PAYMENT_ENVIRONMENT: "live"});
  assert.equal(config.preview, false);
  assert.equal(config.origin, "https://example.org");
  assert.equal(config.paymentEnvironment, "live");
});
test("canonical origins cannot contain credentials, query, fragments or paths", () => {
  for (const origin of ["http://example.org", "https://user:pass@example.org", "https://example.org/foo", "https://example.org/?x=y", "https://example.org/#x"]) assert.throws(() => readBuildConfig({SITE_ORIGIN: origin}));
});
test("base href must agree with deployment path and cannot traverse directories", () => {
  assert.equal(readBuildConfig({}, "/aafxx-angular/").base, "/aafxx-angular/");
  assert.throws(() => readBuildConfig({SITE_BASE: "/other/"}, "/"), /does not match/);
  assert.throws(() => readBuildConfig({}, "/../"));
});
test("all four real book routes exist; transaction and compatibility pages stay out of sitemap", () => {
  assert.equal(new Set(allRoutes).size, allRoutes.length);
  assert.equal(bookSlugs.length, 4);
  for (const slug of bookSlugs) assert(publicRoutes.includes(`books/${slug}`));
  for (const route of ["checkout", "checkout/success", "checkout/cancel", "account", "404", ...Object.keys(redirects)]) assert(!publicRoutes.includes(route));
});
