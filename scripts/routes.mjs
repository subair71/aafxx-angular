// Canonical pages only; compatibility URLs never appear in the sitemap.
export const bookSlugs = [
  "anybody-wins-anytime-anyday-anywhere",
  "forex-low-in-middle-out",
  "bbb-flow-leader-alignment",
  "prof-standard",
];
export const courseSlugs = ["forex-foundations", "the-aafxx-method", "risk-and-trade-management"];
export const lessonSlugs = ["forex-basics", "pips-and-spreads", "leverage-and-margin", "reading-market-structure", "fundamental-analysis", "risk-planning", "trading-psychology", "trading-journal"];
export const routes = [
  "", "books", ...bookSlugs.map((slug) => `books/${slug}`),
  "academy", "checklist", "about", "about-author", "mentorship", "risk-disclaimer", "launch-notifications", "registration-confirmed", "expert-advisors", "contact",
  "checkout/success", "checkout/cancel", "privacy-policy", "terms", "refund-policy",
  "resources", ...lessonSlugs.map((slug) => `resources/${slug}`),
  ...courseSlugs.map((slug) => `courses/${slug}`),
  "webinars", "faq", "checkout", "account", "404",
];
export const privateRoutes = ["registration-confirmed", "launch-notifications", "checkout", "checkout/success", "checkout/cancel", "account", "404", "privacy-policy", "terms", "refund-policy"];
export const redirects = {
  courses: "academy", privacy: "privacy-policy", strategies: "checklist", achievements: "about",
  "books/why-they-call-me-prof": "books",
  "books/the-5-minute-chart": "books",
  "books/trading-with-discipline": "books",
  ...Object.fromEntries(courseSlugs.map((slug) => [`academy/${slug}`, `courses/${slug}`])),
};
export const aliasRoutes = Object.keys(redirects);
export const publicRoutes = routes.filter((route) => !privateRoutes.includes(route));
export const allRoutes = [...routes, ...aliasRoutes];
