/** Merchant-approved Phase 1 catalogue. Prices are USD; amounts are in dollars. */
export type BookFormat = "pdf" | "print";

export interface BookVariant {
  readonly sku: string;
  readonly label: string;
  readonly price: number;
  readonly currency: "USD";
}

export interface Book {
  readonly id: string;
  readonly number: number;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string;
  readonly author: string;
  readonly description: string;
  readonly topics: readonly string[];
  /** Null means the original cover has not been supplied. Never substitute an invented cover. */
  readonly cover: string | null;
  readonly coverThumbnail: string | null;
  readonly coverAlt: string;
  readonly formats: Readonly<Record<BookFormat, BookVariant>>;
}

export const AUTHOR = "Prince Prof. Berthram Chidi Eke";

function variants(number: number): Readonly<Record<BookFormat, BookVariant>> {
  return {
    pdf: { sku: `aafxx-book-${number}-pdf`, label: "PDF", price: 27, currency: "USD" },
    print: { sku: `aafxx-book-${number}-print`, label: "Print", price: 47, currency: "USD" },
  };
}

export const BOOKS: readonly Book[] = [
  {
    id: "aafxx-book-1",
    number: 1,
    slug: "anybody-wins-anytime-anyday-anywhere",
    title: "ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE",
    subtitle: "The AAFXX Standard Checklist",
    author: AUTHOR,
    description: "The AAFXX Standard Checklist is the central methodology named by the academy. This publication introduces that educational focus within AAFXX’s approach to structured forex study and disciplined execution.",
    topics: ["The AAFXX Standard Checklist", "Structured forex study", "Trading discipline"],
    cover: "assets/books/book-1.webp",
    coverThumbnail: "assets/books/book-1-480.webp",
    coverAlt: "ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE — The AAFXX Standard Checklist, by Prince Prof. Berthram Chidi Eke",
    formats: variants(1),
  },
  {
    id: "aafxx-book-2",
    number: 2,
    slug: "forex-low-in-middle-out",
    title: "FOREX LOW IN, MIDDLE OUT",
    subtitle: "The 5M/15M Execution Bible",
    author: AUTHOR,
    description: "A publication centred on the academy’s LOW IN, MIDDLE OUT methodology and its stated 5-minute and 15-minute execution focus. Explore the named framework as educational material, with appropriate attention to trading risk.",
    topics: ["LOW IN, MIDDLE OUT", "5M / 15M chart context", "Disciplined execution"],
    cover: "assets/books/book-2.webp",
    coverThumbnail: "assets/books/book-2-480.webp",
    coverAlt: "FOREX LOW IN, MIDDLE OUT — The 5M/15M Execution Bible, by Prince Prof. Berthram Chidi Eke",
    formats: variants(2),
  },
  {
    id: "aafxx-book-3",
    number: 3,
    slug: "bbb-flow-leader-alignment",
    title: "BBB FLOW & LEADER ALIGNMENT",
    subtitle: "Mastering Trend Flow",
    author: AUTHOR,
    description: "An AAFXX publication focused on the academy’s named BBB FLOW and Leader Alignment methodologies. Its stated theme is trend flow within the wider AAFXX educational approach.",
    topics: ["BBB FLOW", "Leader Alignment", "Trend flow"],
    cover: "assets/books/book-3.webp",
    coverThumbnail: "assets/books/book-3-480.webp",
    coverAlt: "BBB FLOW & LEADER ALIGNMENT — Mastering Trend Flow, by Prince Prof. Berthram Chidi Eke",
    formats: variants(3),
  },
  {
    id: "aafxx-book-4",
    number: 4,
    slug: "prof-standard",
    title: "PROF STANDARD",
    subtitle: "1000 Wealth Creators Playbook",
    author: AUTHOR,
    description: "The publication associated with AAFXX’s 1000 Wealth Creators educational mission. The mission expresses the academy’s aspiration to support informed, disciplined learners; it is not a promise of financial outcomes.",
    topics: ["The AAFXX educational mission", "Disciplined learning", "1000 Wealth Creators aspiration"],
    cover: "assets/books/book-4.webp",
    coverThumbnail: "assets/books/book-4-480.webp",
    coverAlt: "PROF STANDARD — 1000 Wealth Creators Playbook, by Prince Prof. Berthram Chidi Eke",
    formats: variants(4),
  },
];

export const BUNDLE = {
  id: "aafxx-complete-library",
  sku: "aafxx-four-book-bundle",
  title: "THE COMPLETE AAFXX LIBRARY",
  subtitle: "All Four Books",
  price: 97,
  currency: "USD" as const,
  bookIds: BOOKS.map((book) => book.id),
};

export function bookBySlug(slug: string): Book | undefined {
  return BOOKS.find((book) => book.slug === slug);
}
