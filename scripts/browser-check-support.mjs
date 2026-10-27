import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { chromium } from "playwright";

export async function startCheckServer() {
  const root = resolve("dist/aafxx/browser");
  const config = JSON.parse(await readFile(join(root, "build-environment.json"), "utf8"));
  const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json" };
  const server = createServer(async (req, res) => {
    let path;
    try { path = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
    catch { res.writeHead(400).end(); return; }
    if (!path.startsWith(config.base)) { res.writeHead(404).end(); return; }
    let relative = path.slice(config.base.length);
    if (!extname(relative)) relative = relative.replace(/\/$/, "") + (relative ? "/" : "") + "index.html";
    const file = resolve(root, relative);
    if (!file.startsWith(root + "/")) { res.writeHead(403).end(); return; }
    try { const body = await readFile(file); res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }).end(body); }
    catch {
      if (extname(file) !== ".html") { res.writeHead(404).end(); return; }
      res.writeHead(404, {"Content-Type": "text/html"}).end(await readFile(join(root, "404.html")));
    }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  return { config, origin: `http://127.0.0.1:${address.port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}
export async function launchCheckBrowser() {
  return chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: JSON.parse(process.env.CHROME_ARGS || '["--no-sandbox","--disable-dev-shm-usage"]') } : {}) });
}
