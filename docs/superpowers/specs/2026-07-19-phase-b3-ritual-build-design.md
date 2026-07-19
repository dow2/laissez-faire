# Phase B3 — "The Ritual Build" Design Spec

**Date:** 2026-07-19
**Status:** Approved (design walkthrough approved in session; this document is the binding record)
**Predecessors:** B1 store (`v0.2.0-store`), B2 motion layer (`v0.3.0-motion`)
**References:** `docs/reference/oddritual-motion-analysis.md`, `docs/reference/oddritual-site-teardown.md`

## 1. Goal

Rebuild Laissez-Faire to **full structural parity with oddritualgolf.com** —
every section, page, and interaction system on Odd Ritual's site gets an LF
equivalent — rendered entirely in the shipped **Neon Nights** identity.
Filler copy and placeholder imagery fill any content gap; every filler item is
marked `<!-- FILLER -->` in source for later swap.

The site should read as *"Laissez-Faire leveled up,"* never *"Odd Ritual
clone"*: OR's skeleton, LF's skin, voice, and signature effects.

## 2. Translation rules (locked)

| Odd Ritual | Laissez-Faire equivalent |
|---|---|
| Electric-blue page flood `#050FFF` | **Neon flood** — body floods LF neon (`--lf-neon-core` family) with glow bloom; reverses on scroll-back |
| `ORGC©25` / `ORGC_26` stamps | `LFLC©26` / `LFLC_26` stamps |
| SKU codes `(OR_CAD_N)` | `(LF_<GARMENT>_<NN>)` codes, one per product, defined in B3.1 voice pass |
| "Cape Town, South Africa" locality | "New Orleans, Louisiana" |
| Menu sign-off "Swing easy, Odd Ritual, ©2025" | "Laissez les bons temps rouler — LFLC ©26" |
| Clip-wipe reveal motif | Adopted **for imagery only**; text reveals stay letter-ignite; page transitions stay electrical surge |
| White editorial base / light footer | Night-black base everywhere; footer variants are *night* and *full-height night* (no light mode) |
| PP Neue Montreal + PP Editorial | Existing LF display + script fonts (no font changes) |
| Golf community partners | 4 filler NOLA culture orgs |
| Webflow/jQuery/Udesly/CDN stack | Existing self-hosted vanilla stack; **CustomEase is the only new vendor** |

**LF signatures kept (OR has no equivalent — they stay):** electrical surge
transitions with repeat-nav trim, letter ignite on headings, hardened cart
drawer (restyled; also openable from the menu overlay), teaser page
(untouched, Barba-free, still the only public surface until drop day).

## 3. Architecture

- **`lf-chrome.js` (new):** global systems — menu overlay, preloader, cursor,
  newsletter popup, easter egg, footer image-follow — as `LF.init.*` registry
  inits with `LF.teardown` cleanup, dispatched by the existing `lf-motion.js`
  on load and after every Barba swap. Same idempotency contract
  (`data-lf-bound` guards) as `lf-sections.js`.
- **`lf-sections.js`:** keeps page-section behaviors; gains the new section
  inits (hero slider v2, marquee, pillars/flood, sticky stacks, flickthrough,
  accordions, grid numbering). If it exceeds ~600 lines, split by page group.
- **Vendors:** add `CustomEase.min.js` 3.13.0 (self-hosted, pinned, ~2KB).
  **No** Observer re-add, no jQuery/Hammer/Lottie. Marquee drag = native
  Pointer Events. Eases registered once in `lf-motion.js`:
  `lf-ease-1` (`M0,0 C0.15,0 0.15,1 1,1`), `lf-ease-3`
  (`0.65, 0.01, 0.05, 0.99`), CSS hover bezier `cubic-bezier(0.32,0.72,0,1)`
  @ 400ms.
- **Liquid sections (new):** `lf-preloader`, `lf-menu`, `lf-signup-popup`,
  `lf-easter-egg`, `lf-hero-slider-v2`, `lf-statement`, `lf-cta-row`,
  `lf-marquee`, `lf-lookbook`, `lf-community`, `lf-about-hero-v2`,
  `lf-about-editorial`, `lf-about-sticky-stack`, `lf-contact-split`,
  `lf-shop-grid-v2`, `lf-pillars`, `lf-image-band`, footer rebuilt in
  `lf-footer.liquid` (variants via section settings). Retired sections leave
  the JSON templates but stay in git history.
