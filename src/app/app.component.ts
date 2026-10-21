import { Component, signal, computed } from "@angular/core";
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
  selected = signal<Item | null>(null);
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
      name: "Why They Call Me Prof.",
      detail: "An introduction to the AAFXX trading philosophy",
      price: 29,
      type: "Books",
      tag: "FEATURED",
    },
    {
      id: 2,
      name: "The 5-Minute Chart",
      detail: "Chart reading and market structure essentials",
      price: 24,
      type: "Books",
      tag: "EBOOK",
    },
    {
      id: 3,
      name: "Trading With Discipline",
      detail: "Mindset and risk management foundations",
      price: 19,
      type: "Books",
      tag: "MINDSET",
    },
    {
      id: 4,
      name: "Forex Foundations",
      detail: "Learn the essentials of forex trading",
      price: 99,
      type: "Courses",
      tag: "BEGINNER",
    },
    {
      id: 5,
      name: "The AAFXX Method",
      detail: "Explore the frameworks and trading setups",
      price: 199,
      type: "Courses",
      tag: "INTERMEDIATE",
    },
    {
      id: 6,
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
    try {
      this.dark.set(localStorage.getItem("aafxx-theme") === "dark");
    } catch {}
    document.documentElement.dataset["theme"] = this.dark() ? "dark" : "light";
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
    const title =
      this.page() === "Home"
        ? "AAFXX | Forex Education, Trading Books & Courses"
        : this.page() + " | AAFXX Trading Academy";
    document.title = title;
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        "href",
        "https://subair71.github.io" + this.href(this.page()),
      );
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute(
        "content",
        ["Checkout", "Account"].includes(this.page())
          ? "noindex,follow"
          : "index,follow",
      );
  }
  go(p: Page, event?: Event) {
    event?.preventDefault();
    this.page.set(p);
    history.pushState({}, "", this.href(p));
    this.seo();
    this.menu.set(false);
    window.scrollTo(0, 0);
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
  }
  remove(id: number) {
    this.cart.update((a) => a.filter((x) => x.item.id !== id));
    this.saveCart();
  }
}
