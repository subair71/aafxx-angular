import { Component, signal, computed, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
type Page =
  | "Home"
  | "About"
  | "Books"
  | "Courses"
  | "Strategies"
  | "Achievements"
  | "Contact"
  | "Checkout"
  | "Account"
  | "FAQ"
  | "Privacy"
  | "Terms";
interface Item {
  id: number;
  name: string;
  detail: string;
  price: number;
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
  dark = signal(false);
  candles = [
    { x: 38, y: 174, h: 18, down: true },
    { x: 77, y: 157, h: 24, down: false },
    { x: 116, y: 144, h: 13, down: false },
    { x: 155, y: 140, h: 18, down: true },
    { x: 194, y: 111, h: 34, down: false },
    { x: 233, y: 84, h: 29, down: false },
    { x: 272, y: 80, h: 15, down: true },
    { x: 311, y: 62, h: 25, down: false },
    { x: 350, y: 46, h: 19, down: false },
    { x: 389, y: 27, h: 26, down: false },
  ];
  toggleTheme() {
    this.dark.update((v) => !v);
    document.documentElement.dataset["theme"] = this.dark() ? "dark" : "light";
    try {
      localStorage.setItem("aafxx-theme", this.dark() ? "dark" : "light");
    } catch {}
  }
  query = signal("");
  sort = signal("featured");
  visibleItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.items.filter(i => i.type === this.page() &&
      (!q || `${i.name} ${i.detail} ${i.tag}`.toLowerCase().includes(q)));
    return this.sort() === "price-low" ? list.sort((a,b) => a.price-b.price) :
      this.sort() === "price-high" ? list.sort((a,b) => b.price-a.price) : list;
  });
  selected = signal<Item | null>(null);
  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.selected.set(null); this.cartVisible.set(false); this.loginVisible.set(false); this.menu.set(false);
    }
    if (event.key === 'Tab') {
      const dialog = document.querySelector<HTMLElement>('[aria-modal="true"]');
      if (!dialog) return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]'));
      const first = nodes[0], last = nodes[nodes.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  openDetails(item: Item) { this.selected.set(item); this.focusDialog(); }
  focusDialog() { setTimeout(() => document.querySelector<HTMLElement>('[aria-modal="true"] button')?.focus()); }

  page = signal<Page>("Home");
  menu = signal(false);
  cartVisible = signal(false);
  loginVisible = signal(false);
  alert = signal("");
  email = "";
  password = "";
  name = "";
  message = "";
  pages: Page[] = [
    "Home",
    "About",
    "Books",
    "Courses",
    "Strategies",
    "Achievements",
    "Contact",
  ];
  items: Item[] = [
    {
      id: 1,
      topics: ["The AAFXX learning philosophy", "A framework for chart study", "Discipline and reflective practice"],
      cover: "assets/books/why-they-call-me-prof.svg",
      name: "Why They Call Me Prof.",
      detail: "An introduction to the AAFXX trading philosophy",
      price: 29,
      type: "Books",
      tag: "FEATURED",
    },
    {
      id: 2,
      topics: ["Candlesticks and market context", "Trend, direction and location", "A structured chart-reading routine"],
      cover: "assets/books/the-5-minute-chart.svg",
      name: "The 5-Minute Chart",
      detail: "Chart reading and market structure essentials",
      price: 24,
      type: "Books",
      tag: "EBOOK",
    },
    {
      id: 3,
      topics: ["Building a trading journal", "Planning risk before entry", "Recognising emotional decisions"],
      cover: "assets/books/trading-with-discipline.svg",
      name: "Trading With Discipline",
      detail: "Mindset and risk management foundations",
      price: 19,
      type: "Books",
      tag: "MINDSET",
    },
    {
      id: 4,
      topics: ["Currency pairs, pips and spreads", "Reading price and chart structure", "Demo practice and a learning plan"],
      name: "Forex Foundations",
      detail: "Learn the essentials of forex trading",
      price: 99,
      type: "Courses",
      tag: "BEGINNER",
    },
    {
      id: 5,
      topics: ["Trend and timeframe alignment", "Moving-average relationships", "Entry context and trade review"],
      name: "The AAFXX Method",
      detail: "Explore the frameworks and trading setups",
      price: 199,
      type: "Courses",
      tag: "INTERMEDIATE",
    },
    {
      id: 6,
      topics: ["Risk per trade and position sizing", "Stop-loss planning and exposure", "Journaling and evaluating decisions"],
      name: "Risk & Trade Management",
      detail: "Position sizing and trading plans",
      price: 149,
      type: "Courses",
      tag: "ALL LEVELS",
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
  cart = signal<{ item: Item; quantity: number }[]>([]);
  count = computed(() => this.cart().reduce((s, x) => s + x.quantity, 0));
  total = computed(() =>
    this.cart().reduce((s, x) => s + x.quantity * x.item.price, 0),
  );
  base = new URL(document.baseURI).pathname;
  href(p: Page) {
    return this.base + (p === "Home" ? "" : p.toLowerCase() + "/");
  }
  constructor() {
    document.documentElement.style.setProperty("--founder-image", `url("${this.base}assets/founder-biography.jpeg")`);
    try {
      this.dark.set(localStorage.getItem("aafxx-theme") === "dark");
    } catch {}
    document.documentElement.dataset["theme"] = this.dark() ? "dark" : "light";
    window.addEventListener("seo-origin", () => this.seo());
    this.readLocation();
    window.addEventListener("popstate", () => this.readLocation());
    try {
      const ids = JSON.parse(localStorage.getItem("aafxx-cart") || "[]");
      this.cart.set(
        ids.flatMap((x: any) => {
          const item = this.items.find((i) => i.id === x.id);
          return item && Number.isInteger(x.quantity) && x.quantity > 0
            ? [{ item, quantity: Math.min(x.quantity, 10) }]
            : [];
        }),
      );
    } catch {}
  }
  readLocation() {
    const part = location.pathname.slice(this.base.length).split("/")[0];
    const all: Page[] = [
      ...this.pages,
      "Checkout",
      "Account",
      "FAQ",
      "Privacy",
      "Terms",
    ];
    this.page.set(all.find((p) => p.toLowerCase() === part) || "Home");
    this.seo();
  }
  seo() {
    const descriptions: Record<Page, string> = {
      Home: "Explore AAFXX forex education, trading books and structured learning. Build knowledge in chart analysis, trading discipline and risk management.",
      About: "Meet Prince Berthram Chidi Eke, founder of AAFXX. Explore his story, educational mission and approach to market analysis and disciplined learning.",
      Books: "Browse the AAFXX trading library. Explore digital reading on the 5-minute chart, market structure, trading psychology and risk management.",
      Courses: "Explore AAFXX learning paths in forex foundations, chart analysis and risk management. Compare topics and find a starting point for your studies.",
      Strategies: "Study the AAFXX learning frameworks: trend, direction, location, moving averages, multi-timeframe context and risk planning.",
      Achievements: "Explore the AAFXX founder’s journey, publications, educational projects and milestones in his own account of his work.",
      Contact: "Prepare an AAFXX enquiry about trading books, education programmes, resources or collaboration opportunities.",
      FAQ: "Find answers about AAFXX books, learning frameworks, resource availability, checkout and contacting the academy.",
      Privacy: "Learn how this AAFXX website handles cart selections, checkout details, theme preferences and email enquiries.",
      Terms: "Read the AAFXX website terms covering educational resources, availability, order summaries and responsible use.",
      Checkout: "Review your AAFXX resource selection and prepare an unpaid order summary.",
      Account: "Plan your reading and explore AAFXX books and learning paths in the student workspace."
    };
    const titles: Partial<Record<Page, string>> = {Home:"AAFXX | Forex Education, Trading Books & Courses", Books:"Trading Books & Digital Library | AAFXX Academy", Courses:"Forex Learning Paths & Courses | AAFXX Academy", About:"Our Founder & Educational Mission | AAFXX Academy"};
    const title = titles[this.page()] || this.page() + " | AAFXX Trading Academy";
    const description = descriptions[this.page()];
    const configured = document.querySelector<HTMLMetaElement>('meta[name="site-origin"]')?.content;
    const origin = configured || location.origin;
    const preview = document.querySelector('meta[name="site-preview"]')?.getAttribute('content') === 'true';
    const url = origin + this.href(this.page());
    document.title = title;
    const set = (key: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr,key); document.head.append(el); }
      el.content = content;
    };
    set('description', description);
    set('robots', preview || ['Checkout','Account'].includes(this.page()) ? 'noindex,follow' : 'index,follow,max-image-preview:large');
    for (const prefix of ['og','twitter']) {
      set(prefix+':title',title,prefix==='og'); set(prefix+':description',description,prefix==='og');
      set(prefix+':image',origin+this.base+'assets/social-preview.png',prefix==='og');
    }
    set('og:url',url,true); set('og:type','website',true); set('og:site_name','AAFXX Trading Academy',true);
    set('og:image:alt','AAFXX Academy — knowledge first, discipline always',true);
    set('twitter:card','summary_large_image');
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical=document.createElement('link'); canonical.rel='canonical'; document.head.append(canonical); }
    canonical.href=url;
    const graph: object[] = [
      {'@type':'EducationalOrganization','@id':origin+this.base+'#academy',name:'AAFXX Trading Academy',url:origin+this.base,founder:{'@type':'Person',name:'Prince Berthram Chidi Eke'}},
      {'@type':'WebSite','@id':origin+this.base+'#website',name:'AAFXX Trading Academy',url:origin+this.base},
      {'@type':'WebPage',name:title,description,url,isPartOf:{'@id':origin+this.base+'#website'}},
    ];
    if (this.page() !== 'Home') graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+this.base},{'@type':'ListItem',position:2,name:this.page(),item:url}]});
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el=>el.remove());
    const schema=document.createElement('script'); schema.type='application/ld+json'; schema.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph}); document.head.append(schema);
  }
  go(p: Page, event?: Event) {
    event?.preventDefault();
    this.query.set("");
    this.sort.set("featured");
    this.page.set(p);
    history.pushState({}, "", this.href(p));
    this.seo();
    this.menu.set(false);
    window.scrollTo(0, 0);
    setTimeout(() => document.querySelector<HTMLElement>("main h1")?.focus());
  }
  saveCart() {
    try {
      localStorage.setItem(
        "aafxx-cart",
        JSON.stringify(
          this.cart().map((x) => ({ id: x.item.id, quantity: x.quantity })),
        ),
      );
    } catch {}
  }
  quantity(id: number, delta: number) {
    this.cart.update((a) =>
      a
        .map((x) =>
          x.item.id === id
            ? { ...x, quantity: Math.min(10, x.quantity + delta) }
            : x,
        )
        .filter((x) => x.quantity > 0),
    );
    this.saveCart();
  }
  step = signal(1);
  customer = { name: "", email: "", country: "" };
  accepted = false;
  payment = "Card";
  reference = "";
  checkout() {
    this.cartVisible.set(false);
    this.step.set(1);
    this.reference = "";
    this.accepted = false;
    this.go("Checkout");
  }
  complete() {
    if (
      !this.count() ||
      !this.accepted ||
      !this.customer.name.trim() ||
      !this.customer.email ||
      !this.customer.country
    )
      return;
    this.reference = "AFX-" + Date.now().toString(36).toUpperCase();
    this.step.set(4);
  }
  print() {
    window.print();
  }
  contact() {
    const body = encodeURIComponent(
      "Name: " +
        this.name +
        "\nReply email: " +
        this.email +
        "\n\n" +
        this.message,
    );
    location.href = "mailto:?subject=AAFXX%20enquiry&body=" + body;
    this.alert.set(
      "Your email application will open. Add your AAFXX contact’s address, review and send your enquiry there.",
    );
  }
  portal() {
    this.loginVisible.set(false);
    this.go("Account");
  }

  add(item: Item) {
    this.cart.update((a) =>
      a.some((x) => x.item.id === item.id)
        ? a.map((x) =>
            x.item.id === item.id
              ? { ...x, quantity: Math.min(10, x.quantity + 1) }
              : x,
          )
        : [...a, { item, quantity: 1 }],
    );
    this.saveCart();
    this.cartVisible.set(true);
    this.focusDialog();
  }
  remove(id: number) {
    this.cart.update((a) => a.filter((x) => x.item.id !== id));
    this.saveCart();
  }
}

