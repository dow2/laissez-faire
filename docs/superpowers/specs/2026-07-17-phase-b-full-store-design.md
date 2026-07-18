# Laissez-Faire Leisure Club — Phase B: Full Store Design

**Date:** 2026-07-17
**Status:** Approved (brainstorm session with visual companion, 2026-07-17)
**Repo:** `/Users/dow/laissez-faire` · **Store:** `1xiwxi-yy.myshopify.com` · **Domain:** `laissezfaireleisureclub.com` (live)
**Builds on:** `docs/superpowers/specs/2026-07-16-laissez-faire-site-design.md` (Phase A, shipped as `v0.1.0-teaser`) — visual system, tokens, typography, and motion principles from that spec carry forward unchanged unless amended here.

## 1. Context and scope

Phase A shipped the neon teaser on the password page; the store is live but gated. Phase B builds the full store behind that gate. It is split into two sub-phases, each with its own implementation plan:

- **B1 (this spec's primary scope):** every page built and working — hero slider (functional), shop grid, split PDP, story page, cart drawer, nav/footer, products created with placeholder photography, core motion (Lenis, reveals, drawer, hover states).
- **B2 (follow-up plan, scoped here only as a boundary):** signature motion polish — Barba lights-out page transitions, split-text staggers, scroll-linked glow ramps, electrical hover buzz, cursor-follow footer, Observer-driven slider gestures.

**Launch mode:** the store stays password-gated until drop day. Flipping the password off + the Klaviyo announcement is an operator action, not part of any build phase.

**Brand amendment since Phase A:** name is "Laissez-Faire Leisure Club" (subtitle in the lockup); the ornate fleur-de-lis crest (`theme/assets/lf-crest.png`) is the primary logo mark; favicon set already shipped.

## 2. Catalog (Drop 001)

Six products, one per graphic, using the mockup photography in `~/Desktop/LF Site Clothing Mockups/` as placeholders (real shoot swaps in later via admin only, zero code):

| Product | Graphic source | Placeholder images |
|---|---|---|
| Maria | neon Guadalupe | maria-{black-mockup, greyhood, white-mockup}.jpg |
| Skull | sugar skull + fleur | skull-{black-mockup, greyhood, whitemockup}.jpg |
| Fleur-de-Lis | ornate crest | fluerdelis-{black-mockup, greyhood, whitemockup}.jpg |
| Casamigo | casamigo graphic | casamigo-{black-mockup, greyhood, whitemockup}.jpg |
| Magnolia | magnolia graphic | magnolia-{black-mockup, greyhood, whitemockup}.jpg |
| Signature | script wordmark | sig-{black-mockup, greyhood, whitemockup}.jpg |

- **Variant structure:** one product per graphic. Option 1 "Garment": `Tee — Black`, `Tee — White`, `Hoodie — Grey`. Option 2 "Size": S, M, L, XL, XXL. (15 variants/product.)
- **Pricing:** tees $75, hoodies $150 (premium positioning, confirmed).
- **Tags/metafields:** tag `drop-001`; metafields `lf.story` (rich/multiline text — the script story line + description copy), `lf.edition_size` (integer), `lf.drop_accent` (color, defaults to house ice-blue) — the Phase A spec's metafield model, now actually consumed.
- Products are created in the store as part of B1 (CLI/admin), photography attached per garment variant.

## 3. Theme surface

Same repo/theme, extended in place. `layout/theme.liquid` becomes the LF shell: fonts snippet, `lf-tokens.css`, favicon links (done), header/nav, cart drawer, footer, `content_for_layout`. Skeleton's stock sections are replaced by LF sections; any stock section/template orphaned by rewiring is **deleted in the same commit** (Phase A Task-6 lesson as standing policy).

New/rewritten sections (each self-contained: markup + `{% stylesheet %}` + `{% javascript %}` + `{% schema %}`):

| Section | Purpose |
|---|---|
| `lf-header` | Minimal nav — Shop, Story, cart trigger (crest-badged count). Mobile: full-screen overlay menu in the neon voice |
| `lf-hero-slider` | Full-screen numbered slider (01/02…), full-bleed image slides + darkening overlay + display-text line, persistent wordmark lockup, editable via section blocks, auto-advance + buttons (B1) / gestures (B2) |
| `lf-featured-story` | Alternating image/text graphic features (Maria, Fleur-de-Lis at launch), varsity title + script story + View link |
| `lf-drop-grid` | Product grid teaser on home (remaining drop) + "Shop the Full Drop" |
| `lf-culture-strip` | 3-up culture imagery (curated from the Midjourney folder), script captions |
| `lf-email-block` | Klaviyo-tagged signup (same `teaser-list` form pattern; documented new-customer-only tag limitation carries over) |
| `lf-footer` | Oversized masked wordmark, link columns (Shop, Story, Contact/IG, policies), crest seal |
| `lf-collection` | Shop grid: 2-col mobile / 3-col desktop, hover swaps to alternate colorway image, varsity name, price range |
| `lf-product` | Split PDP: image slider left (per-variant imagery, variant selection swaps slider), buy column right (varsity H1, price, edition line, story, garment selector, size selector, Add to Cart, accordion: Materials & Care / Sizing / Shipping) |
| `lf-related` | Related-products row with hover-swap (Odd Ritual pattern) |
| `lf-story` | Manifesto page: refined manifesto, four pillars, culture imagery, crest seal |
| `lf-cart-drawer` | Right-side dark drawer: line items + thumbs, quantity steppers, subtotal, glowing Checkout → stock Shopify checkout. Rendered from `theme.liquid`; `/cart` page kept as functional fallback |

Templates rewired: `index.json`, `collection.json`, `product.json`, `page.story.json` (new alternate template), `cart.json` (fallback page). Password page/teaser remains untouched.

## 4. Motion

**B1 ships:** Lenis smooth scroll (vendored); hero slider crossfade + overlay/text animation on slide change; simple scroll reveals (opacity/translate via IntersectionObserver or GSAP ScrollTrigger — implementer's choice, but GSAP is vendored in B1 either way so B2 builds on it); cart-drawer slide; hover glow states. One easing curve site-wide (`--lf-ease`). All motion inside `prefers-reduced-motion` guards.

**B1 also fixes:** the Phase A global reduced-motion rule (`* { animation-duration: .01ms !important; }` in `lf-tokens.css`) is narrowed to scoped selectors so it stops fighting future JS-driven motion — the reduced-motion *behavior* (no flicker, no parallax, instant reveals) is preserved via explicit per-component guards. This was flagged in Phase A code review as a B-phase prerequisite.

**B2 boundary (not in B1):** Barba.js lights-out page transitions, split-text heading staggers, scroll-linked glow ramps, electrical hover buzz, cursor-follow footer image, Observer slider gestures. Vendoring Barba happens in B2.

## 5. Assets

- Product placeholder images: mockup JPGs resized to ≤1600px, compressed, uploaded as product media mapped per garment variant.
- Culture strip: 3–6 curated images from `~/Documents/Desktop - Operation's MacBook Pro (2) - 2/Useable Filler Images/` (second lines, masking imagery), resized/compressed into theme assets or Shopify files.
- Wordmark/crest masks: existing `lf-wordmark.png`, `lf-crest.png` reused everywhere (nav badge, footer, story seal).
- GSAP + Lenis: pinned versions vendored into `theme/assets/` (no CDN runtime dependencies — the Odd Ritual anti-lesson remains policy).

## 6. Quality gates (B1 exit criteria)

1. `shopify theme check` clean (baseline: 3 known RemoteAsset warnings on Google Fonts).
2. Dev-store review behind the gate: full flow browse → PDP → variant switch → add to cart → drawer → checkout with a Shopify test order; 375px pass on every page; reduced-motion pass on every page.
3. Lighthouse mobile on home + PDP: performance ≥ 85, accessibility ≥ 90.
4. Products verified in admin: 6 products × 15 variants, correct prices, images per variant, metafields populated.
5. Branch `feat/phase-b1`, subagent-driven execution, merged to master + tagged `v0.2.0-store` on completion. Live password page must be byte-identical before/after merge (teaser untouched).

## 7. Non-goals (B1)

B2 motion polish (listed above); real product photography; blog/journal; customer accounts; multi-currency/i18n beyond defaults; search page styling beyond functional; Klaviyo flows beyond the existing capture (announcement flow is operator work in Klaviyo's UI); payments activation (operator, in admin); drop-day password flip (operator).

## 8. Open items

1. **Payments** — Shopify Payments activation required before real checkout works on drop day (operator; test orders in B1 use Shopify's test gateway/Bogus).
2. **Edition sizes** — `lf.edition_size` values TBD by operator before launch; B1 seeds a placeholder (150) per product, editable in admin.
3. **Culture-strip image curation** — user picks favorites from the Midjourney folder during B1 review, or delegates the pick to the implementer's judgment with review at the checkpoint.
4. **Story copy** — B1 drafts product stories + manifesto page copy from the brand brief's voice ("Won't Bow Down…" register) as editable metafield/section content; user reviews in admin/theme editor.
