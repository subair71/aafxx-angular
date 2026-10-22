import { Component, signal, computed, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { lessons, catalogueMeta } from "./learning-content";
import { enquiryConfig } from "./enquiry-config";
type Page =
  | "Home"
  | "Courses"
  | "Books"
  | "Resources"
  | "About"
  | "Contact"
  | "Detail"
  | "Lesson"
  | "Strategies"
  | "Achievements"
  | "Webinars"
  | "Checkout"
  | "Account"
  | "FAQ"
  | "Privacy"
  | "Terms"
  | "NotFound";
interface Item {
  id: number;
  name: string;
  detail: string;
  type: "Books" | "Courses";
  tag: string;
  cover?: string;
  topics: string[];
}
@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  meta = catalogueMeta;
  lessons = lessons;
  page = signal<Page>("Home");
  detail = signal<Item | null>(null);
  lesson = signal(lessons[0]);
  dark = signal(true);
  menu = signal(false);
  query = signal("");
  topic = signal("All");
  level = signal("All");
  format = signal("All");
  answer = signal(-1);
  checked = signal(false);
  alert = signal("");
  busy = signal(false);
  name = "";
  email = "";
  message = "";
  subject = "General enquiry";
  config = enquiryConfig;
  pages: Page[] = ["Home", "Courses", "Books", "Resources", "About", "Contact"];
  topics = [
    "Forex Fundamentals",
    "Technical Analysis",
    "Fundamental Analysis",
    "Risk Management",
    "Trading Psychology",
    "Trading Journals",
  ];
  faqs = [
    [
      "Where should I start?",
      "Begin with currency pairs, pips and spreads, then study leverage and risk. Our free reading guides include examples and practice questions without requiring an account.",
    ],
    [
      "Can I enrol in a course now?",
      "The academy catalogue describes proposed learning paths. Schedules, instructors, delivery formats and fees are not yet confirmed. Prepare an enquiry to discuss your learning interests.",
    ],
    [
      "Are the books available to buy?",
      "The current book listings are catalogue concepts, with clearly labelled placeholder covers. Publication details and availability must be confirmed before any purchase.",
    ],
    [
      "Do I need trading experience?",
      "The beginner resources assume no prior knowledge. Intermediate and advanced paths identify the concepts to study first.",
    ],
    [
      "Will education guarantee trading results?",
      "No. Learning can improve your understanding, but forex and leveraged trading involve financial risk. Educational examples are not trading recommendations.",
    ],
  ];
  base = new URL(document.baseURI).pathname;
  visibleItems = computed(() =>
    this.items.filter(
      (i) =>
        i.type === this.page() &&
        (!this.query().trim() ||
          (i.name + " " + i.detail + " " + this.meta[i.id].topic)
            .toLowerCase()
            .includes(this.query().trim().toLowerCase())) &&
        (this.level() === "All" || this.meta[i.id].level === this.level()) &&
        (this.topic() === "All" || this.meta[i.id].topic === this.topic()) &&
        (this.format() === "All" || this.format() === "To be confirmed"),
    ),
  );
  filteredLessons = computed(() =>
    lessons.filter(
      (l) =>
        (this.topic() === "All" || l.category === this.topic()) &&
        (l.title + " " + l.category)
          .toLowerCase()
          .includes(this.query().trim().toLowerCase()),
    ),
  );
  resetFilters() {
    this.query.set("");
    this.topic.set("All");
    this.level.set("All");
    this.format.set("All");
  }
  label(p: Page) {
    return p === "Courses"
      ? "Academy"
      : p === "Resources"
        ? "Learning Resources"
        : p;
  }
  href(p: Page) {
    return this.base + (p === "Home" ? "" : p.toLowerCase() + "/");
  }
  itemHref(i: Item) {
    return this.href(i.type) + this.meta[i.id].slug + "/";
  }
  lessonHref(slug: string) {
    return this.href("Resources") + slug + "/";
  }
  enquiryHref(i: Item) {
    return this.href("Contact") + "?subject=" + encodeURIComponent(i.name);
  }
  related(i: Item) {
    return this.items.filter((x) => x.type === i.type && x.id !== i.id);
  }
  relatedLessons() {
    return lessons
      .filter((l) => l.slug !== this.lesson().slug)
      .sort(
        (a, b) =>
          Number(b.category === this.lesson().category) -
          Number(a.category === this.lesson().category),
      )
      .slice(0, 3);
  }
  courseLessons(id: number) {
    return id === 4
      ? lessons.slice(0, 3)
      : id === 5
        ? lessons.slice(3, 5)
        : lessons.slice(5);
  }
  constructor() {
    try {
      this.dark.set(localStorage.getItem("aafxx-theme") !== "light");
    } catch {}
    document.documentElement.dataset["theme"] = this.dark() ? "dark" : "light";
    this.readLocation();
    window.addEventListener("popstate", () => {
      this.resetFilters();
      this.menu.set(false);
      this.readLocation();
    });
    window.addEventListener("seo-origin", () => this.seo());
  }
  toggleTheme() {
    this.dark.update((v) => !v);
    document.documentElement.dataset["theme"] = this.dark() ? "dark" : "light";
    try {
      localStorage.setItem("aafxx-theme", this.dark() ? "dark" : "light");
    } catch {}
  }
  @HostListener("document:keydown.escape") escape() {
    this.menu.set(false);
    document.querySelector<HTMLElement>(".menu-toggle")?.focus();
  }
  follow(event?: Event) {
    if (
      event instanceof MouseEvent &&
      (event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0)
    )
      return false;
    event?.preventDefault();
    return true;
  }
  navigate(url: string, event?: Event) {
    if (!this.follow(event)) return;
    history.pushState({}, "", url);
    this.resetFilters();
    this.menu.set(false);
    this.alert.set("");
    this.readLocation();
    window.scrollTo(0, 0);
    setTimeout(() => document.querySelector<HTMLElement>("main h1")?.focus());
  }
  go(p: Page, event?: Event) {
    this.navigate(this.href(p), event);
  }
  openItem(i: Item, event?: Event) {
    this.navigate(this.itemHref(i), event);
  }
  openLesson(slug: string, event?: Event) {
    this.navigate(this.lessonHref(slug), event);
  }
  enquire(i: Item, event?: Event) {
    this.navigate(this.enquiryHref(i), event);
  }
  readLocation() {
    const parts = location.pathname
      .slice(this.base.length)
      .split("/")
      .filter(Boolean);
    const part = parts[0] === "academy" ? "courses" : parts[0];
    this.detail.set(null);
    this.checked.set(false);
    this.answer.set(-1);
    if (parts.length === 2 && ["books", "courses"].includes(part)) {
      const i = this.items.find(
        (i) =>
          this.meta[i.id].slug === parts[1] && i.type.toLowerCase() === part,
      );
      this.detail.set(i || null);
      this.page.set(i ? "Detail" : "NotFound");
    } else if (parts.length === 2 && part === "resources") {
      const l = lessons.find((l) => l.slug === parts[1]);
      if (l) this.lesson.set(l);
      this.page.set(l ? "Lesson" : "NotFound");
    } else {
      const all: Page[] = [
        ...this.pages,
        "Strategies",
        "Achievements",
        "Webinars",
        "Checkout",
        "Account",
        "FAQ",
        "Privacy",
        "Terms",
      ];
      this.page.set(
        !parts.length
          ? "Home"
          : parts.length === 1
            ? all.find((p) => p.toLowerCase() === part) || "NotFound"
            : "NotFound",
      );
    }
    if (this.page() === "Contact")
      this.subject =
        new URLSearchParams(location.search).get("subject")?.slice(0, 200) ||
        "General enquiry";
    this.seo();
  }
  draft() {
    return `AA FXX enquiry: ${this.subject}\n\nName: ${this.name.trim()}\nReply email: ${this.email.trim()}\n\n${this.message.trim()}`;
  }
  async contact() {
    if (
      this.busy() ||
      !this.name.trim() ||
      !this.message.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
    )
      return;
    this.busy.set(true);
    this.alert.set("");
    try {
      if (this.config.email) {
        location.href =
          "mailto:" +
          this.config.email +
          "?subject=" +
          encodeURIComponent("AA FXX: " + this.subject) +
          "&body=" +
          encodeURIComponent(this.draft());
        this.alert.set(
          "Email draft prepared. Review and send it in your email application. This website has not sent your enquiry.",
        );
      } else {
        await navigator.clipboard.writeText(this.draft());
        this.alert.set(
          "Enquiry copied. Nothing has been sent. Share it with your existing AA FXX contact.",
        );
      }
    } catch {
      this.alert.set(
        "Copy was unavailable. Download your enquiry below and share it with your existing AA FXX contact. Nothing has been sent.",
      );
    } finally {
      this.busy.set(false);
    }
  }
  downloadDraft() {
    this.download("aafxx-enquiry.txt", this.draft(), "text/plain");
    this.alert.set("Enquiry downloaded. Nothing has been sent.");
  }
  downloadJournal() {
    this.download(
      "aafxx-practice-journal.csv",
      "Date,Time zone,Instrument,Timeframe,Hypothesis,Invalidation,Planned risk,Costs,Outcome,Followed plan,Reflection\n",
      "text/csv",
    );
  }
  download(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  items: Item[] = [
    {
      id: 1,
      topics: [
        "The AAFXX learning philosophy",
        "A framework for chart study",
        "Discipline and reflective practice",
      ],
      cover: "assets/books/why-they-call-me-prof.svg",
      name: "Why They Call Me Prof.",
      detail: "An introduction to the AAFXX trading philosophy",
      type: "Books",
      tag: "FEATURED",
    },
    {
      id: 2,
      topics: [
        "Candlesticks and market context",
        "Trend, direction and location",
        "A structured chart-reading routine",
      ],
      cover: "assets/books/the-5-minute-chart.svg",
      name: "The 5-Minute Chart",
      detail: "Chart reading and market structure essentials",
      type: "Books",
      tag: "CHART STUDY",
    },
    {
      id: 3,
      topics: [
        "Building a trading journal",
        "Planning risk before entry",
        "Recognising emotional decisions",
      ],
      cover: "assets/books/trading-with-discipline.svg",
      name: "Trading With Discipline",
      detail: "Mindset and risk management foundations",
      type: "Books",
      tag: "MINDSET",
    },
    {
      id: 4,
      topics: [
        "Currency pairs, pips and spreads",
        "Reading price and chart structure",
        "Demo practice and a learning plan",
      ],
      name: "Forex Foundations",
      detail: "Learn the essentials of forex trading",
      type: "Courses",
      tag: "BEGINNER",
    },
    {
      id: 5,
      topics: [
        "Trend and timeframe alignment",
        "Moving-average relationships",
        "Entry context and trade review",
      ],
      name: "The AAFXX Method",
      detail: "Explore the frameworks and trading setups",
      type: "Courses",
      tag: "INTERMEDIATE",
    },
    {
      id: 6,
      topics: [
        "Risk per trade and position sizing",
        "Stop-loss planning and exposure",
        "Journaling and evaluating decisions",
      ],
      name: "Risk & Trade Management",
      detail: "Position sizing and trading plans",
      type: "Courses",
      tag: "ADVANCED",
    },
  ];
  strategies = [
    [
      "Triline System",
      "EMA9, SMA20, MFI50, RSI50 and candle patterns at EMA9 form the founder’s structured chart-reading framework.",
    ],
    [
      "Expert Advisors & Automation",
      "The founder’s work includes five FINAL V3 Expert Advisors, BBB CMM systems and TradingView Pine Script indicators.",
    ],
    [
      "SMA20 & EMA23",
      "Explore moving-average relationships and market context.",
    ],
    [
      "Low In · Middle Out",
      "Study entries and exits across the 5-minute and 15-minute charts.",
    ],
    ["BBB Flow", "Learn an educational approach to price action and momentum."],
    ["Leader Alignment", "Understand 30-minute and 1-hour market direction."],
    [
      "Risk Management",
      "Build trading plans with defined risk and capital protection.",
    ],
  ];
  images = [
    "founder-certificate.jpeg",
    "fe9b14fe-1a82-4e0c-92a7-ec8b0747807e.jpeg",
    "d6d34d47-c09e-4fe7-b52b-32f168c35934.jpeg",
    "e6bb140e-0abc-4df5-8310-6c1b15a74194.jpeg",
    "2d392788-070e-4e9f-8538-21b24af8138b.jpeg",
  ];
  seo() {
    const descriptions: Record<Page, string> = {
      Webinars:
        "Explore AAFXX live learning and upcoming session availability.",
      Resources:
        "Free forex guides covering currency pairs, risk, analysis and trading psychology, with practical exercises.",
      Detail: this.detail()?.detail || "AAFXX resource details",
      Lesson: this.lesson().intro,
      NotFound: "The requested AAFXX page could not be found.",
      Home: "Explore AAFXX forex education, trading books and structured learning. Build knowledge in chart analysis, trading discipline and risk management.",
      About:
        "Meet Prince Berthram Chidi Eke, founder of AAFXX. Explore his story, educational mission and approach to market analysis and disciplined learning.",
      Books:
        "Browse the AAFXX trading library. Explore digital reading on the 5-minute chart, market structure, trading psychology and risk management.",
      Courses:
        "Explore AAFXX learning paths in forex foundations, chart analysis and risk management. Compare topics and find a starting point for your studies.",
      Strategies:
        "Study the AAFXX learning frameworks: trend, direction, location, moving averages, multi-timeframe context and risk planning.",
      Achievements:
        "Explore the AAFXX founder’s journey, publications, educational projects and milestones in his own account of his work.",
      Contact:
        "Prepare an AAFXX enquiry about trading books, education programmes, resources or collaboration opportunities.",
      FAQ: "Answers about forex study, proposed books and courses, publication availability and academy enquiries.",
      Privacy:
        "Learn how AA FXX handles theme preferences, enquiry drafts and visitor data.",
      Terms:
        "Read the AA FXX terms for educational content, proposed publications and responsible use.",
      Checkout:
        "Online checkout is unavailable. Prepare an enquiry about AA FXX books and learning programmes.",
      Account:
        "AA FXX account services are unavailable. Explore open learning resources without signing in.",
    };
    const titles: Partial<Record<Page, string>> = {
      Home: "AAFXX | Forex Education, Trading Books & Courses",
      Books: "Trading Books & Digital Library | AAFXX Academy",
      Courses: "Forex Learning Paths & Courses | AAFXX Academy",
      About: "Our Founder & Educational Mission | AAFXX Academy",
    };
    const title =
      this.page() === "Detail"
        ? this.detail()!.name + " | AAFXX Academy"
        : this.page() === "Lesson"
          ? this.lesson().title + " | AAFXX Academy"
          : titles[this.page()] || this.page() + " | AAFXX Trading Academy";
    const description = descriptions[this.page()];
    const configured = document.querySelector<HTMLMetaElement>(
      'meta[name="site-origin"]',
    )?.content;
    const origin = configured || location.origin;
    const preview =
      document
        .querySelector('meta[name="site-preview"]')
        ?.getAttribute("content") === "true";
    const url =
      origin +
      (this.page() === "Detail"
        ? this.itemHref(this.detail()!)
        : this.page() === "Lesson"
          ? this.lessonHref(this.lesson().slug)
          : this.page() === "NotFound"
            ? location.pathname
            : this.href(this.page()));
    document.title = title;
    const set = (key: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.append(el);
      }
      el.content = content;
    };
    set("description", description);
    set(
      "robots",
      preview || ["Checkout", "Account", "NotFound"].includes(this.page())
        ? "noindex,follow"
        : "index,follow,max-image-preview:large",
    );
    for (const prefix of ["og", "twitter"]) {
      set(prefix + ":title", title, prefix === "og");
      set(prefix + ":description", description, prefix === "og");
      set(
        prefix + ":image",
        origin + this.base + "assets/social-preview.png",
        prefix === "og",
      );
    }
    set("og:url", url, true);
    set("og:type", "website", true);
    set("og:site_name", "AAFXX Trading Academy", true);
    set(
      "og:image:alt",
      "AAFXX Academy — knowledge first, discipline always",
      true,
    );
    set("twitter:card", "summary_large_image");
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = url;
    const graph: object[] = [
      {
        "@type": "EducationalOrganization",
        "@id": origin + this.base + "#academy",
        name: "AAFXX Trading Academy",
        url: origin + this.base,
        founder: { "@type": "Person", name: "Prince Berthram Chidi Eke" },
      },
      {
        "@type": "WebSite",
        "@id": origin + this.base + "#website",
        name: "AAFXX Trading Academy",
        url: origin + this.base,
      },
      {
        "@type": "WebPage",
        name: title,
        description,
        url,
        isPartOf: { "@id": origin + this.base + "#website" },
      },
    ];
    const crumbs: object[] = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: origin + this.base,
      },
    ];
    if (this.page() === "Detail") {
      const item = this.detail()!;
      crumbs.push(
        {
          "@type": "ListItem",
          position: 2,
          name: this.label(item.type),
          item: origin + this.href(item.type),
        },
        { "@type": "ListItem", position: 3, name: item.name, item: url },
      );
    } else if (this.page() === "Lesson")
      crumbs.push(
        {
          "@type": "ListItem",
          position: 2,
          name: "Resources",
          item: origin + this.href("Resources"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: this.lesson().title,
          item: url,
        },
      );
    else
      crumbs.push({
        "@type": "ListItem",
        position: 2,
        name: this.label(this.page()),
        item: url,
      });
    if (this.page() !== "Home" && this.page() !== "NotFound")
      graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs });
    if (this.page() === "Lesson")
      graph.push({
        "@type": "LearningResource",
        name: this.lesson().title,
        description,
        url,
        inLanguage: "en",
        learningResourceType: "Reading lesson",
        isAccessibleForFree: true,
      });
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());
    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    });
    document.head.append(schema);
    if (preview) {
      document.querySelector("link[rel=canonical]")?.remove();
      document
        .querySelectorAll(
          'meta[property="og:url"],meta[property="og:image"],meta[name="twitter:image"],script[type="application/ld+json"]',
        )
        .forEach((el) => el.remove());
    }
  }
}
