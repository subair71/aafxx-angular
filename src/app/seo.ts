export interface SeoBook {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  author: string;
  cover?: string | null;
  /** Supply only offers whose actual checkout and delivery readiness were validated. */
  offers?: ReadonlyArray<{ sku: string; format: "pdf" | "print"; price: number; url: string }>;
}
export interface SeoPage {
  title: string;
  description: string;
  /** Canonical root-relative pathname, including any configured base path. */
  path: string;
  noindex?: boolean;
  image?: string;
  breadcrumbs?: ReadonlyArray<{ name: string; path: string }>;
  book?: SeoBook;
  learningResource?: boolean;
}

export function updateSeo(page: SeoPage): void {
  const base = new URL(document.baseURI).pathname;
  const configured = document.querySelector<HTMLMetaElement>('meta[name="site-origin"]')?.content;
  let origin = "";
  try {
    const url = new URL(configured || "");
    if (url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password) origin = url.origin;
  } catch { /* Unconfigured previews never get a guessed canonical origin. */ }
  const preview = document.querySelector<HTMLMetaElement>('meta[name="site-preview"]')?.content !== "false" || !origin;
  const absolute = (path: string) => new URL(path.startsWith("/") ? path : base + path, origin + "/").href;
  const set = (key: string, content: string, property = false) => {
    const attribute = property ? "property" : "name";
    let node = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attribute, key);
      document.head.append(node);
    }
    node.content = content;
  };
  document.title = page.title;
  set("description", page.description);
  set("robots", preview || page.noindex ? "noindex,follow" : "index,follow,max-image-preview:large");
  set("og:title", page.title, true);
  set("og:description", page.description, true);
  set("og:type", page.book ? "book" : "website", true);
  set("og:site_name", "AAFXX – Anybody Wins Trading Academy", true);
  set("twitter:title", page.title);
  set("twitter:description", page.description);
  set("twitter:card", "summary_large_image");
  document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => node.remove());
  if (preview) {
    document.querySelectorAll('link[rel="canonical"],meta[property="og:url"],meta[property="og:image"],meta[name="twitter:image"],meta[property="og:image:alt"]').forEach((node) => node.remove());
    return;
  }
  const url = absolute(page.path);
  const image = absolute(page.image || page.book?.cover || "assets/social-preview.png");
  set("og:url", url, true);
  set("og:image", image, true);
  set("twitter:image", image);
  set("og:image:alt", page.book ? page.book.title : "AAFXX – Anybody Wins Trading Academy", true);
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = url;
  const home = absolute(base);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "EducationalOrganization", "@id": home + "#academy",
      name: "AAFXX – Anybody Wins Trading Academy", url: home,
      logo: absolute("assets/brand/aafxx-logo-square.webp"),
      founder: { "@type": "Person", name: "Prince Prof. Berthram Chidi Eke" },
      address: { "@type": "PostalAddress", addressLocality: "Manama", addressCountry: "BH" },
    },
    { "@type": "WebSite", "@id": home + "#website", name: "AAFXX – Anybody Wins Trading Academy", url: home },
    { "@type": "WebPage", "@id": url + "#webpage", name: page.title, description: page.description, url, isPartOf: { "@id": home + "#website" } },
  ];
  if (page.breadcrumbs?.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: page.breadcrumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absolute(crumb.path) })),
    });
  }
  if (page.book) {
    const book = page.book;
    const offers = (book.offers || []).filter((offer) => {
      try {
        const destination = new URL(offer.url);
        return destination.protocol === "https:" && destination.hostname === "buy.stripe.com" &&
          !destination.username && !destination.password && !destination.search && !destination.hash &&
          !destination.pathname.startsWith("/test_") && Number.isFinite(offer.price) && offer.price > 0;
      } catch { return false; }
    }).map((offer) => ({
      "@type": "Offer", sku: offer.sku, name: offer.format === "pdf" ? "PDF edition" : "Printed edition",
      price: offer.price, priceCurrency: "USD", url: offer.url,
      seller: { "@id": home + "#academy" },
    }));
    graph.push({
      "@type": ["Book", "Product"], "@id": url + "#book", productID: book.id,
      name: book.title, ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
      description: book.description, author: { "@type": "Person", name: book.author },
      url, ...(book.cover ? { image: absolute(book.cover) } : {}),
      ...(offers.length ? { offers } : {}),
    });
  }
  if (page.learningResource) {
    graph.push({ "@type": "LearningResource", name: page.title.replace(/\s*\|.*$/, ""), description: page.description, url, learningResourceType: "Reading lesson", isAccessibleForFree: true });
  }
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
  document.head.append(script);
}