- **CSS:** tokens stay in `lf-tokens.css`; per-section styles in
  `{% stylesheet %}` blocks (existing convention). Overlap-scroll and sticky
  compositions prefer CSS `position: sticky` over JS wherever OR does.

## 4. Sub-phase scopes

### B3.1 — Global chrome (plan 1, ships `v0.4.0-chrome`)

1. **Menu overlay:** nav "Menu" toggle (rolling-text hover) opens full-screen
   takeover: dim veil → full image panel → two staggered neon-edged panels
   dropping top-down (`yPercent -101→0`, stagger 0.1, 0.575s) → display links
   (Shop / Home / Story / Contact) dropping in with sibling-dim hover → close
   button → bottom strip (sign-off · "New Orleans, Louisiana" · crest).
   Cart link with live count opens the existing drawer. Esc closes; body
   scroll locked while open. Reduced-motion: instant show/hide.
2. **Preloader:** once per session (`sessionStorage.lfVisited`), ~2s: crest
   ignites, panels clip-wipe with parallax settle, wipes away upward.
   Reduced-motion or repeat visit: skipped (no flash). 10s after first-ever
   load, newsletter popup auto-opens (once, session-flagged).
3. **Cursor label system:** desktop-only (`min-width: 992px` +
   `pointer: fine`) label pill, rAF-lerp follow, flips side near right/bottom
   10% of viewport, labels from `[data-cursor]`, secret alternate labels from
   `[data-easter-label]` shown only near the right edge.
4. **Nav behaviors:** section-aware recolor via `[data-nav-dark]` /
   `[data-nav-light]` ScrollTrigger markers toggling a class; pull-up hide
   (`translateY(-100%)`, 300ms) when footer enters (`clamp(top 20%)`);
   markers re-created per swap and killed in the existing `beforeLeave` hook.
