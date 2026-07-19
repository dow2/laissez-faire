# Odd Ritual Golf — Complete Site Teardown

*Element-by-element walkthrough of every page, 2026-07-18. Companion to
[oddritual-motion-analysis.md](./oddritual-motion-analysis.md), which covers the
animation engineering in depth — this doc covers everything: identity, chrome,
commerce, and each page's full anatomy. Sourced from complete HTML of all page
types (home, about, contact, shop, PDP, cart, policy) + the full custom JS/CSS.*

---

## 1. Identity & foundations

- **Brand:** Odd Ritual Golf Club (ORGC), Cape Town, South Africa. Tagline used
  everywhere: *"a modern expression of heritage."* Golf-lifestyle apparel,
  priced in ZAR, `en-ZA` locale. Collections 01 & 02 (~20 products: caps,
  tees, polos, crewnecks, a caddie jacket).
- **Studio:** footer credit "Website by malvah" — Malvah Studio (Cape Town),
  which explains the agency-grade polish.
- **Contact:** hello@oddritualgolf.com · +27 76 207 3387 · IG @oddritual.gc.
- **Color tokens:** black / white / **brand electric blue `#050FFF`** /
  greys `#f4f4f4`, `#ccc`, `#818181` / near-black `#020202`.
- **Type:** PP Neue Montreal Variable (primary; heavy use of small uppercase
  "detail" labels) + PP Editorial New in ultralight/regular/ultrabold +
  italics (serif accent voice).
- **Copy voice / brand tics:** zero-padded numbering on everything (`01/02/03`),
  parenthetical eyebrows with hard-space padding (`(     our story     )`),
  SKU-style product codes surfaced in the UI (`(OR_CAD_N)`), copyright stamps
  as decoration (`ORGC©25`, `ORGC_26`), monospace-flavored uppercase micro-labels.
- **Layout:** Webflow `u-grid-desktop` 12-col grid with `u-column-N` spans,
  `u-container` gutters, full-bleed hero bands, aspect-ratio-locked imagery
  (4/5 products, 4.35/2.8 + 4.35/6 editorial, 6.5/3.75 story, 1:1 icons).

## 2. Global chrome (every page)

### Nav bar (`.orgc-nav`)
Fixed 3-column bar: logo link · "Menu" toggle (rolling `h-flip` text hover) ·
cart link with live count (`cart-total`). Recolors per section via
`[nav-dark]`/`[nav-light]` ScrollTrigger markers (`.dark` class), slides away
(`.pull-up`, `translateY(-100%)`) when the footer enters, participates in
`mix-blend-mode` until the blue theme flip disables it. Mobile: three 33% cols.

### Menu overlay (`.nav[data-nav]`)
Full-screen. Layers: dim `overlay` → full image panel (`bg-panel_full` with
`menu.jpg`) → two staggered `bg-panel`s → `menu-inner` containing: image column
(`menu-img_inner`, clip-wipe + parallax on open), link list (Our Shop / Home /
About us / Contact as display-size links; hovering one dims the siblings via
`.inactive`), Close button. Bottom strip (`menu-extras`): "Swing easy, Odd
Ritual, ©2025", "Cape Town, South Africa", logo, product info block. Motion:
panels drop `yPercent −101→0` stagger 0.1 @ 0.575s; links drop `−140→0`
stagger 0.05; fades land last; close retracts upward `expo.out`; Esc closes;
Lenis paused while open.

### Cart drawer (Webflow commerce right sidebar)
Nested inside the menu region on every page; Udesly bridges it to the Shopify
cart. Anatomy: header "Your Cart" + × close → `cart-list`
(`data-lenis-prevent`, `overscroll-behavior: contain`) of items (thumb, name,
option list, quantity number input, Remove) → footer: Subtotal ("R 0.00 ZAR"),
shipping note, web-payments buttons + "Checkout" (into Shopify checkout).
Empty state is the site's best copy: *"Your cart is empty / **Come on, treat
yourself. You deserve it** / Shop now."* `/cart` URL renders the home template
(drawer-first cart UX; an `.is-cart-page` CSS hook exists as fallback).

### Custom cursor
Fixed pill (label text + logo svg), `quickTo` follow, flips to the pointer's
other side near the right/bottom 10% of the viewport. `[data-cursor]` supplies
labels; `[data-easteregg]` swaps in a secret label only near the right edge.
Desktop/pointer-fine only.

### Preloader (first visit per session)
Black full-screen; logo fades in (sine), background panel + image stack
clip-wipe down with a −30%→0 parallax settle, then everything wipes up and
away; 2s total. Uses the same `menu.jpg` imagery as the menu overlay.
**10 seconds after first load, the newsletter popup auto-opens.**

### Newsletter popup (`.signup-popup`)
Split box: image column (2 imgs) + content ("Become part of the Odd ritual
community.", embedded Klaviyo form styled to brand — uppercase input,
underline-only field, blue autofill), close with icon-slide hover. Opened by
`[sub-trigger]` elements or the 10s first-visit timer (`body.show-signup`).

