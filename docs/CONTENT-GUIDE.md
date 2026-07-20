# Content Guide — editing text, images, and products without code

Everything on this site can be edited from Shopify admin — no code, no git,
no waiting on a developer. This doc maps "I want to change X" to exactly
where to click. **Read the [Sync Safety](#sync-safety-read-this-first)
section before making edits** — it's short and prevents your changes from
ever getting overwritten.

Two tools, two different kinds of content:

| Tool | Edits | Where |
|---|---|---|
| **Theme Editor** | Page layout, section text/images, blocks (slides, cards, partner rows) | Admin → Online Store → Themes → **Customize** |
| **Product admin page** | Per-product fields (story line, edition size, garment details, wash care, product code) | Admin → Products → *(a product)* |

## Sync Safety — read this first

The live theme's content (whatever you edit in the Theme Editor) and the
git repo (what a developer pushes) are two separate copies. **A code push
overwrites the live theme's settings with whatever's in git — including any
Theme Editor edits made since the last push, unless someone pulls them into
git first.**

In practice:
- Routine content edits (swapping an image, tweaking a sentence, adding a
  lookbook slide) are safe to make anytime in the Theme Editor.
- **Before any code change ships** (a new feature, a bug fix), tell the
  developer/Claude first if you've made Theme Editor edits recently, so they
  get pulled into git before the push. See `RUNBOOK.md`'s "Content sync"
  section for the exact pull command.
- If you're about to do a big content editing session, it doesn't hurt to
  mention it — "heads up, editing the shop page today" — so nobody pushes
  code over it by accident.

## How the Theme Editor works (30 seconds)

1. Admin → Online Store → Themes → **Customize** (or jump straight to a page
   via the dropdown at the top — Home / Story / Contact / a product / a
   collection).
2. Click any section on the live preview (or find it in the left sidebar
   list) → a settings panel opens on the right.
3. Edit text fields, click an image swatch to replace an image, or use
   **Add block** / the trash icon to add/remove repeatable items (slides,
   cards, partner rows).
4. Click **Save** (top right). Changes go live immediately.

---

## Home page

Customize → select **Home page** from the page dropdown. Sections top to
bottom:

- **Hero slider** — up to 4 slides (Add block to add more, max 4). Each
  slide: kicker, heading, CTA label, link, image. Autoplay speed is a
  section-level setting (0 = off). *Image: full-bleed, landscape, high-res
  (2000px+ wide) — it's cropped to cover the whole screen.*
- **Statement band** — one big statement line (textarea).
- **CTA row** — up to 3 cards (max 3). Each: eyebrow, title, cursor label,
  link, image. *Image: landscape, roughly 4:3.*
- **Marquee** ("made in NOLA" strip) — one statement line. The scrolling
  product cards below it pull automatically from your product catalog
  (first 12 products) — nothing to edit here per-product.
- **Lookbook slider** — up to 6 slides (max 6). Each: image, caption.
  *Image: landscape, high-res — full-bleed cover crop.*
- **Community** ("Giving back") — title, body, up to 6 partner rows (max
  6). Each: image, name, blurb, link. *Image: roughly 4:3.*
- **Email signup block** — one prompt line above the signup form.

## Story page

Customize → **Story page**.

- **Story hero** — one intro line (the title itself is the page's own
  title, edited in Admin → Online Store → Pages → Story).
- **Editorial band** — eyebrow, body copy, two offset images (Wide image ≈
  4.35:4.6, Tall image ≈ 4.35:5.2), plus up to 3 flickthrough images
  (roughly 4:3, used for a hover-cycling effect).
- **Sticky story stack** — up to 5 panels (title, body, image each).
  *Image: wide/landscape, roughly 6.5:3.75.*
- The full-height footer at the bottom is the same footer section as
  everywhere else — see [Footer](#sitewide-chrome) below.

## Contact page

Customize → **Contact page**.

- Email, body copy, Instagram URL, and up to 4 scrolling images (roughly
  4:5 each — portrait).

## Shop page

Customize → **Shop page** (or visit `/collections/all` and Customize from
there).

- **Shop grid** — no settings here; it lists every product in your
  catalog automatically, with live price/image/title. To change what's in
  it, edit your products (Admin → Products) — not this section.
- **Categories** — the pill row above the grid (Hats, Shirts, Hoodies,
  Jackets, Jeans, Pants, Shorts, Accessories) is fixed in
  `theme/sections/lf-shop-grid-v2.liquid`, not merchant-editable via the
  Theme Editor. A category shows live (as a link) once its Shopify
  collection has at least one product; otherwise it renders greyed with a
  "Coming Soon" label automatically — no theme edit needed to activate a
  category, just tag a product with that `Product type` in the admin. To
  add a 9th category: create a new automated collection in admin (rule:
  `Product type` equals `<name>`), publish it to Online Store, then add
  one `Label|handle` entry to the `lf_categories` list in
  `lf-shop-grid-v2.liquid`.
- **Image band (before pillars)** — leave the image blank for the dark
  divider look, or add one for a full photo band. Optional stamp line.
- **Pillars** ("What we stand on") — sticky title + up to 3 pillars
  (title + body each). This is the section that triggers the neon flood
  effect as you scroll through it — no settings control that, it's
  automatic.
- **Image band (after pillars)** — same as above, typically set to a real
  photo.

## Product pages (every product)

Two places to edit each product:

**1. Product admin page** (Admin → Products → click a product) — the
per-product fields, found in the **Metafields** section of the page:
- **Story** — short italic line shown under the price on the PDP.
- **Edition Size** — shown as "Edition of N." Leave blank to hide it.
- **Garment Details** — the PDP's first accordion. One idea per line.
  Leave blank and it falls back to a shared default (see below).
- **Wash Care** — the PDP's second accordion, same behavior.
- **Product Code** — shown in parentheses, e.g. `(LF_SKULL)`. Leave blank
  and it's auto-generated from the product's handle.

Also on this page: title, description, price, images (first image is the
gallery order on the PDP, all shown stacked), variants (Garment × Size).

**2. Theme Editor, on any product page** — Customize while viewing a
product:
- **Main product section** — the *fallback* text for Garment Details and
  Wash Care, used only when a product's own metafield (above) is blank.
  Edit this once here and it applies to every product that hasn't set its
  own.
- **Lookbook slider** — same as Home's, but this instance is shared across
  every PDP (up to 6 slides, max 6).
- **Related products row** ("complete the look") — no settings; it
  auto-picks 3 other products from your catalog.

## Sitewide chrome

These appear on every page and are edited once, not per-page. Customize →
scroll to the bottom of the left sidebar for **Header** and **Footer**, or
look for the standalone entries listed below.

- **Header** — logo/cart/menu button; no text settings (styling only).
- **Menu overlay** — 3 configurable links (label + URL each) shown when the
  menu opens.
- **Footer** — Instagram URL, contact email, contact page URL, and a
  full-height toggle (used automatically on the Story page, off
  everywhere else — don't touch this toggle unless you know why).
- **Newsletter popup** — appears automatically ~10s into a first visit;
  edit its copy in its own section in the Theme Editor.
- **Easter egg** / **Preloader** / **Cart drawer** — visual/behavioral,
  no merchant-facing text settings.
- **Password page (teaser)** — Customize → Password page. Manifesto line,
  signup prompt, show/hide the email signup, Instagram URL. This is the
  gate visitors see until drop day — the "Members" link on it is how you
  or press get through early with the storefront password.

## Policy pages

Admin → Settings → Policies. Write/edit Privacy Policy, Refund Policy,
Terms of Service, Shipping Policy here — they're automatically styled to
match the site (dark, neon title, readable body) once you save them; no
Theme Editor step needed.

## Images — quick reference

Most image slots crop-to-fill (`object-fit: cover`), so exact pixel
dimensions matter less than **aspect ratio** and **resolution** (2000px+ on
the long edge for anything full-bleed). If in doubt, landscape/wide photos
work for hero-style slots; portrait works for the Contact page and
marquee/product cards.

| Slot | Shape |
|---|---|
| Hero slides, lookbook slides, image bands | Landscape, full-bleed |
| CTA row cards, community rows | ~4:3 |
| Contact page images, product images | ~4:5 (portrait) |
| Story editorial "wide" image | ~4.35:4.6 |
| Story editorial "tall" image | ~4.35:5.2 |
| Story sticky stack panels | ~6.5:3.75 (wide) |

## A few guardrails

- **Block limits are hard caps**, not suggestions: Hero (4 slides), CTA row
  (3 cards), Community (6 partners), Lookbook (6 slides). "Add block" will
  simply stop being available at the limit — that's expected, not a bug.
- **Don't delete a section instance** (the "Shop grid," "Pillars," etc.
  entries in the sidebar) unless you mean to remove that part of the page
  — layout structure lives in these instances, not just their content.
  If you're not sure, ask before removing a whole section.
- Fields left blank generally have a sensible fallback (hidden entirely,
  or a shared default) rather than showing broken/empty markup — but an
  image field left blank on a slot that expects one (e.g. a lookbook
  slide) will show nothing where the image should be, so don't leave a
  block half-filled.
