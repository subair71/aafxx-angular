import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
const root = "dist/aafxx/browser",
  base = "/aafxx-angular/",
  origin = "https://subair71.github.io";
const routes = [
  "",
  "about",
  "books",
  "courses",
  "strategies",
  "achievements",
  "contact",
  "faq",
  "privacy",
  "terms",
  "checkout",
  "account",
];
const descriptions = {
  home: "Explore AAFXX forex education, trading books and structured courses from founder Prince Berthram Chidi Eke. Learn chart analysis, discipline and risk management.",
  about:
    "Meet Prince Berthram Chidi Eke (JP), AAFXX founder, author and educator. Discover his academic background, business leadership and educational mission.",
  books:
    "Explore the AAFXX trading library: practical reading on market structure, the 5-minute chart, trading discipline and risk management.",
  courses:
    "Discover AAFXX learning paths in forex foundations, the AAFXX method and risk and trade management.",
  strategies:
    "Explore the AAFXX Triline System, BBB Flow, Leader Alignment, multi-timeframe chart analysis and trading risk frameworks.",
};
const server = createServer(async (req, res) => {
  let path = decodeURI(req.url.split("?")[0]).replace(base, "");
  try {
    const data = await readFile(join(root, path || "index.html"));
    res.setHeader(
      "Content-Type",
      {
        ".js": "text/javascript",
        ".css": "text/css",
        ".jpeg": "image/jpeg",
        ".html": "text/html",
      }[extname(path)] || "text/html",
    );
    res.end(data);
  } catch {
    res.setHeader("Content-Type", "text/html");
    res.end(await readFile(join(root, "index.html")));
  }
}).listen(4173);
const browser = await chromium
  .launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? {
          executablePath: process.env.CHROME_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : {}),
  })
  .catch((e) => {
    server.close();
    throw e;
  });
try {
  for (const route of routes) {
    const page = await browser.newPage();
    await page.goto(
      "http://localhost:4173" + base + (route ? route + "/" : ""),
    );
    await page.waitForSelector("app-root h1");
    await page.evaluate(
      ({ route, base, origin, description }) => {
        const set = (selector, attrs) => {
          let el = document.querySelector(selector);
          if (!el) {
            el = document.createElement("meta");
            document.head.append(el);
          }
          for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        };
        set('meta[name="description"]', {
          name: "description",
          content: description,
        });
        const url = origin + base + (route ? route + "/" : "");
        set('meta[property="og:title"]', {
          property: "og:title",
          content: document.title,
        });
        set('meta[property="og:description"]', {
          property: "og:description",
          content: description,
        });
        set('meta[property="og:url"]', { property: "og:url", content: url });
        set('meta[property="og:type"]', {
          property: "og:type",
          content: "website",
        });
        set('meta[name="twitter:card"]', {
          name: "twitter:card",
          content: "summary",
        });
        document
          .querySelectorAll('script[type="application/ld+json"]')
          .forEach((el) => el.remove());
        let script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": origin + base + "#organization",
              name: "AAFXX",
              url: origin + base,
              founder: { "@type": "Person", name: "Prince Berthram Chidi Eke" },
            },
            {
              "@type": "WebPage",
              name: document.title,
              url,
              description,
              isPartOf: {
                "@type": "WebSite",
                name: "AAFXX Trading Academy",
                url: origin + base,
              },
            },
          ],
        });
        document.head.append(script);
      },
      {
        route,
        base,
        origin,
        description:
          descriptions[route || "home"] ||
          `AAFXX ${route}: forex education, learning resources and information from AAFXX Trading Academy.`,
      },
    );
    let html = await page.content();
    html = html.replace(/ ng-version="[^"]*"/g, "");
    const dir = join(root, route);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), html);
    await page.close();
  }
  await writeFile(
    join(root, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      routes
        .filter((r) => !["checkout", "account"].includes(r))
        .map(
          (r) =>
            "<url><loc>" + origin + base + (r ? r + "/" : "") + "</loc></url>",
        )
        .join("") +
      "</urlset>",
  );
  await writeFile(
    join(root, "robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: " + origin + base + "sitemap.xml\n",
  );
} finally {
  await browser.close();
  server.close();
}