### Easter-egg overlay (`.easter-egg`)
Hidden full-screen brand flash — image (`footer-easter-egg.jpg`) + wordmark +
tagline + `ORGC©25`. Any `[easter-trigger]` hover restarts its timeline
(reverse on leave). Sprinkled across most pages; disabled mid-scroll
(`.lenis-scrolling [easter-trigger] { pointer-events: none }`).

### Footer (3 variants)
Light (home) / dark (shop, PDP, policies) / `about-footer` (100dvh, About).
Shared anatomy: logo + tagline → **Site Index** (Shop now / Home / About us /
Contact Us — links with icons + rolling hovers and per-link image reveals via
hidden `[footer-img_item].show`) → **Social** (Instagram) → **Get in touch**
(email, phone) → Klaviyo signup → legal (4 policies, "All rights reserved _
ORGC©2025", "Website by malvah"). Dark/About variants add the **full product
list with the image-follow panel** — a preview image that clip-wipes in,
tracks cursor Y (`quickTo`, clamped to list bounds), and swaps imagery per
hovered row (38 triggers, all preloaded).

### Dead weight
An empty `styleguide_guide_wrap` section ships on about/contact/shop — a
leftover Webflow style-guide page artifact.

## 3. Home page

Section order (with `data-scroll-overlap` overlap-stitching ×4 and 7 nav
color markers along the way):

1. **Hero slider** — full-bleed, 3 slides, each: background **video**
   (`hero-visual_el-vid`) + image fallback, dark `slide-overlay`,
   uppercase detail row, and display title. Slides: 01 "Explore our First
   Collection", 02 "A modern expression of heritage", 03 "Follow us on
   Instagram — To join the journey". Desktop chrome: numbered nav list
   (01/02/03; active item grows + underlines, hover darkens the overlay and
   can preview via popup), "Scroll" indicator, "Next" button. Mobile: slide
   number + swipe (Hammer). Slide changes are directional clip wipes with
   ±10% image counter-parallax. First dot is auto-clicked after every Barba
   nav to reset state.
2. **Dark statement band** (`dark-section_wrap`, nav flips light) — giant
   logomark + h3: *"Born from a shared love of the game, rooted in a vision of
   authenticity and creativity."*
3. **CTA row** — three `cta-block` cards: "Our Products → Shop now",
   "Our Story → Read more", "Our Community". Each: image with overlay,
   uppercase detail label, underline sweep, and a sticky-following
   `cta-hover_el` label pill on desktop.
4. **Made-locally + product marquee** — statement block ("ORGC©2025 —
   Designed and made locally / Cape Town / South Africa / Our country is rich
   in culture, diversity, and heritage — producing locally is hard…") beside
   the **draggable infinite product marquee**: doubled card list (114 imgs)
   auto-scrolling via `gsap.ticker`, grabbable (Observer), cards scale 0.95
   while pressed, Lenis pauses during drag, product codes + prices on cards.
5. **Lookbook slider** (`hero-slider is-large`) — full-bleed editorial slider
   labeled `ORGC_26`, slide indicator (`01`), prev/next buttons, mobile
   "Swipe" eyebrow.
6. **Community section** — "Giving back" intro (*"We never set out to be just
   a golf brand. Odd Ritual is as much about culture as…"*) then "Our greater
   community": four partner rows with image, name, blurb, and "Visit Website"
   links — **Fairways to Africa** (bespoke golf travel), **StartWell
   Foundation** (children's charity), **242**, **Running Late Club** (run
   community). Hovering rows clip-wipes in floating imagery (`.is-giving`).
7. **Light footer** → easter-egg overlay → signup popup.

## 4. About page

1. **About-hero** (dark) — big logo, small intro copy + name in alt type, and
   headline "A modern expression of heritage". Hover choreography: hovering
   the intro fades the headline out, turns the intro white, and dims every
   `[h-fadeout]` element page-wide via `body:has(.about-head_wrap:hover)` —
   the page visibly "makes room" for reading.
2. **Image band** with eyebrow label.
3. **Editorial body** — offset image pair (`about-img_right` 4.35/6,
   `about-img_left` 4.35/2.8) with `[img-scroll]` parallax (×3 on page); h3
   *"Informed by tradition, within the context of today's culture, we want…"*;
   the **flickthrough** hover zoetrope (stacked photos cycling every 300ms on
   hover, auto on mobile); **vision section** with the `(     our story     )`
   eyebrow; the **sticky story stack** — five `sticky-item` panels, each
   sticky at 100svh, stacking over one another (images 6.5/3.75, final panel
   free-aspect); two **floating scroll-flip SVG logos** (frame-flip scrubbed
   to scroll + parallax).
4. **"Explore our range"** → the 100dvh `about-footer` (dark): full product
   list with the image-follow panel (38 triggers), all footer columns, mobile
   substitute image. Then signup popup. (No easter-egg section on this page.)

## 5. Contact page

Single split-screen composition (`contact-section`):
- **Left column:** `contact-imgs_scroll` — a scrolling stack of 4/5 images.
- **Right column:** `contact-info_layout` — `position: sticky; top: 0;
  height: 100vh`, so it floats motionless while imagery streams past.
  Contents top-to-bottom: "Contact Us" label, `mailto:hello@oddritualgolf.com`,
  `tel: 076 207 3387`, "Join our community" + Instagram, then an inline
  mini-footer (`contact-footer_el`): ORGC©2025, wordmark, tagline, ORGC©25.
- **No standard footer** — the sticky column doubles as one. One image-hover
  reveal, easter-egg overlay, signup popup. All scroll interest is CSS-sticky
  composition, not GSAP.

## 6. Shop page (`/collections/all`)

1. **Shop intro** — "All Products" + "COLLECTION 01 & 02" + "ORGC©️2026"
   (right-aligned column on mobile).
2. **Product grid** — every card: primary image + second image revealed on
   hover (`product-hover_img`), hover overlay + info fade, SKU-style code,
   title, ZAR price, and a `cta-cursor_wrap` label pill (CSS-sticky at 50svh
   *and* cursor-Y-following) — 38 of them. `count-items` JS auto-numbers the
   grid and writes the zero-padded total (40 items).
3. **Dark band → Pillars section** — the site's signature beat: a
   ScrollTrigger on the dark section's exit **flips the whole page electric
   blue `#050FFF`** (body bg, text, nav blend-mode; 0.2s, reversed on
   scroll-back). Inside: "Community / Creativity / Craft" pillars, sticky
   full-height blue title (`top:0`, 100vh), sticky icon column (`top:50%`),
   `.show`-fade reveals, tuned overlap transitions
   (`data-scroll-overlap-pillar` ×2: start `top 30%`, `yPercent 40`).
4. **Full-bleed image band** → dark footer → easter-egg → signup popup.

## 7. Product page (`page-single`)

1. **Two-column layout:**
   - **Left (`u-column-7`):** featured image + CMS list of additional images
     (4/5 ratio), mobile "Swipe" eyebrow.
   - **Right (`u-column-5`, sticky `top: 6.5rem`, 100vh):** title/price split
     (8/4) — e.g. "Heritage Rope Cap [Black]" / "R 750.00"; short description;
     **accordions** "Garment Details" and "Wash Care" (Shopify metafield
     rich-text; plus/minus icon built from two `toggle-line`s, the vertical
     one rotating; JS enforces single-open); **add-to-cart** — Webflow
     commerce form with size pills for sized garments (selected = brand blue,
     unavailable = struck-through at 0.2 opacity) or a custom `size-toggle`
     dropdown, out-of-stock and error states.
2. **Lookbook slider** (`hero-slider is-large`) — full-bleed product
   editorial with prev/next.
3. **"complete the look"** (`extras-section`) — three related products as
   CTA blocks with hover images, overlays, codes, prices.
4. Dark footer → easter-egg → signup popup.

## 8. Utility pages

- **Policies** (privacy/terms/refund/shipping): full-bleed image band +
  rich text + dark footer + overlays. Minimal.
- **`/cart`:** renders the home template; cart lives in the drawer.

## 9. Commerce & data layer

- Shopify store (ZAR, en-ZA), vendor "oddritual", canonical + OG + JSON-LD
  product schema, Twitter cards.
- **Udesly adapter** (`udesly-shopify.min.js`) translates Webflow commerce
  markup into live Shopify cart operations — and is **re-injected fresh on
  every Barba navigation**, plus wholesale re-init of theme sections, cart,
  nav active-states, filters, and predictive search (`resetShopify()`).
- Klaviyo: onsite tracking, embedded forms (footer + popup), reviews hooks.
- Web payments (accelerated checkout buttons) enabled in the cart drawer.

## 10. Assessment

**Strengths:** total commitment to one reveal motif (the clip wipe) makes a
lot of motion feel coherent rather than busy; the numbered/stamped/coded
brand voice extends into interactive details (auto-numbered grids, SKU codes
as UI); scroll composition leans on cheap, robust CSS sticky; the blue theme
flip and the footer image-follow are genuinely memorable; personality lives
in micro-copy (empty cart, easter eggs, cursor labels).

**Weaknesses:** production motion layer hosted on CodeSandbox; ~10 external
script origins; jQuery + webflow.js + 5 GSAP plugins + Hammer + Lottie
payload; no reduced-motion support; no teardown between Barba navs (window
listeners and ScrollTriggers accumulate); a11y gaps (decorative `h2`s, no
focus management in overlays); dead styleguide markup shipped on three pages.

*For what LF should borrow, see §7 of the motion analysis doc.*
