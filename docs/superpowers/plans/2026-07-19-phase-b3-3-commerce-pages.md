# Phase B3.3 — Commerce Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Shop and PDP to full Odd Ritual structural parity (spec §4 B3.3) — shop intro strip + numbered grid + pillars with the neon flood, PDP stacked gallery + metafield accordions + size-availability pills + lookbook + "complete the look" — plus a shared night policy template. Ships `v0.4.2-commerce`.

**Architecture:** New sections `lf-shop-grid-v2`, `lf-pillars`, `lf-image-band`; rebuilt `lf-product.liquid`; restyled `lf-related.liquid`; new `templates/policy.liquid`. Behaviors stay in `lf-sections.js` (`LF.init.*` + `data-lf-bound` + `LF.teardown`, dispatched by `lf-motion.js`). The neon flood is a ScrollTrigger class-toggle on `<html>` with CSS transitions — no per-property tweening. Sticky compositions are CSS `position: sticky`, not JS pinning.

**Tech Stack:** Liquid (OS 2.0 sections + `{% stylesheet %}`/`{% schema %}`), vanilla JS, GSAP ScrollTrigger (vendored), existing chrome systems (`data-cursor` pill, `LF.FINE`, `LF.teardown`).

**Current state this plan changes:** `templates/collection.json` renders B1's `lf-collection` (plain grid, no intro strip/numbering/codes/pillars). `templates/product.json` renders B1's `lf-product` (click-through gallery slider, generic settings-driven accordions, no per-size availability) + `lf-related`. No policy template exists (Shopify renders its unstyled default). The site-wide overlap-scroll effect is desktop-gated as of `75aa131`.

**Hard-won constraints this plan MUST honor** (all bitten us in B3.1/B3.2 — treat as binding):
1. **Sections wired into JSON templates do NOT inherit schema `default`/`presets` content.** Every section instance added to a template JSON must have its settings/blocks seeded inline (4 sections shipped invisible this way in B3.2).
2. **`image_tag` defaults to `loading="lazy"` even when the param is omitted.** Pass `loading:` explicitly everywhere; never lazy-load images inside transform-animated containers (WebKit never fires them).
3. **Liquid has no ternary** (`a ? b : c` is a parse error the linter does not catch — it 500s at runtime). Use `{% liquid if ... %}` assigns.
4. **`| escape` every merchant-editable value interpolated into an HTML attribute.**
5. **`lf-eyebrow` renders its own `<p>`** — wrap call sites in `<div>`, never `<p>`.
6. **Viewport units are `svh`** (never `vh`/`dvh`) for full-height elements.
7. **Mobile geometry ≠ desktop geometry.** Any effect that moves/overlays sections must be verified at 390×844 **in WebKit** (Playwright `webkit.launch()`), not just Chromium — and "renders fine at desktop width" proves nothing about portrait phones.
8. **Everything GSAP/ScrollTrigger-driven inside the Barba container dies in `beforeLeave`** — but classes added to `<html>`/`<body>` do NOT. The flood must register an `LF.teardown` entry that removes its class.
9. **Verification = content, not just presence.** Check card/block/image counts and computed styles, not `!!document.querySelector(...)`.
10. Dev server: `shopify theme dev --path theme --store 1xiwxi-yy.myshopify.com` at `http://127.0.0.1:9292` (bypasses the password gate; supports `?view=<suffix>`). Playwright via `NODE_PATH=/Users/dow/node_modules node <script>`.

---

## Branch setup (do this before Task 1)

```bash
cd /Users/dow/laissez-faire && git checkout master && git pull && git checkout -b feat/phase-b3-commerce
```

---

### Task 1: Reusable full-bleed image band

**Files:**
- Create: `theme/sections/lf-image-band.liquid`

- [ ] **Step 1: Create `theme/sections/lf-image-band.liquid`:**

```liquid
<section class="lf-imgband {% if section.settings.image == blank %}lf-imgband--dark{% endif %}">
  {% if section.settings.image != blank %}
    {{ section.settings.image | image_url: width: 2400 | image_tag: loading: 'lazy', alt: '', class: 'lf-imgband__img' }}
  {% endif %}
  {% if section.settings.stamp_line != blank %}
    <p class="lf-imgband__stamp">{% render 'lf-stamp' %} — {{ section.settings.stamp_line }}</p>
  {% endif %}
</section>

{% stylesheet %}
.lf-imgband { position: relative; height: 60svh; overflow: hidden; }
.lf-imgband--dark { height: 34svh; background: #08080b; display: flex; align-items: center; justify-content: center; }
.lf-imgband__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-imgband__stamp {
  color: var(--lf-muted); font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; margin: 0;
}
.lf-imgband:not(.lf-imgband--dark) .lf-imgband__stamp {
  position: absolute; left: 1.5rem; bottom: 1.5rem; color: var(--lf-body-text);
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Image Band",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "Image (blank = dark band)" },
    { "type": "text", "id": "stamp_line", "label": "Stamp line (optional)" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: `shopify theme check --path theme 2>&1 | tail -5`** — expect the existing baseline (3 RemoteAsset warnings), no new offenses. The section isn't wired yet, so no visual check.

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-image-band.liquid
git commit -m "feat(b3.3): reusable full-bleed / dark image band section"
git status --short
```

