import chromium from "@sparticuz/chromium";
// Amplify hosts this application at its branch origin, not at a GitHub Pages subpath.
process.env.SITE_BASE = "/";
process.env.CHROME_PATH ||= await chromium.executablePath();
process.env.CHROME_ARGS ||= JSON.stringify(chromium.args);
await import("./prerender.mjs");
