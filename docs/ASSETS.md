# Supplied AAFXX brand and book assets

The original logo and four cover JPEGs were supplied on 23 October 2026, after the previously validated application revision `0272a281fd1ce47c8f07d4cba98acb8c9e2934e2`. Fresh validation of their integration is tracked in [VALIDATION.md](../VALIDATION.md).

## Original-file mapping

The logo was supplied separately as `WhatsApp Image 2026-10-23 at 3.58.02 PM(1).jpeg` (1600 × 1600). The four covers were supplied inside `WhatsApp Unknown 2026-10-23 at 9.56.27 PM(1).zip` (each 1066 × 1599). Copies in `design-assets/originals/` retain the exact JPEG bytes with normalized filenames.

Cover identity was determined from the visible title, rather than archive order or filename suffix. In particular, the source with suffix `(3)` is Book 3, and the source with suffix `(2)` is Book 4.

| Original filename | Visible identity | Retained original | Public primary asset |
| --- | --- | --- | --- |
| `WhatsApp Image 2026-10-23 at 3.58.02 PM(1).jpeg` | AAFXX logo | `design-assets/originals/aafxx-logo-original.jpeg` | `public/assets/brand/aafxx-logo.svg` |
| `WhatsApp Image 2026-10-23 at 3.58.35 PM.jpeg` | ANYBODY WINS ANYTIME, ANYDAY, ANYWHERE | `design-assets/originals/book-1-original.jpeg` | `public/assets/books/book-1.jpg` |
| `WhatsApp Image 2026-10-23 at 3.58.35 PM (1).jpeg` | FOREX LOW IN, MIDDLE OUT | `design-assets/originals/book-2-original.jpeg` | `public/assets/books/book-2.jpg` |
| `WhatsApp Image 2026-10-23 at 3.58.35 PM (3).jpeg` | BBB FLOW & LEADER ALIGNMENT | `design-assets/originals/book-3-original.jpeg` | `public/assets/books/book-3.jpg` |
| `WhatsApp Image 2026-10-23 at 3.58.35 PM (2).jpeg` | PROF STANDARD | `design-assets/originals/book-4-original.jpeg` | `public/assets/books/book-4.jpg` |

## Web derivatives and metadata

Each book has a primary JPEG (an exact copy of the original) and an optimized 480-pixel-wide JPEG card variant at `public/assets/books/book-N-480.jpg`. The cover artwork, visible title and proportions are preserved.

`public/assets/brand/aafxx-logo.svg` embeds an optimized rendition of the supplied logo. Its viewBox removes only the surrounding black whitespace; it does not redraw the lettering or emblem or claim a transparent-background conversion. The complete source JPEG remains available in the originals directory. `public/assets/brand/aafxx-logo-square.jpg` provides an 800 × 800 version for production Organization metadata. The favicon displays the supplied crest through a square SVG viewport.

With an explicitly configured approved production origin, Book/Product and book social metadata use the corresponding cover, and EducationalOrganization metadata uses the square logo. Development previews remain `noindex` and omit absolute canonical/image URLs and structured data. No production hostname, offer, review or rating is inferred from the supplied artwork.

## Hosting compatibility

On 26 October 2026, the development host returned `200 text/html` for the WebP covers and the `.jpeg` founder biography, while PNG and SVG assets loaded correctly. This behavior is consistent with an SPA rewrite that does not exclude those extensions. Runtime covers, the CSS founder portrait, and the square metadata logo now use `.jpg`, an extension excluded by the [Amplify SPA rewrite example](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html). Existing originals and WebP derivatives are retained.

Run `npm run check:images` after building and prerendering. It reproduces HTML fallback responses for `.webp` and `.jpeg`, then decodes all page images and the CSS portrait on home, shop, four product pages, and both author pages at desktop and mobile widths. After deployment, verify the new `.jpg` requests return `image/jpeg` on the actual host.

## Content still required

These image files are public cover/brand artwork. They do not supply the final paid PDFs, A3 Checklist artwork, private digital fulfilment, verified checkout destinations, shipping arrangements or approved contact/policy content. Those dependencies remain documented in [COMMERCE_SETUP.md](COMMERCE_SETUP.md).