---

### Task 2: Shop grid v2 — intro strip, numbering, codes, cursor pill

**Files:**
- Create: `theme/sections/lf-shop-grid-v2.liquid`

Numbering note: the spec's OR teardown describes JS auto-numbering; we render numbers in Liquid instead (`forloop` + `products_count`) — same visual, zero JS, no CLS. Deviation is deliberate and approved by this plan.

- [ ] **Step 1: Create `theme/sections/lf-shop-grid-v2.liquid`:**

```liquid
<section class="lf-shopv2">
  <header class="lf-shopv2__intro">
    <h1 class="lf-shopv2__title lf-display lf-glow-text" data-lf-ignite>{{ collection.title | default: 'All Pieces' }}</h1>
    <p class="lf-shopv2__col lf-display">Collection 01</p>
    <p class="lf-shopv2__stamp">{% render 'lf-stamp' %}</p>
  </header>
  {% paginate collection.products by 24 %}
    {% assign lf_total = collection.products_count %}
    {% liquid
      assign lf_total_padded = lf_total | append: ''
      if lf_total < 10
        assign lf_total_padded = lf_total | prepend: '0'
      endif
    %}
    <div class="lf-shopv2__grid">
      {% for product in collection.products %}
        {% liquid
          # forloop.index restarts on every paginated page; offset it so page 2
          # of a 25-product catalog reads "25 / 25", not "01 / 25".
          assign lf_idx = paginate.current_offset | plus: forloop.index
          assign lf_num = lf_idx | append: ''
          if lf_idx < 10
            assign lf_num = lf_idx | prepend: '0'
          endif
        %}
        <a class="lf-shopv2__card" href="{{ product.url }}" data-lf-reveal data-cursor="View Piece">
          <div class="lf-shopv2__imgwrap">
            {{ product.featured_image | image_url: width: 900 | image_tag: loading: 'lazy', alt: product.title, class: 'lf-shopv2__img is-primary' }}
            {% if product.images[1] %}
              {{ product.images[1] | image_url: width: 900 | image_tag: loading: 'lazy', alt: '', class: 'lf-shopv2__img is-alt' }}
            {% endif %}
            <div class="lf-shopv2__overlay"></div>
          </div>
          <div class="lf-shopv2__meta">
            <span class="lf-shopv2__num" aria-hidden="true">{{ lf_num }} / {{ lf_total_padded }}</span>
            <span class="lf-shopv2__code">{% render 'lf-code', product: product %}</span>
          </div>
          <p class="lf-shopv2__name lf-display">{{ product.title }}</p>
          <p class="lf-shopv2__price">{{ product.price_min | money }}{% if product.price_varies %} — {{ product.price_max | money }}{% endif %}</p>
        </a>
      {% endfor %}
      {% if paginate.pages > 1 %}
        <nav class="lf-shopv2__pagination" aria-label="Pagination">
          {% if paginate.previous %}<a href="{{ paginate.previous.url }}">&larr; Prev</a>{% endif %}
          {% if paginate.next %}<a href="{{ paginate.next.url }}">Next &rarr;</a>{% endif %}
        </nav>
      {% endif %}
    </div>
  {% endpaginate %}
</section>

{% stylesheet %}
.lf-shopv2 { padding: 3.5rem 1.25rem 5rem; max-width: 1180px; margin: 0 auto; }
.lf-shopv2__intro { display: flex; align-items: baseline; gap: 1.4rem; flex-wrap: wrap; margin-bottom: 2.4rem; }
.lf-shopv2__title { font-size: clamp(1.6rem, 4.5vw, 2.6rem); margin: 0; }
.lf-shopv2__col { color: var(--lf-muted); font-size: .74rem; letter-spacing: .3em; margin: 0; }
.lf-shopv2__stamp { color: var(--lf-muted); font-size: .68rem; letter-spacing: .22em; margin: 0 0 0 auto; }
.lf-shopv2__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.lf-shopv2__card { text-decoration: none; }
.lf-shopv2__imgwrap { position: relative; overflow: hidden; border: 1px solid #1e1e26; background: var(--lf-panel); }
.lf-shopv2__img { width: 100%; height: auto; display: block; }
.lf-shopv2__img.is-alt { position: absolute; inset: 0; opacity: 0; transition: opacity .35s var(--lf-ease); }
.lf-shopv2__overlay { position: absolute; inset: 0; background: rgba(13,13,17,0); transition: background .35s var(--lf-ease); }
.lf-shopv2__card:hover .lf-shopv2__img.is-alt { opacity: 1; }
.lf-shopv2__card:hover .lf-shopv2__overlay { background: rgba(13,13,17,.18); }
@media (prefers-reduced-motion: reduce) { .lf-shopv2__img.is-alt, .lf-shopv2__overlay { transition: none; } }
.lf-shopv2__meta { display: flex; justify-content: space-between; margin: .7rem 0 .15rem; color: #55555f; font-size: .64rem; letter-spacing: .14em; }
.lf-shopv2__name { color: var(--lf-body-text); font-size: .76rem; letter-spacing: .16em; margin: 0 0 .15rem; }
.lf-shopv2__price { color: var(--lf-muted); font-size: .74rem; margin: 0; }
.lf-shopv2__pagination { grid-column: 1 / -1; display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem; }
.lf-shopv2__pagination a { color: var(--lf-neon-core); text-decoration: none; letter-spacing: .15em; font-size: .78rem; }
@media (max-width: 749px) { .lf-shopv2__grid { grid-template-columns: repeat(2, 1fr); gap: 9px; } .lf-shopv2__stamp { margin-left: 0; } }
{% endstylesheet %}

{% schema %}
{ "name": "LF Shop Grid v2", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: theme check** — baseline only.

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-shop-grid-v2.liquid
git commit -m "feat(b3.3): shop grid v2 - intro strip, numbering, codes, cursor pill"
git status --short
```

