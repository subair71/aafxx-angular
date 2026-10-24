import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readBuildConfig } from "./build-config.mjs";
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
export async function configureBuild(root = "dist/aafxx/browser", env = process.env) {
  let html = await readFile(join(root, "index.html"), "utf8");
  const base = html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  if (!base) throw new Error("Angular build is missing its base href.");
  const config = readBuildConfig(env, base);
  const values = {
    "site-preview": String(config.preview), "site-origin": config.origin,
    "payment-environment": config.paymentEnvironment,
    robots: config.preview ? "noindex,follow" : "index,follow,max-image-preview:large",
  };
  for (const [name, value] of Object.entries(values)) {
    const existing = new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*>`, "gi");
    html = html.replace(existing, "");
    if (value) html = html.replace("</head>", `<meta name="${name}" content="${escape(value)}"></head>`);
  }
  if (config.preview) {
    html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "")
      .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:url|og:image|twitter:image)["'][^>]*>/gi, "")
      .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
  }
  await writeFile(join(root, "index.html"), html);
  await writeFile(join(root, "build-environment.json"), JSON.stringify(config, null, 2) + "\n");
  console.log(`Build environment: ${config.preview ? "noindex development" : config.origin + config.base}; payments ${config.paymentEnvironment}.`);
  return config;
}
