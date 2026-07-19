# Shop Categories

**Date:** 2026-07-19
**Status:** Approved (design walkthrough approved in session; this document is the binding record)
**Scope:** Shopify catalog restructuring (6 → 12 products, 8 collections) + a new category nav strip on `theme/sections/lf-shop-grid-v2.liquid`.

## 1. Problem

The shop page has no category structure — it's a single flat grid of all 6 products pulled from `/collections/all`. The brand's eventual range spans multiple garment types (shirts, hoodies, hats, jackets, jeans, pants, shorts, accessories), but today garment type (Tee vs Hoodie) is buried as a variant option *inside* each product rather than being a filterable, browsable dimension. There's no way for a shopper to jump straight to "Hoodies" or see what's coming next in "Jackets."

## 2. Decision

Introduce 8 categories — **Shirts, Hoodies, Hats, Jackets, Jeans, Pants, Shorts, Accessories** — backed by Shopify's native `product_type` field and 8 automated collections, surfaced as a pill nav bar on the shop page. All 8 are created now, even though only Shirts and Hoodies will have products at launch, so the taxonomy is "ready to go": tag a future product into `Jackets` and it appears in that collection and its pill goes live automatically, with zero further theme work.

This requires splitting the existing 6 products (each bundling a Tee-Black/Tee-White/Hoodie-Grey variant trio) into 12 — 6 Tee products and 6 new Hoodie products — because a product can only carry one `product_type`, and Hoodies needs to be its own browsable category.

## 3. What changes (and what doesn't)

### 3a. Category taxonomy & storage

Stored on the standard Shopify `product_type` field, one value per product, exactly one of: `Shirts`, `Hoodies`, `Hats`, `Jackets`, `Jeans`, `Pants`, `Shorts`, `Accessories`. No new metafield definition needed — `product_type` is what Shopify's automated collection rules and admin filtering already understand natively.

### 3b. Collections

8 new automated collections, rule `Product type` is equal to `<Category>`:

| Category | Handle |
|---|---|
| Hats | `hats` |
| Shirts | `shirts` |
| Hoodies | `hoodies` |
| Jackets | `jackets` |
| Jeans | `jeans` |
| Pants | `pants` |
| Shorts | `shorts` |
| Accessories | `accessories` |

(Table order matches the nav pill order defined in §3d.)