---

### Task 3: Neon flood system

**Files:**
- Modify: `theme/assets/lf-tokens.css` (append flood rules)
- Modify: `theme/assets/lf-sections.js` (append `LF.init.flood`)

The flood: entering the pillars section floods the page to LF neon (`--lf-neon-core` background, night-ink text, header included), 0.2s CSS transition, fully reversed on scroll-back and on navigation away. Class lives on `<html>` so it reaches the header (outside the Barba container). Disabled under reduced motion.

- [ ] **Step 1: Append to `theme/assets/lf-tokens.css`:**

```css
/* Neon flood (B3.3): [data-lf-flood] section entry floods the page to neon.
   Class is toggled on <html> by LF.init.flood (ScrollTrigger); a LF.teardown
   entry removes it on every Barba leave so it can never leak across pages. */
html.lf-flood body { background: var(--lf-neon-core); color: var(--lf-ground); }
html.lf-flood .lf-header a,
html.lf-flood .lf-header button,
html.lf-flood .lf-header { color: var(--lf-ground); }
html.lf-flood .lf-header__crest { background-color: var(--lf-ground); filter: none; }
html.lf-flood .lf-glow-text { color: var(--lf-ground); text-shadow: none; }
/* .lf-header__count has its own neon color rule (lf-header.liquid) that blocks
   inheritance from the flooded button; hover rules on the cart/menu buttons are
   (0,2,0) and would beat the plain flood button rule — both need explicit
   flood-scoped overrides or they render neon-on-neon (invisible) mid-flood. */
html.lf-flood .lf-header__count { color: var(--lf-ground); text-shadow: none; }
html.lf-flood .lf-header__cart:hover, html.lf-flood .lf-header__menu:hover { color: var(--lf-ground); }
body, .lf-header, .lf-header a, .lf-header button, .lf-header__crest, .lf-glow-text {
  transition: background-color .2s var(--lf-ease), color .2s var(--lf-ease), text-shadow .2s var(--lf-ease);
}
/* The group above wins the `transition` property tie against [data-lf-reveal]
   (same 0,1,0 specificity, later in file) — elements carrying BOTH .lf-glow-text
   and data-lf-reveal (home statement heading) would lose their reveal fade/slide.
   The merged rule below out-specifies both and carries the union. */
.lf-glow-text[data-lf-reveal] {
  transition: background-color .2s var(--lf-ease), color .2s var(--lf-ease), text-shadow .2s var(--lf-ease),
              opacity .7s var(--lf-ease), transform .7s var(--lf-ease);
}
@media (prefers-reduced-motion: reduce) {
  body, .lf-header, .lf-header a, .lf-header button, .lf-header__crest, .lf-glow-text,
  .lf-glow-text[data-lf-reveal] { transition: none; }
}
```