5. **Newsletter popup:** split image/content box, Shopify native customer
   form (same as teaser's), neon-styled inputs, close + scrim dismiss.
6. **Easter-egg overlay:** full-screen brand flash (crest, wordmark,
   `LFLC©26`, filler image) on `[data-easter]` hover, reverse on leave,
   `pointer-events: none` while actively scrolling.
7. **Footer system:** variants **night** (default) and **full-height**
   (100dvh, Story page), both containing: crest + tagline, Site Index links
   with per-link hidden image reveals, Social, Get in touch, signup form,
   legal + stamps, and the **product-list image-follow**: preview panel
   clip-wipes in on list enter, tracks cursor Y (rAF lerp, clamped to list
   bounds), swaps image per hovered product row; all 6 product images
   preloaded on init. Replaces/absorbs the B2 crest-follow.
8. **Voice pass:** stamps, per-product codes, parenthetical eyebrow
   component; applied to shared chrome now, to pages in B3.2/B3.3.

### B3.2 — Editorial pages (plan 2, ships `v0.4.1-editorial`)

**Home** (template rebuild, 7 sections in order):
1. Hero slider v2 — full-bleed, 3 slides (image now, `<video>` slot wired for
   later drop-in), dark overlay, numbered nav 01/02/03 (active grows +
   underline sweep; hover darkens scene), "Scroll" indicator, "Next" button,
   mobile swipe (Pointer Events), directional clip wipes ±10% parallax,
   slide 1 reset after each Barba nav.
2. Statement band — giant crest + brand statement (filler copy), nav-light
   marker.
3. CTA row — three cards (Shop now / Our story / Community) with image,
   overlay, eyebrow label, underline sweep, sticky cursor-following pill.
4. Made-in-NOLA block + **marquee** — locality statement beside infinite
   auto-scroll product row (doubled list), grabbable via Pointer Events,
   press-scale 0.95, wrap via modulo; scroll-lock during drag.
5. Lookbook slider — `LFLC_26` stamp, counter, prev/next arrows, full-bleed.
6. Community — intro ("Giving back"-equivalent, filler) + 4 partner rows
   (filler NOLA orgs: image, name, blurb, "Visit" link) with hover image
   reveals and divider lines.
7. Night footer.
Overlap-scroll stitching (`yPercent` slide-under, ~500px) between 2→3→4;
nav marker coverage across all bands.

**Story** (rebuild):
hero with reading-mode hover (headline fades, page dims via `body:has()`;
no-op on browsers without `:has`) → full image band → offset editorial images
(4.35:6 / 4.35:2.8) with scroll parallax → flickthrough hover zoetrope
(300ms cycle, auto on mobile) → `(  our story  )` eyebrow + vision statement
→ **sticky story stack**: five 100svh pinned panels (filler imagery + copy)
→ floating crest SVGs frame-flipping on scroll with parallax → "Explore the
rack" lead-out → **full-height footer**.

**Contact** (rebuild): split-screen — left scrolling 4:5 image column; right
column `sticky; top:0; height:100vh`: "Contact Us", `mailto:` (filler,
marked), "Join the club" + Instagram, inline mini-footer with big wordmark.
No standard footer on this page.

### B3.3 — Commerce (plan 3, ships `v0.4.2-commerce`)

**Shop:** intro strip ("All Pieces / COLLECTION 01 / LFLC©️26") → grid:
hover-swap second image, overlay + info fade, code + title + price,
cursor-following "View Piece" pill per card, JS auto-numbering with
zero-padded total → dark band → **pillars + neon flood**: ScrollTrigger
flood of body/nav/text to LF neon (0.2s, reversed on leave-back), sticky
full-height title, sticky icon column at 50%, three pillars (Culture / Craft
/ Nightlife — filler blurbs), tuned overlap transitions → full image band →
night footer.

**PDP:** two-column: left = featured + additional 4:5 images, mobile "Swipe"
eyebrow; right = sticky (`top: ~6.5rem`) buy column: title/price split,
description, single-open accordions (Garment Details, Wash Care — metafields
`lfc.details` / `lfc.care`, seeded with filler if empty; rotating plus icon),
size pills (selected = neon, sold-out struck-through 0.2 opacity) wired to the
existing hardened add-to-cart → full-bleed lookbook slider → "complete the
look" (3 related products by collection order) → night footer.

**Policies:** shared template — image band + rich text + night footer.

## 5. Filler content inventory

Created during build, all marked `<!-- FILLER -->`: 4 NOLA partner orgs
(names/blurbs/links), made-in-NOLA statement, story copy (5 panels + vision),
statement-band copy, lookbook labels + recropped existing photography,
contact email/social, product codes ×6, menu/preloader/easter-egg imagery
(reuse or generated neon-city fills), pillar blurbs ×3.

## 6. Engineering constraints (binding)

- Self-hosted pinned vendors only; CustomEase is the sole addition.
- Full teardown on every Barba swap (existing `beforeLeave` + `LF.teardown`);
  **no** window/document listener accumulation across navs — chrome systems
  bind once with `data-lf-bound`, per-page systems register teardowns.
- `prefers-reduced-motion`: preloader skipped; menu/popup instant; cursor,
  easter eggs, marquee auto-scroll, flood, parallax, zoetrope disabled or
  static; all content reachable and readable statically.
- Desktop gating (`min-width: 992px` + `pointer: fine`) for cursor, hover
  reveals, image-follow, easter eggs.
- Perf stance: no regression vs. current live baseline (home 53 / PDP 68
  local-measured); live re-check post-drop; not a blocking ≥85 gate. Videos
  ship as wired-but-empty slots (images only) until real loops exist.
- Teaser (`password.liquid` + `lf-teaser.liquid`) untouched and Barba-free.
- A11y floor: focus trap + restore in menu/popup overlays, Esc everywhere,
  real heading order (numbers rendered as styled spans, not headings),
  `aria-expanded` on toggles.

## 7. Quality gates (each sub-phase)

`theme check` clean → scripted Playwright behind-the-gate pass (B2 pattern:
overlay flows incl. focus/Esc, nav recolor + pull-up, cart regression,
reduced-motion pass, 375px overflow sweep on every template, teaser
regression) → user visual pass on dev theme → ship to live theme, merge,
tag (`v0.4.0-chrome` / `v0.4.1-editorial` / `v0.4.2-commerce`) →
`/vibe-review` after B3.3; P0/P1 block phase closure.

## 8. Out of scope

Real community partners, real lookbook/video shoots, copywriting finals
(all filler-swappable); drop-day operator actions (RUNBOOK); light-mode
anything; new commerce features beyond parity (filters, search, reviews).