`/collections/all` (Shopify's built-in virtual collection) is unchanged and remains the "All" pill's target. No new theme template is needed — every Shopify collection URL renders through the single existing `theme/templates/collection.json` (→ `lf-shop-grid-v2` section) regardless of handle, so all 9 pill destinations (All + 8 categories) already share one generic page.

### 3c. Catalog split (6 → 12 products)

For each of the 6 existing graphics (`casamigo`, `fluerdelis`, `magnolia`, `maria`, `sig`/"No Weapon", `skull`):

**Tee product (existing, restructured in place — handle and title unchanged):**
- `product_type: "Shirts"`
- Variant option renamed from `Garment` (3 values) to `Color`, now 2 values: `Black`, `White` (the `Hoodie — Grey` value and its 5 variants are removed)
- `Size` option unchanged (S/M/L/XL/XXL) — 10 variants total per product
- Price unchanged, $75
- Keeps its 2 Tee images (Black, White); the Hoodie — Grey image is removed from this product's media
- Metafields (`lfc.story`, `lfc.edition_size`, `lfc.drop_accent`) unchanged

**Hoodie product (new):**
- Handle: `<slug>-hoodie` (e.g. `casamigo-hoodie`)
- Title: `<Title> Hoodie` (e.g. "Casamigo Hoodie")
- `product_type: "Hoodies"`
- Single option: `Size` (S/M/L/XL/XXL) — 5 variants, no color option (Hoodie only ships in Grey for now — adding hoodie colors is future scope)
- Price $150 (unchanged from today's Hoodie — Grey variant price)
- One image: the existing Hoodie — Grey mockup file, reassigned from the old bundled product to this new one
- Metafields: `lfc.story`, `lfc.edition_size` (150), `lfc.drop_accent` all copied verbatim from the graphic's Tee product — same graphic, same brand story, just a different garment
- Tag: `drop-001`, same as every other Drop 001 product

**Product codes:** neither product type needs an explicit `lfc.code` metafield. `theme/snippets/lf-code.liquid` already falls back to a handle-derived code (`LF_<HANDLE-WITH-UNDERSCORES-UPCASED, TRUNCATED TO 10 CHARS>`) whenever `lfc.code` is blank, which is the case for all current products. Because the Tee keeps handle `casamigo` (→ code `LF_CASAMIGO`) and the Hoodie gets handle `casamigo-hoodie` (→ code `LF_CASAMIGO_H`, truncated to 10 chars), the two automatically render distinct codes with no new metafield work.

**Net catalog after this change:** 12 active products, 2 populated categories (Shirts ×6, Hoodies ×6), 6 empty categories.

### 3d. Shop page — pill nav

A new nav strip renders inside `theme/sections/lf-shop-grid-v2.liquid`, between the existing intro header (title/stamp) and the product grid. Order, left to right:

**All · Hats · Shirts · Hoodies · Jackets · Jeans · Pants · Shorts · Accessories**

- "All" links to `/collections/all`; each category links to `/collections/<handle>` from the table above.
- The current page's category is visually marked active (underline, matching the existing `.lf-community__link`-style neon-underline treatment used elsewhere in the theme) and is not itself a link.
- A category with `collections['<handle>'].products_count == 0` renders disabled (no `<a>`, greyed via CSS opacity, same visual language as "Coming Soon" tags used nowhere else yet in this theme — a small new style, not a new component) with a "Coming Soon" suffix label. This is computed live from `products_count` on every page render, so a category flips from disabled to a real link automatically the moment it holds a product — no template edit required later.
- This nav renders identically on `/collections/all` and all 8 category pages, since they all share the one `lf-shop-grid-v2` section instance via `collection.json`.

### 3e. Navigation elsewhere

Unchanged. The site header/footer "Shop" link continues to point at `/collections/all`. The pill bar is the only new navigational surface, and it's scoped to shop/category pages only.

## 4. Known accepted compromises

- Splitting live products changes URLs: the 6 new Hoodie products get brand-new handles/URLs (`<slug>-hoodie`), and the old bundled Tee+Hoodie product's "Hoodie — Grey" variant deep-link stops resolving (falls back to the product's default variant). Acceptable because the storefront is still password-gated pre-launch — no real customer traffic or bookmarks exist yet.
- Hoodie ships in one color only (Grey) for now; adding a Color option to Hoodie products is deferred until a second hoodie colorway actually exists (YAGNI).
- 6 of 8 categories launch empty and stay in "Coming Soon" state until real products are tagged into them — this is the intended, designed state, not a gap to close as part of this work.

## 5. Reversibility

Categories are just `product_type` + collection rules — re-tagging a product's type or deleting a collection is a normal admin action, not a structural theme change. The pill nav strip is a contained addition inside one section file; removing it reverts the shop page to today's plain grid with no other side effects.

## 6. Verification

- Shopify admin: 12 active products exist, 6 with `product_type: Shirts` (10 variants each), 6 with `product_type: Hoodies` (5 variants each); 8 collections exist with the correct handles and automated rules; `shirts` and `hoodies` collections each show 6 products, the other 6 collections show 0.
- Dev-theme render of `/collections/all`, `/collections/shirts`, and `/collections/hoodies`: pill nav present with the specified 9 entries in order, correct pill marked active per page, Shirts/Hoodies pills link correctly and show the right 6 products each.
- Dev-theme render of `/collections/hats` (or any of the other 5 empty categories): renders without error, "Coming Soon" pill state visible in the nav (from any category page), grid area shows Shopify's default empty-collection state.
- Spot-check `theme/snippets/lf-code.liquid` output on a Tee PDP vs. its corresponding Hoodie PDP — codes must differ.
- No console errors on any of the above pages.