> **As-run (combined T1-T3 review, fixed in `e09c51d` — all four were defects in this plan's own authored code, not implementer errors):** (1) the flood transition group's `transition` shorthand tied `[data-lf-reveal]`'s on specificity (0,1,0) and, being later in the file, silently killed the reveal fade/slide on elements carrying both `.lf-glow-text` and `data-lf-reveal` (the home statement heading) — fixed with the merged union rule above. (2) `.lf-header__count` carries its own neon color rule that blocks inheritance from the flooded button — was invisible neon-on-neon mid-flood. (3) `.lf-header__cart:hover`/`.lf-header__menu:hover` (0,2,0) beat the plain flood button rule — hover mid-flood went invisible. (4) Task 2's grid numbering used bare `forloop.index`, which restarts per paginated page while the denominator is collection-global — page 2 of a 25-product catalog would have read "01 / 25"; fixed with `paginate.current_offset` (Task 2's code block above corrected too). Review also confirmed: flood class has exactly one writer (never applied under reduced motion), teardown drains correctly, and `html.lf-flood body` beats every competing background rule including `critical.css`'s.

- [ ] **Step 2: Append `LF.init.flood` to `theme/assets/lf-sections.js`:**

```js
  // ——— Neon flood: page floods to neon while a [data-lf-flood] section is in view ———
  // Class sits on <html> (reaches the persistent header outside the Barba
  // container), so it MUST be torn down on leave — ScrollTrigger's kill alone
  // does not remove an already-applied class.
  LF.init.flood = function (root, ctx) {
    if (ctx.reduced || !window.ScrollTrigger) return;
    var docEl = document.documentElement;
    (root || document).querySelectorAll('[data-lf-flood]:not([data-lf-flood-bound])').forEach(function (el) {
      el.setAttribute('data-lf-flood-bound', '1');
      ScrollTrigger.create({
        trigger: el, start: 'top 60%', end: 'bottom 40%',
        onEnter: function () { docEl.classList.add('lf-flood'); },
        onEnterBack: function () { docEl.classList.add('lf-flood'); },
        onLeave: function () { docEl.classList.remove('lf-flood'); },
        onLeaveBack: function () { docEl.classList.remove('lf-flood'); }
      });
      LF.teardown.push(function () { docEl.classList.remove('lf-flood'); });
    });
  };
```

- [ ] **Step 3: theme check** — baseline only (nothing wired yet).

- [ ] **Step 4: Commit**

```bash
git add theme/assets/lf-tokens.css theme/assets/lf-sections.js
git commit -m "feat(b3.3): neon flood system - scroll-triggered page flood with Barba-safe teardown"
git status --short
```

---

### Task 4: Pillars section + wire the Shop page

**Files:**
- Create: `theme/sections/lf-pillars.liquid`
- Modify: `theme/templates/collection.json` (full replacement)

- [ ] **Step 1: Create `theme/sections/lf-pillars.liquid`:**

```liquid
<section class="lf-pillars" data-lf-flood>
  <div class="lf-pillars__titlecol">
    <h2 class="lf-pillars__title lf-display">{{ section.settings.title }}</h2>
  </div>
  <div class="lf-pillars__iconcol" aria-hidden="true">
    <div class="lf-pillars__crest" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>
  </div>
  <div class="lf-pillars__list">
    {% for i in (1..3) %}
      {% assign t_key = 'pillar_title_' | append: i %}
      {% assign b_key = 'pillar_body_' | append: i %}
      {% if section.settings[t_key] != blank %}
        <article class="lf-pillars__item" data-lf-reveal>
          <span class="lf-pillars__num lf-display" aria-hidden="true">0{{ i }}</span>
          <h3 class="lf-pillars__name lf-display">{{ section.settings[t_key] }}</h3>
          <p class="lf-pillars__body">{{ section.settings[b_key] }}</p>
        </article>
      {% endif %}
    {% endfor %}
  </div>
</section>

{% stylesheet %}
.lf-pillars {
  display: grid; grid-template-columns: 1fr 80px 1.2fr; gap: 2rem;
  max-width: 1180px; margin: 0 auto; padding: 6rem 1.5rem; align-items: start;
}
.lf-pillars__titlecol { position: sticky; top: 0; height: 100svh; display: flex; align-items: center; }
.lf-pillars__title { font-size: clamp(1.8rem, 4.5vw, 3rem); line-height: 1.1; margin: 0; max-width: 12ch; }
.lf-pillars__iconcol { position: sticky; top: 50%; }
.lf-pillars__crest {
  width: 56px; aspect-ratio: 300/320; background-color: currentColor;
  -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat;
  opacity: .8;
}
.lf-pillars__list { display: flex; flex-direction: column; gap: 42svh; padding: 24svh 0; }
.lf-pillars__num { display: block; font-size: .74rem; letter-spacing: .3em; opacity: .55; margin-bottom: .6rem; }
.lf-pillars__name { font-size: clamp(1.3rem, 3vw, 1.9rem); margin: 0 0 .8rem; }
.lf-pillars__body { font-size: .95rem; line-height: 1.7; max-width: 46ch; margin: 0; }
@media (max-width: 849px) {
  .lf-pillars { display: block; padding: 4rem 1.25rem; }
  .lf-pillars__titlecol { position: static; height: auto; margin-bottom: 2.5rem; }
  .lf-pillars__iconcol { display: none; }
  .lf-pillars__list { gap: 3.5rem; padding: 0; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Pillars",
  "settings": [
    { "type": "text", "id": "title", "label": "Sticky title", "default": "What we stand on" },
    { "type": "text", "id": "pillar_title_1", "label": "Pillar 1 title", "default": "Culture" },
    { "type": "textarea", "id": "pillar_body_1", "label": "Pillar 1 body", "default": "Black Masking Indians, second lines, social aid and pleasure clubs — the traditions that raised us decide what we make, not the trend cycle." },
    { "type": "text", "id": "pillar_title_2", "label": "Pillar 2 title", "default": "Craft" },
    { "type": "textarea", "id": "pillar_body_2", "label": "Pillar 2 body", "default": "Heavyweight fabric, chain-stitched crests, puff-print done slow. Every piece is built to outlast the season it dropped in." },
    { "type": "text", "id": "pillar_title_3", "label": "Pillar 3 title", "default": "Nightlife" },
    { "type": "textarea", "id": "pillar_body_3", "label": "Pillar 3 body", "default": "The city runs on its night economy — the musicians, cooks, and bartenders who keep the lights humming. This is their uniform." }
  ]
}
{% endschema %}
```

Filler note: all three pillar blurbs are spec-sanctioned filler (spec §5). The schema defaults double as the seeded template values below — both places must stay in sync.

- [ ] **Step 2: Replace `theme/templates/collection.json` entirely** (settings seeded inline — constraint #1):

```json
{
  "sections": {
    "grid": { "type": "lf-shop-grid-v2", "settings": {} },
    "band1": { "type": "lf-image-band", "settings": { "stamp_line": "Designed and made locally" } },
    "pillars": {
      "type": "lf-pillars",
      "settings": {
        "title": "What we stand on",
        "pillar_title_1": "Culture",
        "pillar_body_1": "Black Masking Indians, second lines, social aid and pleasure clubs — the traditions that raised us decide what we make, not the trend cycle.",
        "pillar_title_2": "Craft",
        "pillar_body_2": "Heavyweight fabric, chain-stitched crests, puff-print done slow. Every piece is built to outlast the season it dropped in.",
        "pillar_title_3": "Nightlife",
        "pillar_body_3": "The city runs on its night economy — the musicians, cooks, and bartenders who keep the lights humming. This is their uniform."
      }
    },
    "band2": { "type": "lf-image-band", "settings": { "image": "shopify://shop_images/lf-hero-secondline.jpg" } }
  },
  "order": ["grid", "band1", "pillars", "band2"]
}
```

(`band1` has no image → renders as the spec's dark band between grid and pillars. `band2` reuses an already-uploaded shop image as the full image band before the footer.)

- [ ] **Step 3: Push to dev + verify live** (`/collections/all`):
  - Intro strip shows title / "Collection 01" / `LFLC©26` stamp.
  - 6 cards with `01 / 06`-style numbering, product codes, hover-swap, "View Piece" cursor pill on desktop.
  - Scrolling into pillars floods page + header to neon with dark text; scrolling back up fully reverses it; navigating away (Barba click to Home mid-flood) leaves NO flood residue — check `document.documentElement.classList` after the swap.
  - Sticky title/icon columns behave on desktop; stacked cleanly at 390×844 **in WebKit** (constraint #7) with no horizontal overflow and no section overlapping another.
  - Reduced-motion context: no flood, content readable.

```bash
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
```

- [ ] **Step 4: Commit**

```bash
git add theme/sections/lf-pillars.liquid theme/templates/collection.json
git commit -m "feat(b3.3): pillars with neon flood, shop page composition"
git status --short
```

---

### Task 5: PDP rebuild — markup + CSS

**Files:**
- Modify: `theme/sections/lf-product.liquid`

Changes (surgical — keep the form, variants JSON, and buy-column bones):
1. **Gallery** → stacked 4:5 media column on desktop (all images visible, no slider chrome), horizontal scroll-snap row on mobile with a "( swipe )" eyebrow. Delete `.lf-pdp__gnav` and the `data-lf-gslide`/`data-lf-gnum`/`data-lf-gprev`/`data-lf-gnext` attributes entirely (their JS goes in Task 6). First image `loading: 'eager'`, rest lazy (they're in normal flow — lazy is safe here).
2. **Title/price split** — one flex row.
3. **Accordions** → exactly two, single-open via native `<details name="lf-pdp-acc">`, rotating plus icon, sourced from metafields with filler fallback.
4. **Option pills** — add `is-soldout` styling hook (JS wires it in Task 6).

- [ ] **Step 1: Replace the gallery block** (lines 2–16 of the current file) with:

```liquid
  <div class="lf-pdp__gallery">
    <div class="lf-pdp__swipe lf-display" aria-hidden="true">(&nbsp;&nbsp;swipe&nbsp;&nbsp;)</div>
    <div class="lf-pdp__media">
      {% for media in product.media %}
        {% liquid
          assign lf_img_loading = 'lazy'
          if forloop.first
            assign lf_img_loading = 'eager'
          endif
        %}
        <div class="lf-pdp__frame">
          {{ media | image_url: width: 1400 | image_tag: loading: lf_img_loading, alt: media.alt | default: product.title }}
        </div>
      {% endfor %}
    </div>
  </div>
```

- [ ] **Step 2: Replace the `<h1>`/price block** with the split row (edition/story/desc lines below it stay as they are):

```liquid
    <div class="lf-pdp__titlerow">
      <h1 class="lf-display lf-glow-text" data-lf-ignite>{{ product.title }}</h1>
      <p class="lf-pdp__price" data-lf-price>{{ product.selected_or_first_available_variant.price | money }}</p>
    </div>
```

- [ ] **Step 3: Replace the `.lf-pdp__accordion` block** (and delete the old 3× `acc_title_N`/`acc_body_N` schema settings — replaced below):

```liquid
    <div class="lf-pdp__accordion">
      {% liquid
        assign lf_details = product.metafields.lfc.details
        if lf_details == blank
          assign lf_details = section.settings.details_fallback
        endif
        assign lf_care = product.metafields.lfc.care
        if lf_care == blank
          assign lf_care = section.settings.care_fallback
        endif
      %}
      <details name="lf-pdp-acc">
        <summary>Garment Details<span class="lf-pdp__plus" aria-hidden="true"></span></summary>
        <div>{{ lf_details | newline_to_br }}</div>
      </details>
      <details name="lf-pdp-acc">
        <summary>Wash Care<span class="lf-pdp__plus" aria-hidden="true"></span></summary>
        <div>{{ lf_care | newline_to_br }}</div>
      </details>
    </div>
```

New schema settings (replace the old six accordion settings):

```json
    { "type": "textarea", "id": "details_fallback", "label": "Garment Details fallback (used when metafield lfc.details is empty)", "default": "Heavyweight 340gsm cotton, puff-print front graphic, chain-stitched crest at the hem. Cut roomy through the chest — New Orleans proportions; between sizes, size down." },
    { "type": "textarea", "id": "care_fallback", "label": "Wash Care fallback (used when metafield lfc.care is empty)", "default": "Wash cold, inside out, with its own kind. Hang dry in the shade — the print ages like the city, slowly and on purpose. No bleach, no tumble." }
```

- [ ] **Step 4: Replace the `{% stylesheet %}` rules for gallery/nav/accordion** and add title-row + sold-out styles (rules not listed here stay unchanged):

```css
.lf-pdp__gallery { position: relative; }
.lf-pdp__swipe { display: none; }
.lf-pdp__media { display: flex; flex-direction: column; gap: 1rem; }
.lf-pdp__frame { aspect-ratio: 4/5; overflow: hidden; border: 1px solid #1e1e26; }
.lf-pdp__frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-pdp__titlerow { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.lf-pdp__titlerow h1 { font-size: clamp(1.4rem, 3.6vw, 2.1rem); margin: 0 0 .4rem; }
.lf-pdp__buy { position: sticky; top: 6.5rem; }
.lf-pdp__accordion { margin-top: 1.6rem; }
.lf-pdp__accordion details { border-top: 1px solid #22222a; padding: .7rem 0; }
.lf-pdp__accordion summary {
  cursor: pointer; color: var(--lf-body-text); font-size: .8rem; letter-spacing: .12em;
  text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;
  list-style: none;
}
.lf-pdp__accordion summary::-webkit-details-marker { display: none; }
.lf-pdp__plus { position: relative; width: 12px; height: 12px; transition: transform .3s var(--lf-ease); }
.lf-pdp__plus::before, .lf-pdp__plus::after { content: ''; position: absolute; background: var(--lf-muted); }
.lf-pdp__plus::before { left: 5px; top: 0; width: 2px; height: 12px; }
.lf-pdp__plus::after { left: 0; top: 5px; width: 12px; height: 2px; }
details[open] .lf-pdp__plus { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .lf-pdp__plus { transition: none; } }
.lf-pdp__accordion div { color: var(--lf-muted); font-size: .8rem; line-height: 1.6; padding-top: .5rem; }
.lf-pdp__opt label.is-soldout span { text-decoration: line-through; opacity: .2; }
@media (max-width: 849px) {
  .lf-pdp { display: block; }
  .lf-pdp__buy { position: static; margin-top: 1.4rem; }
  .lf-pdp__swipe { display: block; color: var(--lf-muted); font-size: .64rem; letter-spacing: .3em; margin-bottom: .5rem; }
  .lf-pdp__media { flex-direction: row; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
  .lf-pdp__frame { flex: 0 0 82vw; scroll-snap-align: center; }
}
```

- [ ] **Step 5: theme check**, then commit:

```bash
git add theme/sections/lf-product.liquid
git commit -m "feat(b3.3): PDP rebuild - stacked gallery, title/price split, metafield accordions"
git status --short
```

---

### Task 6: PDP JS — drop gallery slider, add size availability

**Files:**
- Modify: `theme/assets/lf-sections.js` (`LF.init.pdp`)

- [ ] **Step 1: Remove the gallery-slider code from `LF.init.pdp`.** Read the function; delete every statement referencing `data-lf-gslide`, `data-lf-gnum`, `data-lf-gprev`, `data-lf-gnext`, and the `slides`/`gnum`/`gi` variables and their click handlers. Do NOT touch: `selectedOptions()`, variant resolution, price sync, the add-to-cart fetch (12s AbortController watchdog), sold-out messaging, or the `data-lf-bound` guard.

- [ ] **Step 2: Add per-size availability, inside `LF.init.pdp` after the existing variant-sync wiring:**

```js
    // Sold-out size pills: for the LAST option group (Size), test each value
    // against the currently selected values of the other groups.
    var optSets = Array.prototype.slice.call(pdp.querySelectorAll('.lf-pdp__opt'));
    function refreshSizeAvailability() {
      if (optSets.length < 2) return;
      var lastIdx = optSets.length - 1;
      var chosen = selectedOptions();
      optSets[lastIdx].querySelectorAll('input').forEach(function (input) {
        var probe = chosen.slice();
        probe[lastIdx] = input.value;
        var match = variants.filter(function (v) {
          return probe.every(function (val, idx) { return v.options[idx] === val; });
        })[0];
        var ok = Boolean(match && match.available);
        var label = input.closest('label');
        if (label) label.classList.toggle('is-soldout', !ok);
      });
    }
    refreshSizeAvailability();
    pdp.querySelectorAll('.lf-pdp__opt input').forEach(function (input) {
      input.addEventListener('change', refreshSizeAvailability);
    });
```

(Note: sold-out pills stay clickable — selecting one drives the existing sold-out message + disabled add button. Struck-through is presentation, not a click block, matching OR.)

- [ ] **Step 3: Push to dev + verify live** on `/products/maria` (or any product):
  - Desktop: stacked 4:5 images, no gallery arrows, buy column sticky at `top: 6.5rem`, title left / price right on one row.
  - Accordions: opening "Wash Care" auto-closes "Garment Details" (native `name` behavior); plus icon rotates to ×; filler bodies render.
  - Variant sync: switching Garment/Size updates price + hidden variant id (assert via DOM).
  - **Run `node scripts/test-purchase-path.mjs`** — all checks green (this exercises the hardened add-to-cart end-to-end; it must not regress).
  - Mobile 390×844 **WebKit**: horizontal swipe gallery snaps, "( swipe )" eyebrow visible, no horizontal page overflow.
  - Zero console/page errors, including after a Barba nav Home → PDP → Home.

- [ ] **Step 4: Commit**

```bash
git add theme/assets/lf-sections.js
git commit -m "feat(b3.3): PDP js - remove gallery slider, per-size availability pills"
git status --short
```

> **As-run (T5+T6 combined review, fixed in `c4437a5`):** (1) `lfc.details`/`lfc.care` are multi-line metafields whose newlines collapse to spaces in plain HTML output — care copy written as separate lines would render as one run-on sentence once the operator fills real values. Added `| newline_to_br` to both accordion bodies (Task 5's code block above corrected; works on both the metafield drop and the textarea fallback). (2) Dropped the now-duplicate `.lf-pdp__buy h1` rule (exact copy of the new `.lf-pdp__titlerow h1`). Review also confirmed mechanically: the hardened add-to-cart submit handler is byte-identical to the pre-T6 version; `refreshSizeAvailability`'s index alignment between fieldset DOM order and `variants[].options` is guaranteed (both derive from Shopify's option ordering); the mobile snap gallery needs no `touch-action`/Lenis guard (vendored Lenis keeps touch native and passes pure-horizontal wheel through). Known accepted minors: the `alt: media.alt | default: product.title` fallback is a no-op (Liquid can't nest filters in args; `image_tag` falls back to the media's own alt anyway), and single-option products get no sold-out marks (this store's products are all two-option).

---

### Task 7: PDP page composition — lookbook + "complete the look"

**Files:**
- Modify: `theme/sections/lf-related.liquid` (eyebrow + heading restyle only)
- Modify: `theme/templates/product.json` (full replacement)

- [ ] **Step 1: In `lf-related.liquid`,** replace the kicker line:

```liquid
  <p class="lf-related__kicker">More from the Drop</p>
```

with:

```liquid
  <div class="lf-related__kicker">{% render 'lf-eyebrow', text: 'complete the look' %}</div>
```

(`<div>` wrapper — constraint #5. `.lf-related__kicker`'s existing CSS margin still applies; its font styles become inert on the inner `<p class="lf-eyebrow">`, which carries its own styling — acceptable.)

- [ ] **Step 2: Replace `theme/templates/product.json` entirely** (lookbook blocks seeded — constraint #1):

```json
{
  "sections": {
    "main": { "type": "lf-product", "settings": {} },
    "lookbook": {
      "type": "lf-lookbook",
      "blocks": {
        "slide1": { "type": "slide", "settings": { "image": "shopify://shop_images/lf-hero-chief.jpg", "caption": "Won't Bow Down" } },
        "slide2": { "type": "slide", "settings": { "image": "shopify://shop_images/lf-hero-secondline.jpg", "caption": "Kill 'Em Dead, Needle & Thread" } }
      },
      "block_order": ["slide1", "slide2"],
      "settings": {}
    },
    "related": { "type": "lf-related", "settings": {} }
  },
  "order": ["main", "lookbook", "related"]
}
```

- [ ] **Step 3: Push to dev + verify** — PDP order is buy-section → full-bleed lookbook (2 slides, arrows work) → "( complete the look )" 3-card row → footer. Lookbook slide COUNT is 2 (content check, not presence — constraint #9).

- [ ] **Step 4: Commit**

```bash
git add theme/sections/lf-related.liquid theme/templates/product.json
git commit -m "feat(b3.3): PDP composition - lookbook slider + complete-the-look row"
git status --short
```

---

### Task 8: Policy template

**Files:**
- Create: `theme/templates/policy.liquid`

Shopify renders `/policies/*` through `templates/policy.liquid` when present (policy pages don't support JSON/section templates). The night footer comes from `theme.liquid`'s footer-group automatically.

- [ ] **Step 1: Create `theme/templates/policy.liquid`:**

```liquid
<div class="lf-policy">
  <header class="lf-policy__head">
    <p class="lf-policy__stamp">{% render 'lf-stamp' %}</p>
    <h1 class="lf-policy__title lf-display lf-glow-text" data-lf-ignite>{{ policy.title }}</h1>
  </header>
  <div class="lf-policy__body">{{ policy.body }}</div>
</div>

<style>
  .lf-policy { max-width: 720px; margin: 0 auto; padding: 6rem 1.5rem 5rem; }
  .lf-policy__head { text-align: center; margin-bottom: 3rem; }
  .lf-policy__stamp { color: var(--lf-muted); font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; margin: 0 0 .8rem; }
  .lf-policy__title { font-size: clamp(1.5rem, 4vw, 2.3rem); margin: 0; }
  .lf-policy__body { color: var(--lf-body-text); font-size: .9rem; line-height: 1.75; }
  .lf-policy__body h2, .lf-policy__body h3 { color: var(--lf-body-text); font-family: var(--lf-font-display); letter-spacing: .04em; text-transform: uppercase; font-size: 1rem; margin: 2rem 0 .6rem; }
  .lf-policy__body a { color: var(--lf-neon-core); }
</style>
```

(Plain `<style>`, not `{% stylesheet %}` — that tag is section-only.)

- [ ] **Step 2: Push to dev + verify** `/policies/privacy-policy` renders night-styled with the standard footer below it, no console errors.

- [ ] **Step 3: Commit**

```bash
git add theme/templates/policy.liquid
git commit -m "feat(b3.3): night-styled shared policy template"
git status --short
```

---

### Task 9: Verification + ship `v0.4.2-commerce`

**Files:** none (verification + deploy)

- [ ] **Step 1: `shopify theme check --path theme`** — expect the 3-warning RemoteAsset baseline; any new offense type is a finding to fix.

- [ ] **Step 2: Push to dev**, then run the scripted pass (write to scratchpad; `NODE_PATH=/Users/dow/node_modules node <file>`; base `http://127.0.0.1:9292`). It must cover, in BOTH Chromium and WebKit engines:
  - Shop: intro strip renders; card count === 6 with numbering text `01 / 06`; hover-swap alt image present on ≥1 card; flood class appears on `<html>` when pillars scrolled into view and is GONE after scrolling back AND after a Barba nav away; 390×844 overflow === 0.
  - PDP: media frame count === `product.media.size`; accordions single-open (open second → first auto-closes); size-pill `is-soldout` logic (assert class list against the variants JSON); price sync on option change; `node scripts/test-purchase-path.mjs` green.
  - Regressions: home hero advances, marquee has 12 loaded images at 390×844 WebKit, story/contact footer counts (1 full-height / 0), cart drawer opens on a fresh tab, teaser page Barba-free.
  - Reduced-motion context: no flood, all commerce content readable, zero page errors.
- [ ] **Step 3: Fix findings** (commit as `fix(b3.3): <finding>`, amend this plan's code blocks via As-run notes), re-run until clean.

- [ ] **Step 4: User visual pass** on the dev preview (desktop + their actual phone — shop grid, flood feel, PDP swipe gallery, accordions, size pills). Fix + re-verify anything raised.

- [ ] **Step 5: Ship**

```bash
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
curl -sL "https://laissezfaireleisureclub.com/" | grep -o "lf-teaser" | head -1   # teaser still gating
git checkout master && git merge --no-ff feat/phase-b3-commerce -m "Ship B3.3: commerce pages" && git tag v0.4.2-commerce
git push origin master --tags
```

- [ ] **Step 6: Per spec §7 and the standing rule, run `/vibe-review /Users/dow/laissez-faire`** — P0/P1 block phase closure; P2/P3 become follow-up scope.

---

## Not in this plan

Real lookbook/video shoots, real policy copy (merchant fills in admin), commerce features beyond parity (filters, search, reviews), drop-day operator actions (RUNBOOK), light-mode anything. `lf-collection.liquid` and the old accordion settings leave the render path but stay in git history (retirement precedent). Real `lfc.details`/`lfc.care` metafield values are an operator/content task — the fallbacks ship as filler.

## Self-review notes

- **Spec coverage (§4 B3.3):** Shop intro strip ✓ (T2), numbered grid + codes + cursor pill + hover-swap ✓ (T2), dark band ✓ (T4 `band1`), pillars + flood + sticky title/icon ✓ (T3+T4), full image band ✓ (T4 `band2`), night footer ✓ (layout-level). PDP stacked 4:5 images + mobile swipe eyebrow ✓ (T5), sticky buy col `top: 6.5rem` ✓ (T5), title/price split ✓ (T5), single-open metafield accordions + rotating plus ✓ (T5), size pills w/ sold-out strike ✓ (T5+T6), hardened add-to-cart preserved ✓ (T6 + purchase-path script), lookbook ✓ (T7), complete-the-look ✓ (T7), policies ✓ (T8). Deviations, both deliberate: grid numbering rendered in Liquid not JS (same visual, simpler); flood trigger band `top 60% → bottom 40%` (tuned entry, not OR's exact offsets).
- **Placeholder scan:** none — all filler copy is real usable text per spec §5; all code blocks complete.
- **Type consistency:** `LF.init.flood` matches the registry naming; `data-lf-flood`/`data-lf-flood-bound` mirror the `data-lf-overlap`/`-bound` convention; `lf_num`/`lf_total_padded` liquid vars are self-contained per file; `refreshSizeAvailability` reuses the existing `selectedOptions()`/`variants` from `LF.init.pdp` (verified present in current source).
- **Constraint check:** every template JSON seeds content inline (#1); every `image_tag` passes `loading:` (#2); no ternaries (#3); no new merchant text in attributes without `| escape` (#4 — `data-cursor="View Piece"` is a literal); eyebrow wrapped in `<div>` (#5); all heights `svh` (#6); WebKit mobile checks required in T4/T6/T9 (#7); flood registers `LF.teardown` (#8); verification steps assert counts/classes (#9).
