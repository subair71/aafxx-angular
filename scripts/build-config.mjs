/** Public build settings only. Stripe secrets must never enter this module. */
export function readBuildConfig(env = process.env, htmlBase = "/") {
  const branch = (env.AWS_BRANCH || "").trim();
  const productionRequested = env.SITE_ENVIRONMENT === "production";
  const nonProductionBranch = !!branch && !["main", "production"].includes(branch);
  const preview = !productionRequested || nonProductionBranch || env.SITE_PREVIEW === "true";
  let origin = "";
  if (env.SITE_ORIGIN) {
    const candidate = new URL(env.SITE_ORIGIN);
    if (candidate.protocol !== "https:" || candidate.pathname !== "/" ||
        candidate.username || candidate.password || candidate.search || candidate.hash) {
      throw new Error("SITE_ORIGIN must be an HTTPS origin without a path, query, credentials or fragment.");
    }
    origin = candidate.origin;
  }
  if (!preview && !origin) {
    throw new Error("An indexable production build requires the approved SITE_ORIGIN. No domain is assumed.");
  }
  const base = env.SITE_BASE || htmlBase;
  if (!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base) || base.split("/").some((part) => [".", ".."].includes(part))) {
    throw new Error("SITE_BASE must be a root-relative path ending in /, without traversal segments.");
  }
  if (base !== htmlBase) {
    throw new Error(`SITE_BASE (${base}) does not match the Angular base href (${htmlBase}).`);
  }
  const paymentEnvironment = !preview && env.PAYMENT_ENVIRONMENT === "live" ? "live" : "test";
  return { branch, preview, origin: preview ? "" : origin, base, paymentEnvironment };
}
