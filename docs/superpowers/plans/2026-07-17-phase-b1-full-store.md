# Laissez-Faire Leisure Club — Phase B1 (Full Store, Structure First) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Laissez-Faire Leisure Club store behind the password gate — theme shell (header/footer/cart drawer), hero-slider homepage, shop grid, split PDP with related products, story page, and the six Drop 001 products with placeholder photography — leaving the live teaser byte-identical.

**Architecture:** Extend the shipped Phase A theme in place. Every LF section is self-contained (markup + `{% stylesheet %}` + `{% javascript %}` + `{% schema %}`). Global motion (Lenis smooth scroll, scroll reveals) lives in one vendored bootstrap (`lf-motion.js`) loaded from `theme.liquid`. Cart runs on Shopify's AJAX Cart API via a drawer section mounted in the layout. Products are created programmatically via a Node script hitting the Admin GraphQL API (token from macOS Keychain — never typed into chat/terminal history). Variant→image mapping uses image `alt` text convention (`alt` starts with the garment option value).

**Tech Stack:** Liquid (OS 2.0), vanilla CSS/JS, GSAP 3.12.7 + ScrollTrigger (vendored), Lenis 1.2.3 (vendored), Node ≥18 (`fetch`) for catalog load, Shopify Admin GraphQL API `2025-10`, `sips` for image prep.

**Spec:** `docs/superpowers/specs/2026-07-17-phase-b-full-store-design.md` (B1 scope). Phase A spec still governs tokens/typography.

**Store:** `1xiwxi-yy.myshopify.com` · live theme `#161862975716` · repo `/Users/dow/laissez-faire` · branch `feat/phase-b1`

**Verification model:** No unit-test harness for Liquid; the loop is `shopify theme check --path theme` (baseline: **3 RemoteAsset warnings** in `snippets/lf-fonts.liquid`, nothing else) plus explicit dev-server/browser checks with stated expected results. Never push to the live theme during B1 (`shopify theme dev` only) — the final task pushes once, after review.

**Design tokens quick reference (from `theme/assets/lf-tokens.css`):** `--lf-ground #0d0d11`, `--lf-panel #14141a`, `--lf-body-text #c9c9d4`, `--lf-muted #7a7a85`, `--lf-neon-core #9fd8ff`, `--lf-neon-halo #4aa8ff`, `--lf-ease cubic-bezier(0.32,0.72,0,1)`, fonts `--lf-font-display` (Graduate) / `--lf-font-script` (Kaushan Script) / `--lf-font-body` (Archivo). Utility classes: `.lf-display`, `.lf-script`, `.lf-glow-text`. Glow is display/iconography only — body/UI text never glows.

## File structure

```
theme/
├── assets/
│   ├── lf-tokens.css            (Task 1: narrow reduced-motion rule)
│   ├── lf-motion.js             (Task 1: Lenis init + reveal helper)
│   ├── gsap.min.js              (Task 1: vendored 3.12.7)
│   ├── ScrollTrigger.min.js     (Task 1: vendored 3.12.7)
│   ├── lenis.min.js             (Task 1: vendored 1.2.3)
│   └── lf-culture-{1,2,3}.jpg   (Task 8: curated culture images)
├── layout/theme.liquid          (Task 2: LF shell — rewrite)
├── sections/
│   ├── lf-header.liquid         (Task 2)
│   ├── lf-footer.liquid         (Task 3)
│   ├── lf-cart-drawer.liquid    (Task 4)
│   ├── lf-hero-slider.liquid    (Task 5)
│   ├── lf-featured-story.liquid (Task 6)
│   ├── lf-drop-grid.liquid      (Task 7)
│   ├── lf-culture-strip.liquid  (Task 8)
│   ├── lf-email-block.liquid    (Task 8)
│   ├── lf-collection.liquid     (Task 10)
│   ├── lf-product.liquid        (Task 11)
│   ├── lf-related.liquid        (Task 11)
│   ├── lf-story.liquid          (Task 12)
│   ├── header-group.json        (Task 2: rewire → lf-header)
│   └── footer-group.json        (Task 3: rewire → lf-footer)
├── templates/
│   ├── index.json               (Task 9: rewire)
│   ├── collection.json          (Task 10: rewire)
│   ├── product.json             (Task 11: rewire)
│   └── page.story.json          (Task 12: new)
├── scripts/                     (repo root, NOT inside theme/)
│   └── create-products.mjs      (Task 13)
DELETED (once orphaned): sections/hello-world.liquid, sections/custom-section.liquid,
sections/header.liquid, sections/footer.liquid, sections/collection.liquid,
sections/product.liquid, sections/collections.liquid  (Task 9/10/11 — each deletion in the
same commit as the rewiring that orphans it; grep for references before each deletion)
KEPT AS-IS (functional, out of scope): 404/search/blog/article/page/cart sections+templates,
assets/critical.css (still used by kept stock sections; loaded BEFORE lf-tokens.css so LF wins).
```

---

### Task 1: Branch, vendored motion libs, reduced-motion fix

**Files:**
- Create: `theme/assets/gsap.min.js`, `theme/assets/ScrollTrigger.min.js`, `theme/assets/lenis.min.js`, `theme/assets/lf-motion.js`
- Modify: `theme/assets/lf-tokens.css`

- [ ] **Step 1: Branch**

```bash
cd /Users/dow/laissez-faire && git checkout master && git pull 2>/dev/null; git checkout -b feat/phase-b1
```

- [ ] **Step 2: Vendor pinned libs**

```bash
curl -sL https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js -o theme/assets/gsap.min.js
curl -sL https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js -o theme/assets/ScrollTrigger.min.js
curl -sL https://unpkg.com/lenis@1.2.3/dist/lenis.min.js -o theme/assets/lenis.min.js
head -c 200 theme/assets/gsap.min.js; echo; head -c 120 theme/assets/lenis.min.js
```

Expected: minified JS content (not HTML error pages); gsap file ~70KB+, lenis ~10KB+ (`du -h theme/assets/*.min.js`).

- [ ] **Step 3: Write `theme/assets/lf-motion.js`**

```js
/* LF motion bootstrap: Lenis smooth scroll + data-lf-reveal helper.
   All motion is skipped under prefers-reduced-motion. B2 layers Barba/SplitText on top. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduced && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.11 });
    window.lfLenis = lenis;
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // Scroll reveals: elements with [data-lf-reveal] fade/rise in once.
  var els = document.querySelectorAll('[data-lf-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('lf-revealed'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('lf-revealed'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
```

- [ ] **Step 4: Fix the global reduced-motion rule in `theme/assets/lf-tokens.css`**

Replace this block (added in Phase A):

```css
/* Accessibility hard requirement (spec §4): static glow, no flicker */
@media (prefers-reduced-motion: reduce) {
  .lf-flicker-on { animation: none; }
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

with this (scoped — JS motion self-guards via matchMedia; the blanket `*` rule would fight GSAP in B2):

```css
/* Accessibility hard requirement (spec §4): static glow, no flicker.
   Scoped on purpose — JS-driven motion guards itself via matchMedia. */
@media (prefers-reduced-motion: reduce) {
  .lf-flicker-on { animation: none; }
}
```

Then append the reveal utility at the end of the file:

```css
/* Scroll reveal (driven by lf-motion.js) */
[data-lf-reveal] { opacity: 0; transform: translateY(18px); transition: opacity .7s var(--lf-ease), transform .7s var(--lf-ease); }
[data-lf-reveal].lf-revealed { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  [data-lf-reveal] { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 5: Check + commit**

Run: `shopify theme check --path theme` → Expected: the 3 known RemoteAsset warnings only.

```bash
git add theme/assets && git commit -m "Vendor GSAP/Lenis, add motion bootstrap, scope reduced-motion rule"
```

### Task 2: Theme shell + header

**Files:**
- Modify (rewrite): `theme/layout/theme.liquid`
- Create: `theme/sections/lf-header.liquid`
- Modify: `theme/sections/header-group.json`

- [ ] **Step 1: Write `theme/layout/theme.liquid` (complete file)**

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    {% render 'meta-tags' %}
    {% render 'lf-fonts' %}
    {{ 'critical.css' | asset_url | stylesheet_tag }}
    {{ 'lf-tokens.css' | asset_url | stylesheet_tag }}
    <link rel="icon" href="{{ 'favicon-32.png' | asset_url }}" sizes="32x32" type="image/png">
    <link rel="apple-touch-icon" href="{{ 'favicon-180.png' | asset_url }}">
    {{ content_for_header }}
  </head>
  <body>
    {% sections 'header-group' %}
    <main id="lf-main">{{ content_for_layout }}</main>
    {% sections 'footer-group' %}
    {% section 'lf-cart-drawer' %}
    <script src="{{ 'gsap.min.js' | asset_url }}" defer></script>
    <script src="{{ 'ScrollTrigger.min.js' | asset_url }}" defer></script>
    <script src="{{ 'lenis.min.js' | asset_url }}" defer></script>
    <script src="{{ 'lf-motion.js' | asset_url }}" defer></script>
  </body>
</html>
```

(Note: `critical.css` loads before `lf-tokens.css` so LF body styles win while kept stock sections — 404/search/blog — stay functional. `lf-cart-drawer` is a layout-level section, rendered on every page.)

- [ ] **Step 2: Write `theme/sections/lf-header.liquid` (complete file)**

```liquid
<header class="lf-header">
  <a class="lf-header__home" href="{{ routes.root_url }}" aria-label="Laissez-Faire Leisure Club — home">
    <span class="lf-header__crest" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');" aria-hidden="true"></span>
  </a>
  <nav class="lf-header__nav" aria-label="Main">
    <a href="{{ routes.all_products_collection_url }}">Shop</a>
    <a href="/pages/story">Story</a>
  </nav>
  <button class="lf-header__cart" type="button" data-lf-cart-open aria-label="Open cart">
    Cart <span class="lf-header__count" data-lf-cart-count>{{ cart.item_count }}</span>
  </button>
  <button class="lf-header__burger" type="button" data-lf-menu-toggle aria-label="Menu" aria-expanded="false">
    <span></span><span></span>
  </button>
  <div class="lf-header__overlay" data-lf-menu hidden>
    <a href="{{ routes.all_products_collection_url }}" class="lf-display">Shop</a>
    <a href="/pages/story" class="lf-display">Story</a>
    <button type="button" class="lf-display" data-lf-cart-open>Cart</button>
  </div>
</header>

{% stylesheet %}
.lf-header {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: .9rem 1.25rem;
  background: color-mix(in srgb, var(--lf-ground) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #1a1a22;
}
.lf-header__crest {
  display: block; width: 30px; aspect-ratio: 300/320;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat;
  mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 4px var(--lf-neon-halo));
}
.lf-header__nav { display: flex; gap: 1.6rem; }
.lf-header__nav a, .lf-header__cart {
  font-family: var(--lf-font-body); font-size: .74rem; letter-spacing: .22em; text-transform: uppercase;
  color: var(--lf-body-text); text-decoration: none; background: none; border: 0; cursor: pointer; padding: 0;
}
.lf-header__nav a:hover, .lf-header__cart:hover { color: var(--lf-neon-core); }
.lf-header__count {
  display: inline-block; min-width: 1.3em; text-align: center; margin-left: .25em;
  color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo);
}
.lf-header__burger { display: none; background: none; border: 0; cursor: pointer; padding: .3rem; }
.lf-header__burger span { display: block; width: 22px; height: 2px; background: var(--lf-body-text); margin: 5px 0; }
.lf-header__overlay {
  position: fixed; inset: 0; z-index: 50; background: var(--lf-ground);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem;
}
.lf-header__overlay a, .lf-header__overlay button {
  font-size: 1.6rem; color: var(--lf-neon-core); text-shadow: 0 0 10px var(--lf-neon-halo);
  text-decoration: none; background: none; border: 0; cursor: pointer; letter-spacing: .18em; text-transform: uppercase;
}
@media (max-width: 749px) {
  .lf-header__nav, .lf-header__cart { display: none; }
  .lf-header__burger { display: block; }
}
{% endstylesheet %}

{% javascript %}
  var burger = document.querySelector('[data-lf-menu-toggle]');
  var overlay = document.querySelector('[data-lf-menu]');
  if (burger && overlay) {
    burger.addEventListener('click', function () {
      var open = overlay.hasAttribute('hidden');
      if (open) { overlay.removeAttribute('hidden'); } else { overlay.setAttribute('hidden', ''); }
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { overlay.setAttribute('hidden', ''); document.documentElement.style.overflow = ''; });
    });
  }
{% endjavascript %}

{% schema %}
{ "name": "LF Header", "settings": [] }
{% endschema %}
```

- [ ] **Step 3: Rewire `theme/sections/header-group.json` (complete file)**

```json
{
  "type": "header",
  "name": "Header group",
  "sections": { "lf_header": { "type": "lf-header", "settings": {} } },
  "order": ["lf_header"]
}
```

- [ ] **Step 4: Check + commit**

Run: `shopify theme check --path theme` → Expected: 3 known warnings only. (Do NOT delete stock `sections/header.liquid` yet — deletion happens in this same task only if `grep -rn "\"header\"" theme/sections/*.json theme/templates` shows no other reference; the group JSON above was its only consumer, so:)

```bash
grep -rn '"type": "header"' theme/sections theme/templates || echo OK-TO-DELETE
git rm theme/sections/header.liquid
git add -A && git commit -m "LF theme shell and header; rewire header group; drop stock header"
```

Expected: `OK-TO-DELETE` prints (only then delete).

> **Execution note (what actually happened):** the guard self-matched `header-group.json`'s mandatory top-level `"type": "header"` declaration — a plan-authoring artifact, not a real reference. The implementer verified no template/section references `sections/header.liquid` (nested `sections` entries reference only `lf-header`; no `{% section 'header' %}` anywhere) and deleted it. Deviation reviewed and accepted; Task 3's guard was rewritten to check nested references only.

### Task 3: Footer

**Files:**
- Create: `theme/sections/lf-footer.liquid`
- Modify: `theme/sections/footer-group.json`

- [ ] **Step 1: Write `theme/sections/lf-footer.liquid` (complete file)**

```liquid
<footer class="lf-footer">
  <div class="lf-footer__wordmark" role="img" aria-label="Laissez-Faire Leisure Club"
       style="--lf-wordmark: url('{{ 'lf-wordmark.png' | asset_url }}');" data-lf-reveal></div>
  <p class="lf-footer__club lf-display">Leisure Club</p>
  <div class="lf-footer__cols">
    <nav aria-label="Footer">
      <a href="{{ routes.all_products_collection_url }}">Shop</a>
      <a href="/pages/story">Story</a>
      {% if section.settings.instagram_url != blank %}<a href="{{ section.settings.instagram_url }}" rel="me noopener" target="_blank">Instagram</a>{% endif %}
      {% if section.settings.contact_email != blank %}<a href="mailto:{{ section.settings.contact_email }}">{{ section.settings.contact_email }}</a>{% endif %}
    </nav>
    <nav aria-label="Policies">
      {% for policy in shop.policies %}
        {% if policy != blank %}<a href="{{ policy.url }}">{{ policy.title }}</a>{% endif %}
      {% endfor %}
    </nav>
  </div>
  <div class="lf-footer__seal" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>
  <p class="lf-footer__legal">&copy; {{ 'now' | date: '%Y' }} Laissez-Faire Leisure Club — New Orleans</p>
</footer>

{% stylesheet %}
.lf-footer { padding: 4rem 1.25rem 2rem; text-align: center; border-top: 1px solid #1a1a22; }
.lf-footer__wordmark {
  width: min(88vw, 900px); aspect-ratio: 2129/749; margin: 0 auto;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-wordmark) center/contain no-repeat;
  mask: var(--lf-wordmark) center/contain no-repeat;
  filter: drop-shadow(0 0 8px var(--lf-neon-halo)) drop-shadow(0 0 30px var(--lf-neon-halo));
}
.lf-footer__club { font-size: .8rem; letter-spacing: .45em; color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); margin: .8rem 0 2.2rem; }
.lf-footer__cols { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; margin-bottom: 2rem; }
.lf-footer__cols nav { display: flex; flex-direction: column; gap: .55rem; }
.lf-footer__cols a { color: var(--lf-muted); font-size: .74rem; letter-spacing: .18em; text-transform: uppercase; text-decoration: none; }
.lf-footer__cols a:hover { color: var(--lf-neon-core); }
.lf-footer__seal { width: 40px; aspect-ratio: 300/320; margin: 0 auto 1rem; background-color: var(--lf-muted); -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat; opacity: .6; }
.lf-footer__legal { color: var(--lf-muted); font-size: .66rem; letter-spacing: .12em; }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Footer",
  "settings": [
    { "type": "url", "id": "instagram_url", "label": "Instagram URL" },
    { "type": "text", "id": "contact_email", "label": "Contact email" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Rewire `theme/sections/footer-group.json` (complete file)**

```json
{
  "type": "footer",
  "name": "Footer group",
  "sections": { "lf_footer": { "type": "lf-footer", "settings": {} } },
  "order": ["lf_footer"]
}
```

- [ ] **Step 3: Check + delete orphaned stock footer + commit**

> **Amendment (from Task 2 execution):** the original guard `grep -rn '"type": "footer"' ...` always self-matches the group JSON's own mandatory top-level `"type": "footer"` declaration, so it can never print `OK-TO-DELETE`. Use the nested-reference check below instead (it inspects only the group's `sections` entries, which is what actually determines whether `sections/footer.liquid` is still consumed).

```bash
shopify theme check --path theme
python3 -c "import json; d=json.load(open('theme/sections/footer-group.json')); print('OK-TO-DELETE' if all(s['type'] != 'footer' for s in d['sections'].values()) else 'STILL-REFERENCED')"
grep -rn "section 'footer'" theme/ || true
git rm theme/sections/footer.liquid
git add -A && git commit -m "LF footer with oversized wordmark; rewire footer group; drop stock footer"
```

Expected: 3 known warnings (+ the temporary `MissingTemplate` for `lf-cart-drawer` until Task 4); `OK-TO-DELETE` prints and the grep finds nothing before deletion.

### Task 4: Cart drawer

**Files:**
- Create: `theme/sections/lf-cart-drawer.liquid`

- [ ] **Step 1: Write `theme/sections/lf-cart-drawer.liquid` (complete file)**

```liquid
<div class="lf-drawer" data-lf-drawer hidden>
  <div class="lf-drawer__scrim" data-lf-cart-close></div>
  <aside class="lf-drawer__panel" role="dialog" aria-modal="true" aria-label="Cart">
    <div class="lf-drawer__head">
      <h2 class="lf-display">Cart</h2>
      <button type="button" class="lf-drawer__close" data-lf-cart-close aria-label="Close cart">&times;</button>
    </div>
    <div class="lf-drawer__items" data-lf-cart-items>
      {%- comment -%} Rendered/re-rendered by JS from /cart.js; server-rendered fallback below. {%- endcomment -%}
      {% for item in cart.items %}
        <div class="lf-drawer__item">
          <img src="{{ item.image | image_url: width: 120 }}" width="60" height="60" alt="">
          <div><p>{{ item.product_title }}</p><p class="muted">{{ item.variant_title }} × {{ item.quantity }}</p></div>
          <p>{{ item.final_line_price | money }}</p>
        </div>
      {% endfor %}
    </div>
    <div class="lf-drawer__foot">
      <div class="lf-drawer__subtotal"><span>Subtotal</span><span data-lf-cart-subtotal>{{ cart.total_price | money }}</span></div>
      <a href="{{ routes.cart_url }}/checkout" class="lf-drawer__checkout lf-display" data-lf-checkout>Checkout</a>
      <a href="{{ routes.cart_url }}" class="lf-drawer__cartlink">View cart page</a>
    </div>
  </aside>
</div>

{% stylesheet %}
.lf-drawer { position: fixed; inset: 0; z-index: 60; }
.lf-drawer__scrim { position: absolute; inset: 0; background: rgba(0,0,0,.55); }
.lf-drawer__panel {
  position: absolute; top: 0; right: 0; height: 100%; width: min(92vw, 400px);
  background: var(--lf-panel); border-left: 1px solid #22222a;
  display: flex; flex-direction: column;
  transform: translateX(100%); transition: transform .45s var(--lf-ease);
}
.lf-drawer.is-open .lf-drawer__panel { transform: none; }
@media (prefers-reduced-motion: reduce) { .lf-drawer__panel { transition: none; } }
.lf-drawer__head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.2rem; border-bottom: 1px solid #22222a; }
.lf-drawer__head h2 { font-size: .9rem; letter-spacing: .3em; color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); margin: 0; }
.lf-drawer__close { background: none; border: 0; color: var(--lf-body-text); font-size: 1.4rem; cursor: pointer; }
.lf-drawer__items { flex: 1; overflow-y: auto; padding: 1rem 1.2rem; }
.lf-drawer__item { display: grid; grid-template-columns: 60px 1fr auto; gap: .8rem; align-items: center; margin-bottom: 1rem; font-size: .8rem; }
.lf-drawer__item img { border: 1px solid #22222a; }
.lf-drawer__item p { margin: 0; }
.lf-drawer__item .muted, .lf-drawer__qty span { color: var(--lf-muted); font-size: .7rem; }
.lf-drawer__qty { display: inline-flex; gap: .6rem; align-items: center; margin-top: .3rem; }
.lf-drawer__qty button { background: none; border: 1px solid #2a2a33; color: var(--lf-body-text); width: 22px; height: 22px; cursor: pointer; }
.lf-drawer__foot { border-top: 1px solid #22222a; padding: 1rem 1.2rem; }
.lf-drawer__subtotal { display: flex; justify-content: space-between; font-size: .8rem; margin-bottom: .8rem; }
.lf-drawer__checkout {
  display: block; text-align: center; padding: .85rem; border: 1px solid var(--lf-neon-halo);
  color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); text-decoration: none; letter-spacing: .2em; font-size: .8rem;
}
.lf-drawer__checkout:hover { box-shadow: 0 0 18px var(--lf-neon-halo); }
.lf-drawer__cartlink { display: block; text-align: center; margin-top: .6rem; color: var(--lf-muted); font-size: .68rem; letter-spacing: .15em; text-transform: uppercase; }
.lf-drawer__empty { color: var(--lf-muted); text-align: center; margin-top: 2rem; font-size: .8rem; }
{% endstylesheet %}

{% javascript %}
  var drawer = document.querySelector('[data-lf-drawer]');
  if (drawer) {
    var itemsEl = drawer.querySelector('[data-lf-cart-items]');
    var subEl = drawer.querySelector('[data-lf-cart-subtotal]');
    var money = function (cents) { return '$' + (cents / 100).toFixed(2); };

    function render(cart) {
      document.querySelectorAll('[data-lf-cart-count]').forEach(function (el) { el.textContent = cart.item_count; });
      subEl.textContent = money(cart.total_price);
      if (!cart.items.length) { itemsEl.innerHTML = '<p class="lf-drawer__empty">The rack is empty.</p>'; return; }
      itemsEl.innerHTML = cart.items.map(function (it) {
        return '<div class="lf-drawer__item">' +
          '<img src="' + (it.image ? it.image.replace(/(\.[a-z]+)(\?|$)/, '_120x$1$2') : '') + '" width="60" height="60" alt="">' +
          '<div><p>' + it.product_title + '</p><p class="muted">' + (it.variant_title || '') + '</p>' +
          '<span class="lf-drawer__qty">' +
          '<button type="button" data-lf-qty="' + it.key + ':' + (it.quantity - 1) + '">−</button>' +
          '<span>' + it.quantity + '</span>' +
          '<button type="button" data-lf-qty="' + it.key + ':' + (it.quantity + 1) + '">+</button>' +
          '</span></div>' +
          '<p>' + money(it.final_line_price) + '</p></div>';
      }).join('');
    }

    function refresh() { return fetch('/cart.js').then(function (r) { return r.json(); }).then(render); }

    function open() { drawer.removeAttribute('hidden'); requestAnimationFrame(function () { drawer.classList.add('is-open'); }); refresh(); }
    function close() { drawer.classList.remove('is-open'); setTimeout(function () { drawer.setAttribute('hidden', ''); }, 460); }

    document.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-lf-cart-open]');
      var closeBtn = e.target.closest('[data-lf-cart-close]');
      var qtyBtn = e.target.closest('[data-lf-qty]');
      if (openBtn) { e.preventDefault(); open(); }
      if (closeBtn) { close(); }
      if (qtyBtn) {
        var parts = qtyBtn.getAttribute('data-lf-qty').split(':');
        fetch('/cart/change.js', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parts[0], quantity: Math.max(0, parseInt(parts[1], 10)) })
        }).then(function (r) { return r.json(); }).then(render);
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hasAttribute('hidden')) close(); });
    document.addEventListener('lf:cart:added', open);
  }
{% endjavascript %}

{% schema %}
{ "name": "LF Cart Drawer", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Check + commit**

Run: `shopify theme check --path theme` → 3 known warnings only.

```bash
git add theme/sections/lf-cart-drawer.liquid && git commit -m "AJAX cart drawer with quantity steppers and glowing checkout"
```

### Task 5: Hero slider

**Files:**
- Create: `theme/sections/lf-hero-slider.liquid`

- [ ] **Step 1: Write `theme/sections/lf-hero-slider.liquid` (complete file)**

```liquid
<section class="lf-hero" data-lf-hero data-autoplay="{{ section.settings.autoplay_seconds }}">
  {% for block in section.blocks %}
    <div class="lf-hero__slide {% if forloop.first %}is-active{% endif %}" {{ block.shopify_attributes }} data-lf-slide>
      {% if block.settings.image != blank %}
        {% if forloop.first %}{% assign img_loading = 'eager' %}{% else %}{% assign img_loading = 'lazy' %}{% endif %}
        {{ block.settings.image | image_url: width: 2400 | image_tag: class: 'lf-hero__img', loading: img_loading, alt: block.settings.heading }}
      {% endif %}
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__copy">
        {% if block.settings.kicker != blank %}<p class="lf-hero__kicker">{{ block.settings.kicker }}</p>{% endif %}
        {% if block.settings.heading != blank %}<h2 class="lf-hero__heading lf-display lf-glow-text">{{ block.settings.heading }}</h2>{% endif %}
        {% if block.settings.link != blank %}<a class="lf-hero__cta lf-display" href="{{ block.settings.link }}">{{ block.settings.cta_label | default: 'Shop' }}</a>{% endif %}
      </div>
    </div>
  {% endfor %}

  <div class="lf-hero__lockup">
    <div class="lf-hero__wordmark" role="img" aria-label="Laissez-Faire Leisure Club"
         style="--lf-wordmark: url('{{ 'lf-wordmark.png' | asset_url }}');"></div>
    <p class="lf-hero__club lf-display">Leisure Club</p>
  </div>

  <div class="lf-hero__ui">
    <button type="button" data-lf-prev aria-label="Previous slide">&larr;</button>
    <span class="lf-hero__num"><span data-lf-current>01</span> / <span data-lf-total>{{ section.blocks.size | prepend: '0' | slice: -2, 2 }}</span></span>
    <button type="button" data-lf-next aria-label="Next slide">&rarr;</button>
  </div>
</section>

{% stylesheet %}
.lf-hero { position: relative; height: 100svh; overflow: hidden; }
.lf-hero__slide { position: absolute; inset: 0; opacity: 0; transition: opacity .8s var(--lf-ease); }
.lf-hero__slide.is-active { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .lf-hero__slide { transition: none; } }
.lf-hero__img { width: 100%; height: 100%; object-fit: cover; }
.lf-hero__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(13,13,17,.55) 0%, rgba(13,13,17,.25) 45%, rgba(13,13,17,.8) 100%); }
.lf-hero__copy { position: absolute; left: 1.5rem; bottom: 5.5rem; text-align: left; max-width: 34ch; }
.lf-hero__kicker { font-family: var(--lf-font-body); font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-body-text); margin: 0 0 .5rem; }
.lf-hero__heading { font-size: clamp(1.4rem, 4.5vw, 2.6rem); margin: 0; }
.lf-hero__cta { display: inline-block; margin-top: 1rem; border: 1px solid var(--lf-neon-halo); color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); padding: .6rem 1.2rem; font-size: .72rem; letter-spacing: .2em; text-decoration: none; }
.lf-hero__lockup { position: absolute; top: 18%; left: 50%; transform: translateX(-50%); text-align: center; pointer-events: none; }
.lf-hero__wordmark {
  width: min(70vw, 520px); aspect-ratio: 2129/749;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-wordmark) center/contain no-repeat;
  mask: var(--lf-wordmark) center/contain no-repeat;
  filter: drop-shadow(0 0 6px var(--lf-neon-halo)) drop-shadow(0 0 26px var(--lf-neon-halo));
}
.lf-hero__club { font-size: clamp(.6rem, 1.6vw, .85rem); letter-spacing: .45em; color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); margin: .4rem 0 0; }
.lf-hero__ui { position: absolute; right: 1.5rem; bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
.lf-hero__ui button { background: none; border: 1px solid #2a2a33; color: var(--lf-body-text); width: 38px; height: 38px; cursor: pointer; font-size: 1rem; }
.lf-hero__ui button:hover { border-color: var(--lf-neon-halo); color: var(--lf-neon-core); }
.lf-hero__num { font-family: var(--lf-font-body); font-size: .72rem; letter-spacing: .2em; color: var(--lf-muted); }
{% endstylesheet %}

{% javascript %}
  var hero = document.querySelector('[data-lf-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-slide]'));
    var cur = hero.querySelector('[data-lf-current]');
    var i = 0, n = slides.length, timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var secs = parseInt(hero.getAttribute('data-autoplay'), 10) || 0;

    function go(next) {
      slides[i].classList.remove('is-active');
      i = (next + n) % n;
      slides[i].classList.add('is-active');
      cur.textContent = String(i + 1).padStart(2, '0');
    }
    function arm() { if (secs > 0 && !reduced && n > 1) { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, secs * 1000); } }
    hero.querySelector('[data-lf-next]').addEventListener('click', function () { go(i + 1); arm(); });
    hero.querySelector('[data-lf-prev]').addEventListener('click', function () { go(i - 1); arm(); });
    arm();
  }
{% endjavascript %}

{% schema %}
{
  "name": "LF Hero Slider",
  "settings": [
    { "type": "range", "id": "autoplay_seconds", "label": "Auto-advance (seconds, 0 = off)", "min": 0, "max": 12, "step": 1, "default": 6 }
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Slide",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text", "id": "kicker", "label": "Kicker", "default": "Drop 001" },
        { "type": "text", "id": "heading", "label": "Heading", "default": "Won't Bow Down" },
        { "type": "url", "id": "link", "label": "CTA link" },
        { "type": "text", "id": "cta_label", "label": "CTA label", "default": "Shop the Drop" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "LF Hero Slider", "blocks": [{ "type": "slide" }, { "type": "slide" }, { "type": "slide" }] }]
}
{% endschema %}
```

- [ ] **Step 2: Check + commit**

Run: `shopify theme check --path theme` → 3 known warnings only.

```bash
git add theme/sections/lf-hero-slider.liquid && git commit -m "Full-screen numbered hero slider with persistent neon lockup"
```

### Task 6: Featured story section

**Files:**
- Create: `theme/sections/lf-featured-story.liquid`

- [ ] **Step 1: Write `theme/sections/lf-featured-story.liquid` (complete file)**

```liquid
<section class="lf-fstory">
  {% for block in section.blocks %}
    {% assign product = block.settings.product %}
    <article class="lf-fstory__row {% cycle 'is-normal', 'is-flip' %}" {{ block.shopify_attributes }} data-lf-reveal>
      <a class="lf-fstory__media" href="{{ product.url }}">
        {% if product.featured_image %}
          {{ product.featured_image | image_url: width: 1200 | image_tag: loading: 'lazy', alt: product.title }}
        {% endif %}
      </a>
      <div class="lf-fstory__copy">
        <p class="lf-fstory__kicker">{{ block.settings.kicker }}</p>
        <h2 class="lf-display lf-glow-text">{{ product.title }}</h2>
        {% if block.settings.story != blank %}<p class="lf-script lf-fstory__script">{{ block.settings.story }}</p>{% endif %}
        <p class="lf-fstory__price">{{ product.price_min | money }}{% if product.price_varies %} — {{ product.price_max | money }}{% endif %}</p>
        <a class="lf-fstory__cta lf-display" href="{{ product.url }}">View</a>
      </div>
    </article>
  {% endfor %}
</section>

{% stylesheet %}
.lf-fstory { padding: 5rem 1.25rem; display: grid; gap: 5rem; max-width: 1080px; margin: 0 auto; }
.lf-fstory__row { display: grid; grid-template-columns: 1.15fr 1fr; gap: 2.5rem; align-items: center; }
.lf-fstory__row.is-flip .lf-fstory__media { order: 2; }
.lf-fstory__row.is-flip .lf-fstory__copy { order: 1; text-align: right; }
.lf-fstory__media img { width: 100%; height: auto; display: block; border: 1px solid #1e1e26; }
.lf-fstory__kicker { font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted); margin: 0 0 .6rem; }
.lf-fstory__copy h2 { font-size: clamp(1.3rem, 3.4vw, 2rem); margin: 0 0 .8rem; }
.lf-fstory__script { font-size: 1.05rem; margin: 0 0 .8rem; }
.lf-fstory__price { color: var(--lf-body-text); font-size: .85rem; margin: 0 0 1rem; }
.lf-fstory__cta { display: inline-block; border: 1px solid var(--lf-neon-halo); color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); padding: .55rem 1.3rem; font-size: .7rem; letter-spacing: .2em; text-decoration: none; }
@media (max-width: 749px) {
  .lf-fstory__row, .lf-fstory__row.is-flip .lf-fstory__media, .lf-fstory__row.is-flip .lf-fstory__copy { display: block; order: initial; text-align: left; }
  .lf-fstory__copy { margin-top: 1.2rem; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Featured Story",
  "settings": [],
  "blocks": [
    {
      "type": "feature",
      "name": "Featured product",
      "settings": [
        { "type": "product", "id": "product", "label": "Product" },
        { "type": "text", "id": "kicker", "label": "Kicker", "default": "Drop 001 — Featured" },
        { "type": "textarea", "id": "story", "label": "Script story line" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [{ "name": "LF Featured Story", "blocks": [{ "type": "feature" }, { "type": "feature" }] }]
}
{% endschema %}
```

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/sections/lf-featured-story.liquid && git commit -m "Alternating featured-story rows for hero graphics"
```

### Task 7: Drop grid

**Files:**
- Create: `theme/sections/lf-drop-grid.liquid`

- [ ] **Step 1: Write `theme/sections/lf-drop-grid.liquid` (complete file)**

```liquid
<section class="lf-dgrid" data-lf-reveal>
  <p class="lf-dgrid__kicker">{{ section.settings.kicker }}</p>
  <div class="lf-dgrid__grid">
    {% assign col = section.settings.collection | default: collections.all %}
    {% for product in col.products limit: section.settings.limit %}
      <a class="lf-dgrid__card" href="{{ product.url }}">
        <div class="lf-dgrid__imgwrap">
          {{ product.featured_image | image_url: width: 800 | image_tag: loading: 'lazy', alt: product.title, class: 'lf-dgrid__img is-primary' }}
          {% if product.images[1] %}
            {{ product.images[1] | image_url: width: 800 | image_tag: loading: 'lazy', alt: '', class: 'lf-dgrid__img is-alt' }}
          {% endif %}
        </div>
        <p class="lf-dgrid__name lf-display">{{ product.title }}</p>
        <p class="lf-dgrid__price">{{ product.price_min | money }}{% if product.price_varies %} — {{ product.price_max | money }}{% endif %}</p>
      </a>
    {% endfor %}
  </div>
  {% if section.settings.show_cta %}
    <a class="lf-dgrid__cta lf-display" href="{{ routes.all_products_collection_url }}">Shop the Full Drop</a>
  {% endif %}
</section>

{% stylesheet %}
.lf-dgrid { padding: 4rem 1.25rem; max-width: 1080px; margin: 0 auto; text-align: center; }
.lf-dgrid__kicker { font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted); margin: 0 0 1.6rem; }
.lf-dgrid__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.lf-dgrid__card { text-decoration: none; background: var(--lf-panel); border: 1px solid #1e1e26; padding-bottom: .8rem; }
.lf-dgrid__imgwrap { position: relative; }
.lf-dgrid__img { width: 100%; height: auto; display: block; }
.lf-dgrid__img.is-alt { position: absolute; inset: 0; opacity: 0; transition: opacity .35s var(--lf-ease); }
.lf-dgrid__card:hover .lf-dgrid__img.is-alt { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .lf-dgrid__img.is-alt { transition: none; } }
.lf-dgrid__name { color: var(--lf-body-text); font-size: .72rem; letter-spacing: .16em; margin: .7rem 0 .15rem; }
.lf-dgrid__price { color: var(--lf-muted); font-size: .72rem; margin: 0; }
.lf-dgrid__cta { display: inline-block; margin-top: 2rem; border: 1px solid var(--lf-neon-halo); color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); padding: .7rem 1.6rem; font-size: .72rem; letter-spacing: .2em; text-decoration: none; }
@media (max-width: 749px) { .lf-dgrid__grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Drop Grid",
  "settings": [
    { "type": "collection", "id": "collection", "label": "Collection" },
    { "type": "text", "id": "kicker", "label": "Kicker", "default": "Drop 001" },
    { "type": "range", "id": "limit", "label": "Products shown", "min": 2, "max": 12, "step": 1, "default": 6 },
    { "type": "checkbox", "id": "show_cta", "label": "Show Shop CTA", "default": true }
  ],
  "presets": [{ "name": "LF Drop Grid" }]
}
{% endschema %}
```

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/sections/lf-drop-grid.liquid && git commit -m "Drop grid with hover colorway swap"
```

### Task 8: Culture strip + email block + culture assets

**Files:**
- Create: `theme/assets/lf-culture-1.jpg`, `lf-culture-2.jpg`, `lf-culture-3.jpg`
- Create: `theme/sections/lf-culture-strip.liquid`, `theme/sections/lf-email-block.liquid`

- [ ] **Step 1: Curate + export three culture images**

Pick the three strongest images from `/Users/dow/Documents/Desktop - Operation’s MacBook Pro (2) - 2/Useable Filler Images/` (second-line + masking imagery — prefer one crowd/parade shot, one masking-suit portrait, one detail shot; final say is the user's at the Task 14 checkpoint). Note the directory name contains a right single quote (’) — quote paths carefully. Then:

```bash
cd /Users/dow/laissez-faire
SRC="/Users/dow/Documents/Desktop - Operation’s MacBook Pro (2) - 2/Useable Filler Images"
sips -Z 1400 -s format jpeg -s formatOptions 74 "$SRC/<chosen-1>.png" --out theme/assets/lf-culture-1.jpg
sips -Z 1400 -s format jpeg -s formatOptions 74 "$SRC/<chosen-2>.png" --out theme/assets/lf-culture-2.jpg
sips -Z 1400 -s format jpeg -s formatOptions 74 "$SRC/<chosen-3>.png" --out theme/assets/lf-culture-3.jpg
du -h theme/assets/lf-culture-*.jpg
```

Expected: three JPGs, each ≤ 450KB (drop `-Z` to 1100 for any that exceed it). Record which source files were chosen in the commit message.

- [ ] **Step 2: Write `theme/sections/lf-culture-strip.liquid` (complete file)**

> **Amendment (Task 8 execution):** `width="1000" height="1250"` was added to the fallback `<img>` below during implementation — `shopify theme check` raises an `ImgWidthAndHeight` error without them. The code block reflects the as-shipped file.

```liquid
<section class="lf-culture" data-lf-reveal>
  <p class="lf-culture__kicker">{{ section.settings.kicker }}</p>
  <div class="lf-culture__grid">
    {% for i in (1..3) %}
      {% assign key = 'image_' | append: i %}
      {% assign cap = 'caption_' | append: i %}
      <figure>
        {% if section.settings[key] != blank %}
          {{ section.settings[key] | image_url: width: 1000 | image_tag: loading: 'lazy', alt: section.settings[cap] }}
        {% else %}
          <img src="{{ 'lf-culture-' | append: i | append: '.jpg' | asset_url }}" width="1000" height="1250" loading="lazy" alt="{{ section.settings[cap] }}">
        {% endif %}
        {% if section.settings[cap] != blank %}<figcaption class="lf-script">{{ section.settings[cap] }}</figcaption>{% endif %}
      </figure>
    {% endfor %}
  </div>
  {% if section.settings.line != blank %}<p class="lf-culture__line">{{ section.settings.line }}</p>{% endif %}
</section>

{% stylesheet %}
.lf-culture { padding: 4rem 1.25rem; max-width: 1080px; margin: 0 auto; text-align: center; }
.lf-culture__kicker { font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted); margin: 0 0 1.4rem; }
.lf-culture__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.lf-culture__grid figure { margin: 0; }
.lf-culture__grid img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 4/5; display: block; border: 1px solid #1e1e26; }
.lf-culture__grid figcaption { color: #b8a25e; font-size: .85rem; margin-top: .45rem; }
.lf-culture__line { color: var(--lf-body-text); font-size: .85rem; max-width: 52ch; margin: 1.8rem auto 0; line-height: 1.7; }
@media (max-width: 749px) { .lf-culture__grid { grid-template-columns: 1fr; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Culture Strip",
  "settings": [
    { "type": "text", "id": "kicker", "label": "Kicker", "default": "Nouvelle-Orléans" },
    { "type": "image_picker", "id": "image_1", "label": "Image 1 (falls back to theme asset)" },
    { "type": "text", "id": "caption_1", "label": "Caption 1", "default": "second line" },
    { "type": "image_picker", "id": "image_2", "label": "Image 2" },
    { "type": "text", "id": "caption_2", "label": "Caption 2", "default": "big chief" },
    { "type": "image_picker", "id": "image_3", "label": "Image 3" },
    { "type": "text", "id": "caption_3", "label": "Caption 3", "default": "magnolia" },
    { "type": "textarea", "id": "line", "label": "Closing line", "default": "Not the tourist version. Black masking Indians, social aid & pleasure, jazz funerals — the city as canvas." }
  ],
  "presets": [{ "name": "LF Culture Strip" }]
}
{% endschema %}
```

- [ ] **Step 3: Write `theme/sections/lf-email-block.liquid` (complete file)**

```liquid
<section class="lf-email" data-lf-reveal>
  <div class="lf-email__crest" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>
  <p class="lf-email__prompt lf-script">{{ section.settings.prompt }}</p>
  {% form 'customer', class: 'lf-email__form' %}
    {%- comment -%} Note: contact[tags] only applies to NEW customer records; Shopify does not merge/apply this tag if the submitting email already exists as a customer. {%- endcomment -%}
    <input type="hidden" name="contact[tags]" value="teaser-list">
    {% if form.posted_successfully? %}
      <p class="lf-email__success">You're on the list.</p>
    {% else %}
      <div class="lf-email__row">
        <label class="visually-hidden" for="lf-email-home">Email</label>
        <input id="lf-email-home" type="email" name="contact[email]" required autocomplete="email" placeholder="you@example.com">
        <button type="submit" class="lf-display">Notify&nbsp;Me</button>
      </div>
      {% if form.errors %}<p class="lf-email__error" role="alert">{{ form.errors | default_errors }}</p>{% endif %}
    {% endif %}
  {% endform %}
</section>

{% stylesheet %}
.lf-email { padding: 4.5rem 1.25rem; text-align: center; }
.lf-email__crest { width: 54px; aspect-ratio: 300/320; margin: 0 auto 1rem; background-color: var(--lf-neon-core); -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat; filter: drop-shadow(0 0 5px var(--lf-neon-halo)) drop-shadow(0 0 16px var(--lf-neon-halo)); }
.lf-email__prompt { font-size: 1.1rem; margin: 0 0 1.1rem; }
.lf-email__row { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; }
.lf-email__row input { background: var(--lf-panel); border: 1px solid #26262e; color: var(--lf-body-text); padding: .8rem 1rem; min-width: min(60vw, 280px); font-family: var(--lf-font-body); }
.lf-email__row input:focus-visible { outline: 2px solid var(--lf-neon-halo); outline-offset: 2px; }
.lf-email__row button { background: transparent; border: 1px solid var(--lf-neon-halo); color: var(--lf-neon-core); text-shadow: 0 0 10px var(--lf-neon-halo); padding: .8rem 1.4rem; font-size: .8rem; cursor: pointer; }
.lf-email__row button:hover { box-shadow: 0 0 18px var(--lf-neon-halo); }
.lf-email__success { color: var(--lf-body-text); }
.lf-email__error { color: #ff8896; font-size: .85rem; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Email Block",
  "settings": [
    { "type": "text", "id": "prompt", "label": "Prompt", "default": "Be there when the lights come on." }
  ],
  "presets": [{ "name": "LF Email Block" }]
}
{% endschema %}
```

- [ ] **Step 4: Check + commit**

```bash
shopify theme check --path theme
git add theme/assets/lf-culture-*.jpg theme/sections/lf-culture-strip.liquid theme/sections/lf-email-block.liquid
git commit -m "Culture strip (chosen: <list source files>) and email capture block"
```

### Task 9: Homepage template + orphan cleanup

**Files:**
- Modify (rewrite): `theme/templates/index.json`
- Delete: `theme/sections/hello-world.liquid`, `theme/sections/custom-section.liquid`

- [ ] **Step 1: Write `theme/templates/index.json` (complete file)**

```json
{
  "sections": {
    "hero": {
      "type": "lf-hero-slider",
      "blocks": {
        "slide1": { "type": "slide", "settings": { "kicker": "Drop 001", "heading": "Won't Bow Down", "cta_label": "Shop the Drop", "link": "shopify://collections/all" } },
        "slide2": { "type": "slide", "settings": { "kicker": "Nouvelle-Orléans", "heading": "Kill 'Em Dead, Needle & Thread", "cta_label": "Our Story", "link": "shopify://pages/story" } }
      },
      "block_order": ["slide1", "slide2"],
      "settings": { "autoplay_seconds": 6 }
    },
    "featured": {
      "type": "lf-featured-story",
      "blocks": {
        "f1": { "type": "feature", "settings": { "kicker": "Drop 001 — Featured", "story": "Our Lady in blue neon — protection for the ones who move at night." } },
        "f2": { "type": "feature", "settings": { "kicker": "Drop 001 — Featured", "story": "The city's oldest mark, drawn in tube light." } }
      },
      "block_order": ["f1", "f2"]
    },
    "grid": { "type": "lf-drop-grid", "settings": { "kicker": "The Rest of the Drop", "limit": 6, "show_cta": true } },
    "culture": { "type": "lf-culture-strip", "settings": {} },
    "email": { "type": "lf-email-block", "settings": {} }
  },
  "order": ["hero", "featured", "grid", "culture", "email"]
}
```

(Hero slide images and featured products are content, assigned in the theme editor at Task 14 — image_picker/product settings can't reference files from JSON. The sections render gracefully without them meanwhile.)

- [ ] **Step 2: Verify orphans, delete, check, commit**

```bash
grep -rn 'hello-world\|custom-section' theme/templates theme/sections/*.json || echo OK-TO-DELETE
git rm theme/sections/hello-world.liquid theme/sections/custom-section.liquid
shopify theme check --path theme
git add -A && git commit -m "Wire Editorial Scroll homepage; drop Skeleton demo sections"
```

Expected: `OK-TO-DELETE`; 3 known warnings.

### Task 10: Shop grid (collection)

**Files:**
- Create: `theme/sections/lf-collection.liquid`
- Modify (rewrite): `theme/templates/collection.json`
- Delete: `theme/sections/collection.liquid`, `theme/sections/collections.liquid`

- [ ] **Step 1: Write `theme/sections/lf-collection.liquid` (complete file)**

```liquid
<section class="lf-shop">
  <header class="lf-shop__head">
    <h1 class="lf-display lf-glow-text">{{ collection.title }}</h1>
    <p class="lf-shop__count">{{ collection.products_count }} pieces</p>
  </header>
  <div class="lf-shop__grid">
    {% paginate collection.products by 24 %}
      {% for product in collection.products %}
        <a class="lf-shop__card" href="{{ product.url }}" data-lf-reveal>
          <div class="lf-shop__imgwrap">
            {{ product.featured_image | image_url: width: 900 | image_tag: loading: 'lazy', alt: product.title, class: 'lf-shop__img is-primary' }}
            {% if product.images[1] %}
              {{ product.images[1] | image_url: width: 900 | image_tag: loading: 'lazy', alt: '', class: 'lf-shop__img is-alt' }}
            {% endif %}
          </div>
          <p class="lf-shop__name lf-display">{{ product.title }}</p>
          <p class="lf-shop__price">{{ product.price_min | money }}{% if product.price_varies %} — {{ product.price_max | money }}{% endif %}</p>
        </a>
      {% endfor %}
      {% if paginate.pages > 1 %}
        <nav class="lf-shop__pagination" aria-label="Pagination">
          {% if paginate.previous %}<a href="{{ paginate.previous.url }}">&larr; Prev</a>{% endif %}
          {% if paginate.next %}<a href="{{ paginate.next.url }}">Next &rarr;</a>{% endif %}
        </nav>
      {% endif %}
    {% endpaginate %}
  </div>
</section>

{% stylesheet %}
.lf-shop { padding: 3rem 1.25rem 5rem; max-width: 1180px; margin: 0 auto; }
.lf-shop__head { text-align: center; margin-bottom: 2.2rem; }
.lf-shop__head h1 { font-size: clamp(1.4rem, 4vw, 2.2rem); margin: 0 0 .3rem; }
.lf-shop__count { color: var(--lf-muted); font-size: .7rem; letter-spacing: .25em; text-transform: uppercase; }
.lf-shop__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.lf-shop__card { text-decoration: none; background: var(--lf-panel); border: 1px solid #1e1e26; padding-bottom: .9rem; text-align: center; }
.lf-shop__imgwrap { position: relative; }
.lf-shop__img { width: 100%; height: auto; display: block; }
.lf-shop__img.is-alt { position: absolute; inset: 0; opacity: 0; transition: opacity .35s var(--lf-ease); }
.lf-shop__card:hover .lf-shop__img.is-alt { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .lf-shop__img.is-alt { transition: none; } }
.lf-shop__name { color: var(--lf-body-text); font-size: .76rem; letter-spacing: .16em; margin: .8rem 0 .2rem; }
.lf-shop__price { color: var(--lf-muted); font-size: .74rem; margin: 0; }
.lf-shop__pagination { grid-column: 1 / -1; display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem; }
.lf-shop__pagination a { color: var(--lf-neon-core); text-decoration: none; letter-spacing: .15em; font-size: .78rem; }
@media (max-width: 749px) { .lf-shop__grid { grid-template-columns: repeat(2, 1fr); gap: 9px; } }
{% endstylesheet %}

{% schema %}
{ "name": "LF Collection", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Write `theme/templates/collection.json` (complete file)**

```json
{
  "sections": { "main": { "type": "lf-collection", "settings": {} } },
  "order": ["main"]
}
```

- [ ] **Step 3: Verify orphans, delete, check, commit**

```bash
grep -rn '"type": "collection"\|"type": "collections"' theme/templates theme/sections/*.json || echo OK-TO-DELETE
git rm theme/sections/collection.liquid theme/sections/collections.liquid
shopify theme check --path theme
git add -A && git commit -m "LF shop grid with hover swap; drop stock collection sections"
```

Note: `templates/list-collections.json` references the stock `collections` section — check it first; if it does, rewire `list-collections.json` to `lf-collection`? No — `list-collections` lists collections, not products, and is unreachable from our nav. Rewrite `theme/templates/list-collections.json` to:

```json
{
  "sections": { "main": { "type": "lf-collection", "settings": {} } },
  "order": ["main"]
}
```

is WRONG (different context object). Instead: leave `list-collections.json` pointing at whatever it references — if it references `collections.liquid`, KEEP `collections.liquid` (do not delete it) and only delete `collection.liquid`. The grep in this step is authoritative: delete only what greps clean.

### Task 11: PDP + related row

**Files:**
- Create: `theme/sections/lf-product.liquid`, `theme/sections/lf-related.liquid`
- Modify (rewrite): `theme/templates/product.json`
- Delete: `theme/sections/product.liquid` (only if grep-clean)

- [ ] **Step 1: Write `theme/sections/lf-product.liquid` (complete file)**

```liquid
<section class="lf-pdp" data-lf-pdp>
  <div class="lf-pdp__gallery" data-lf-gallery>
    {% for media in product.media %}
      <div class="lf-pdp__slide {% if forloop.first %}is-active{% endif %}" data-lf-gslide data-alt="{{ media.alt | escape }}">
        {% if forloop.first %}{% assign img_loading = 'eager' %}{% else %}{% assign img_loading = 'lazy' %}{% endif %}
        {{ media | image_url: width: 1400 | image_tag: loading: img_loading, alt: media.alt | default: product.title }}
      </div>
    {% endfor %}
    {% if product.media.size > 1 %}
      <div class="lf-pdp__gnav">
        <button type="button" data-lf-gprev aria-label="Previous image">&larr;</button>
        <span data-lf-gnum>1 / {{ product.media.size }}</span>
        <button type="button" data-lf-gnext aria-label="Next image">&rarr;</button>
      </div>
    {% endif %}
  </div>

  <div class="lf-pdp__buy">
    <h1 class="lf-display lf-glow-text">{{ product.title }}</h1>
    <p class="lf-pdp__price" data-lf-price>{{ product.selected_or_first_available_variant.price | money }}</p>
    {% assign edition = product.metafields.lf.edition_size %}
    {% if edition != blank %}<p class="lf-pdp__edition">Edition of {{ edition }}</p>{% endif %}
    {% assign story = product.metafields.lf.story %}
    {% if story != blank %}<p class="lf-script lf-pdp__story">{{ story }}</p>{% endif %}
    {% if product.description != blank %}<div class="lf-pdp__desc">{{ product.description }}</div>{% endif %}

    {% form 'product', product, data-lf-form: '' %}
      {% assign current = product.selected_or_first_available_variant %}
      <input type="hidden" name="id" value="{{ current.id }}" data-lf-variant-id>
      {% for option in product.options_with_values %}
        <fieldset class="lf-pdp__opt">
          <legend>{{ option.name }}</legend>
          {% for value in option.values %}
            <label>
              <input type="radio" name="lf-opt-{{ forloop.parentloop.index0 }}" value="{{ value | escape }}"
                     {% if option.selected_value == value %}checked{% endif %}>
              <span>{{ value }}</span>
            </label>
          {% endfor %}
        </fieldset>
      {% endfor %}
      <button type="submit" class="lf-pdp__add lf-display" data-lf-add>
        Add to Cart — <span data-lf-add-price>{{ current.price | money }}</span>
      </button>
      <p class="lf-pdp__soldout" data-lf-soldout hidden>Sold out — this one's gone.</p>
    {% endform %}

    <div class="lf-pdp__accordion">
      {% for i in (1..3) %}
        {% assign t = 'acc_title_' | append: i %}
        {% assign b = 'acc_body_' | append: i %}
        {% if section.settings[t] != blank %}
          <details>
            <summary>{{ section.settings[t] }}</summary>
            <div>{{ section.settings[b] }}</div>
          </details>
        {% endif %}
      {% endfor %}
    </div>
  </div>

  <script type="application/json" data-lf-variants>
    [{% for v in product.variants %}{"id":{{ v.id }},"available":{{ v.available }},"price":"{{ v.price | money }}","options":{{ v.options | json }}}{% unless forloop.last %},{% endunless %}{% endfor %}]
  </script>
</section>

{% stylesheet %}
.lf-pdp { display: grid; grid-template-columns: 1.15fr 1fr; gap: 2.5rem; max-width: 1180px; margin: 0 auto; padding: 2.5rem 1.25rem 5rem; align-items: start; }
.lf-pdp__gallery { position: relative; }
.lf-pdp__slide { display: none; }
.lf-pdp__slide.is-active { display: block; }
.lf-pdp__slide img { width: 100%; height: auto; display: block; border: 1px solid #1e1e26; }
.lf-pdp__gnav { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: .8rem; }
.lf-pdp__gnav button { background: none; border: 1px solid #2a2a33; color: var(--lf-body-text); width: 34px; height: 34px; cursor: pointer; }
.lf-pdp__gnav button:hover { border-color: var(--lf-neon-halo); color: var(--lf-neon-core); }
.lf-pdp__gnav span { color: var(--lf-muted); font-size: .72rem; letter-spacing: .2em; }
.lf-pdp__buy { position: sticky; top: 5rem; }
.lf-pdp__buy h1 { font-size: clamp(1.4rem, 3.6vw, 2.1rem); margin: 0 0 .4rem; }
.lf-pdp__price { font-size: 1rem; color: var(--lf-body-text); margin: 0 0 .2rem; }
.lf-pdp__edition { color: var(--lf-muted); font-size: .7rem; letter-spacing: .25em; text-transform: uppercase; margin: 0 0 1rem; }
.lf-pdp__story { font-size: 1.05rem; margin: 0 0 .8rem; }
.lf-pdp__desc { color: var(--lf-body-text); font-size: .84rem; line-height: 1.65; margin-bottom: 1.4rem; }
.lf-pdp__opt { border: 0; padding: 0; margin: 0 0 1.1rem; }
.lf-pdp__opt legend { font-size: .66rem; letter-spacing: .28em; text-transform: uppercase; color: var(--lf-muted); margin-bottom: .5rem; }
.lf-pdp__opt label { display: inline-block; margin: 0 .4rem .4rem 0; cursor: pointer; }
.lf-pdp__opt input { position: absolute; opacity: 0; pointer-events: none; }
.lf-pdp__opt span { display: inline-block; border: 1px solid #2a2a33; color: var(--lf-body-text); font-size: .74rem; padding: .45rem .8rem; }
.lf-pdp__opt input:checked + span { border-color: var(--lf-neon-halo); color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); }
.lf-pdp__opt input:focus-visible + span { outline: 2px solid var(--lf-neon-halo); outline-offset: 2px; }
.lf-pdp__add { width: 100%; background: transparent; border: 1px solid var(--lf-neon-halo); color: var(--lf-neon-core); text-shadow: 0 0 10px var(--lf-neon-halo); padding: .95rem; font-size: .82rem; letter-spacing: .2em; cursor: pointer; margin-top: .4rem; }
.lf-pdp__add:hover { box-shadow: 0 0 20px var(--lf-neon-halo); }
.lf-pdp__add[disabled] { opacity: .35; cursor: not-allowed; box-shadow: none; }
.lf-pdp__soldout { color: #ff8896; font-size: .8rem; }
.lf-pdp__accordion { margin-top: 1.6rem; }
.lf-pdp__accordion details { border-top: 1px solid #22222a; padding: .7rem 0; }
.lf-pdp__accordion summary { cursor: pointer; color: var(--lf-body-text); font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; }
.lf-pdp__accordion div { color: var(--lf-muted); font-size: .8rem; line-height: 1.6; padding-top: .5rem; }
@media (max-width: 849px) { .lf-pdp { display: block; } .lf-pdp__buy { position: static; margin-top: 1.4rem; } }
{% endstylesheet %}

{% javascript %}
  var pdp = document.querySelector('[data-lf-pdp]');
  if (pdp) {
    var variants = JSON.parse(pdp.querySelector('[data-lf-variants]').textContent);
    var form = pdp.querySelector('form');
    var idInput = pdp.querySelector('[data-lf-variant-id]');
    var priceEl = pdp.querySelector('[data-lf-price]');
    var addBtn = pdp.querySelector('[data-lf-add]');
    var addPrice = pdp.querySelector('[data-lf-add-price]');
    var soldEl = pdp.querySelector('[data-lf-soldout]');
    var slides = Array.prototype.slice.call(pdp.querySelectorAll('[data-lf-gslide]'));
    var gnum = pdp.querySelector('[data-lf-gnum]');
    var gi = 0;

    function selectedOptions() {
      var opts = [];
      pdp.querySelectorAll('.lf-pdp__opt').forEach(function (fs, idx) {
        var checked = fs.querySelector('input:checked');
        opts[idx] = checked ? checked.value : null;
      });
      return opts;
    }
    function findVariant(opts) {
      return variants.find(function (v) { return v.options.every(function (o, idx) { return o === opts[idx]; }); });
    }
    function showSlide(n) {
      if (!slides.length) return;
      slides[gi].classList.remove('is-active');
      gi = (n + slides.length) % slides.length;
      slides[gi].classList.add('is-active');
      if (gnum) gnum.textContent = (gi + 1) + ' / ' + slides.length;
    }
    function syncGalleryTo(garment) {
      // Image alt convention: alt starts with the garment option value (e.g. "Tee — Black").
      var target = slides.findIndex(function (s) { return (s.getAttribute('data-alt') || '').indexOf(garment) === 0; });
      if (target >= 0) showSlide(target);
    }
    function update() {
      var opts = selectedOptions();
      var v = findVariant(opts);
      if (v) {
        idInput.value = v.id;
        priceEl.textContent = v.price;
        addPrice.textContent = v.price;
        addBtn.disabled = !v.available;
        soldEl.hidden = v.available;
      }
      if (opts[0]) syncGalleryTo(opts[0]);
    }
    pdp.querySelectorAll('.lf-pdp__opt input').forEach(function (r) { r.addEventListener('change', update); });
    var prev = pdp.querySelector('[data-lf-gprev]'); var next = pdp.querySelector('[data-lf-gnext]');
    if (prev) prev.addEventListener('click', function () { showSlide(gi - 1); });
    if (next) next.addEventListener('click', function () { showSlide(gi + 1); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      addBtn.disabled = true;
      fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(idInput.value, 10), quantity: 1 })
      }).then(function (r) {
        if (!r.ok) throw new Error('add-to-cart failed');
        return r.json();
      }).then(function () {
        addBtn.disabled = false;
        document.dispatchEvent(new CustomEvent('lf:cart:added'));
      }).catch(function () {
        addBtn.disabled = false;
        window.location.href = '/cart';
      });
    });
    update();
  }
{% endjavascript %}

{% schema %}
{
  "name": "LF Product",
  "settings": [
    { "type": "text", "id": "acc_title_1", "label": "Accordion 1 title", "default": "Materials & Care" },
    { "type": "textarea", "id": "acc_body_1", "label": "Accordion 1 body", "default": "Heavyweight cotton. Wash cold, inside out, hang dry. Built to break in, not break down." },
    { "type": "text", "id": "acc_title_2", "label": "Accordion 2 title", "default": "Sizing" },
    { "type": "textarea", "id": "acc_body_2", "label": "Accordion 2 body", "default": "Cut roomy through the chest — New Orleans proportions. Between sizes, size down." },
    { "type": "text", "id": "acc_title_3", "label": "Accordion 3 title", "default": "Shipping" },
    { "type": "textarea", "id": "acc_body_3", "label": "Accordion 3 body", "default": "Ships from New Orleans within 3–5 business days." }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Write `theme/sections/lf-related.liquid` (complete file)**

```liquid
<section class="lf-related" data-lf-reveal>
  <p class="lf-related__kicker">More from the Drop</p>
  <div class="lf-related__grid">
    {% assign shown = 0 %}
    {% for p in collections.all.products %}
      {% if p.id != product.id and shown < 3 %}
        {% assign shown = shown | plus: 1 %}
        <a class="lf-related__card" href="{{ p.url }}">
          <div class="lf-related__imgwrap">
            {{ p.featured_image | image_url: width: 700 | image_tag: loading: 'lazy', alt: p.title, class: 'lf-related__img is-primary' }}
            {% if p.images[1] %}{{ p.images[1] | image_url: width: 700 | image_tag: loading: 'lazy', alt: '', class: 'lf-related__img is-alt' }}{% endif %}
          </div>
          <p class="lf-related__name lf-display">{{ p.title }}</p>
          <p class="lf-related__price">{{ p.price_min | money }}{% if p.price_varies %} — {{ p.price_max | money }}{% endif %}</p>
        </a>
      {% endif %}
    {% endfor %}
  </div>
</section>

{% stylesheet %}
.lf-related { padding: 0 1.25rem 5rem; max-width: 1180px; margin: 0 auto; text-align: center; }
.lf-related__kicker { font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted); margin: 0 0 1.4rem; }
.lf-related__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.lf-related__card { text-decoration: none; background: var(--lf-panel); border: 1px solid #1e1e26; padding-bottom: .8rem; }
.lf-related__imgwrap { position: relative; }
.lf-related__img { width: 100%; height: auto; display: block; }
.lf-related__img.is-alt { position: absolute; inset: 0; opacity: 0; transition: opacity .35s var(--lf-ease); }
.lf-related__card:hover .lf-related__img.is-alt { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .lf-related__img.is-alt { transition: none; } }
.lf-related__name { color: var(--lf-body-text); font-size: .72rem; letter-spacing: .16em; margin: .7rem 0 .15rem; }
.lf-related__price { color: var(--lf-muted); font-size: .72rem; margin: 0; }
@media (max-width: 749px) { .lf-related__grid { grid-template-columns: 1fr 1fr; gap: 8px; } }
{% endstylesheet %}

{% schema %}
{ "name": "LF Related", "settings": [] }
{% endschema %}
```

- [ ] **Step 3: Write `theme/templates/product.json` (complete file)**

```json
{
  "sections": {
    "main": { "type": "lf-product", "settings": {} },
    "related": { "type": "lf-related", "settings": {} }
  },
  "order": ["main", "related"]
}
```

- [ ] **Step 4: Verify orphan, delete, check, commit**

```bash
grep -rn '"type": "product"' theme/templates theme/sections/*.json || echo OK-TO-DELETE
git rm theme/sections/product.liquid
shopify theme check --path theme
git add -A && git commit -m "Split PDP with variant-synced gallery, AJAX add-to-cart, related row"
```

Expected: `OK-TO-DELETE` (only then delete); 3 known warnings.

### Task 12: Story page

**Files:**
- Create: `theme/sections/lf-story.liquid`, `theme/templates/page.story.json`

- [ ] **Step 1: Write `theme/sections/lf-story.liquid` (complete file)**

```liquid
<section class="lf-story">
  <header class="lf-story__head" data-lf-reveal>
    <p class="lf-story__kicker">Est. New Orleans</p>
    <h1 class="lf-display lf-glow-text">{{ page.title }}</h1>
  </header>
  <div class="lf-story__manifesto lf-script" data-lf-reveal>{{ section.settings.manifesto }}</div>
  <div class="lf-story__pillars">
    {% for i in (1..4) %}
      {% assign t = 'pillar_title_' | append: i %}
      {% assign b = 'pillar_body_' | append: i %}
      {% if section.settings[t] != blank %}
        <div class="lf-story__pillar" data-lf-reveal>
          <h2 class="lf-display">{{ section.settings[t] }}</h2>
          <p>{{ section.settings[b] }}</p>
        </div>
      {% endif %}
    {% endfor %}
  </div>
  {% if page.content != blank %}<div class="lf-story__content" data-lf-reveal>{{ page.content }}</div>{% endif %}
  <div class="lf-story__seal" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');" data-lf-reveal></div>
</section>

{% stylesheet %}
.lf-story { max-width: 760px; margin: 0 auto; padding: 3.5rem 1.25rem 5rem; text-align: center; }
.lf-story__kicker { font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted); margin: 0 0 .5rem; }
.lf-story__head h1 { font-size: clamp(1.5rem, 4.5vw, 2.4rem); margin: 0 0 2rem; }
.lf-story__manifesto { font-size: clamp(1.1rem, 2.6vw, 1.45rem); line-height: 1.75; color: var(--lf-body-text); margin-bottom: 3rem; white-space: pre-line; }
.lf-story__pillars { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6rem; text-align: left; margin-bottom: 3rem; }
.lf-story__pillar { background: var(--lf-panel); border: 1px solid #1e1e26; padding: 1.2rem; }
.lf-story__pillar h2 { font-size: .82rem; letter-spacing: .18em; color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); margin: 0 0 .5rem; }
.lf-story__pillar p { color: var(--lf-body-text); font-size: .82rem; line-height: 1.65; margin: 0; }
.lf-story__content { color: var(--lf-body-text); font-size: .9rem; line-height: 1.7; text-align: left; margin-bottom: 3rem; }
.lf-story__seal { width: 60px; aspect-ratio: 300/320; margin: 0 auto; background-color: var(--lf-neon-core); -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat; filter: drop-shadow(0 0 5px var(--lf-neon-halo)) drop-shadow(0 0 16px var(--lf-neon-halo)); }
@media (max-width: 649px) { .lf-story__pillars { grid-template-columns: 1fr; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Story",
  "settings": [
    { "type": "textarea", "id": "manifesto", "label": "Manifesto", "default": "Laissez-Faire exists to preserve culture through craftsmanship. Inspired by the streets of New Orleans and informed by heritage workwear, each garment is designed to carry history forward. French elegance, Spanish colonial influence, African American cultural traditions, and Japanese attention to detail converge to create clothing that is built with intention, worn with confidence, and made to endure.\nWe believe luxury is not excess — it is mastery. Every stitch tells a story. Every collection honors a legacy." },
    { "type": "text", "id": "pillar_title_1", "label": "Pillar 1 title", "default": "New Orleans Heritage" },
    { "type": "textarea", "id": "pillar_body_1", "label": "Pillar 1 body", "default": "Not the tourist version. Black masking Indians, second lines, social aid & pleasure clubs, jazz funerals, ironwork, magnolias — the city as canvas." },
    { "type": "text", "id": "pillar_title_2", "label": "Pillar 2 title", "default": "French & Spanish Colonial" },
    { "type": "textarea", "id": "pillar_body_2", "label": "Pillar 2 body", "default": "Fleur-de-lis, baroque ornament, Catholic iconography, wrought iron, antique maps — the name earns its place." },
    { "type": "text", "id": "pillar_title_3", "label": "Pillar 3 title", "default": "African American Excellence" },
    { "type": "textarea", "id": "pillar_body_3", "label": "Pillar 3 body", "default": "Craftsmanship, resilience, and cultural creation — masking, music, tailoring, family legacy, celebration." },
    { "type": "text", "id": "pillar_title_4", "label": "Pillar 4 title", "default": "Japanese Design Philosophy" },
    { "type": "textarea", "id": "pillar_body_4", "label": "Pillar 4 body", "default": "Slow fashion, premium fabric, beautiful aging, functional construction. Every stitch has a purpose." }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Write `theme/templates/page.story.json` (complete file)**

```json
{
  "sections": { "main": { "type": "lf-story", "settings": {} } },
  "order": ["main"]
}
```

- [ ] **Step 3 (OPERATOR ACTION, at Task 14 checkpoint):** Admin → Online Store → Pages → Add page — title "Story", handle `story`, theme template `story`. (Nav links `/pages/story` already point there.)

- [ ] **Step 4: Check + commit**

```bash
shopify theme check --path theme
git add theme/sections/lf-story.liquid theme/templates/page.story.json && git commit -m "Story page with manifesto and four pillars"
```

### Task 13: Drop 001 catalog — products, images, metafields

**Files:**
- Create: `scripts/create-products.mjs` (repo root — NOT inside `theme/`)
- Create: `scripts/product-images/` (18 prepped JPGs)

- [ ] **Step 1 (OPERATOR ACTION — required before Step 4):**

> **Amendment (Task 13 execution):** Shopify's 2026 custom-app overhaul removed the legacy "Develop apps" store-admin flow and its static Admin API tokens. The actual mechanism: create the app in the **Dev Dashboard** (dev.shopify.com), add Admin API scopes `write_products` + `read_products` to a version, **Release** it, then from the app's Home page **Install app** on the store. There is no revealable admin token — the script exchanges the app's **Client ID + Secret** for a ~24h access token via the OAuth **client credentials grant** (`POST /admin/oauth/access_token`), which works because the app and store share an organization. Store the Secret (Settings → Credentials → Secret, eye icon) in Keychain from your own terminal (silent input — never paste into chat or plain shell history):

```bash
read -s LF_SECRET && security add-generic-password -a lf -s lf-shopify-client-secret -w "$LF_SECRET" && unset LF_SECRET
```

(The Client ID is not secret and is hardcoded in the script. The original plan's `lf-shopify-admin-token` Keychain item is obsolete.)

- [ ] **Step 2: Prep the 18 product images with the alt-mapping filename convention**

```bash
cd /Users/dow/laissez-faire && mkdir -p scripts/product-images
SRC="/Users/dow/Desktop/LF Site Clothing Mockups"
for g in casamigo fluerdelis magnolia maria sig skull; do
  for v in black-mockup greyhood whitemockup white-mockup; do
    [ -f "$SRC/$g-$v.jpg" ] && sips -Z 1600 -s format jpeg -s formatOptions 78 "$SRC/$g-$v.jpg" --out "scripts/product-images/$g-$v.jpg" >/dev/null
  done
done
ls scripts/product-images | wc -l
```

Expected: `18` (note: maria uses `white-mockup`, others use `whitemockup` — the loop tries both spellings).

- [ ] **Step 3: Write `scripts/create-products.mjs` (complete file)**

```js
#!/usr/bin/env node
/* Creates the six Drop 001 products on 1xiwxi-yy.myshopify.com via Admin GraphQL.
   Idempotent-ish: skips any product whose handle already exists.
   Token: macOS Keychain item `lf-shopify-admin-token` (never hardcoded). */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SHOP = '1xiwxi-yy.myshopify.com';
const API = `https://${SHOP}/admin/api/2025-10/graphql.json`;
const TOKEN = execSync('security find-generic-password -a lf -s lf-shopify-admin-token -w', { encoding: 'utf8' }).trim();
const IMG_DIR = path.join(import.meta.dirname, 'product-images');

const GARMENTS = [
  { value: 'Tee — Black', price: '75.00', file: g => `${g}-black-mockup.jpg` },
  { value: 'Tee — White', price: '75.00', file: g => (g === 'maria' ? `${g}-white-mockup.jpg` : `${g}-whitemockup.jpg`) },
  { value: 'Hoodie — Grey', price: '150.00', file: g => `${g}-greyhood.jpg` },
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const PRODUCTS = [
  { slug: 'casamigo',   title: 'Casamigo',     story: 'Friends of the house — good company, kept forever.' },
  { slug: 'fluerdelis', title: 'Fleur-de-Lis', story: "The city's oldest mark, drawn in tube light." },
  { slug: 'magnolia',   title: 'Magnolia',     story: 'The state flower, blooming after dark.' },
  { slug: 'maria',      title: 'Maria',        story: 'Our Lady in blue neon — protection for the ones who move at night.' },
  { slug: 'sig',        title: 'Signature',    story: 'The name, signed in light. Effortless excellence.' },
  { slug: 'skull',      title: 'Skull',        story: "Kill 'em dead, needle & thread." },
];

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function stagedUpload(filename) {
  const data = await gql(`
    mutation($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`, { input: [{ filename, mimeType: 'image/jpeg', httpMethod: 'POST', resource: 'IMAGE' }] });
  const t = data.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  t.parameters.forEach(p => form.append(p.name, p.value));
  form.append('file', new Blob([readFileSync(path.join(IMG_DIR, filename))], { type: 'image/jpeg' }), filename);
  const up = await fetch(t.url, { method: 'POST', body: form });
  if (!up.ok) throw new Error(`upload failed for ${filename}: ${up.status}`);
  return t.resourceUrl;
}

async function exists(handle) {
  const d = await gql(`query($h: String!) { productByHandle(handle: $h) { id } }`, { h: handle });
  return Boolean(d.productByHandle);
}

async function createProduct(p) {
  if (await exists(p.slug)) { console.log(`SKIP ${p.title} (handle exists)`); return; }

  const media = [];
  for (const g of GARMENTS) {
    const url = await stagedUpload(g.file(p.slug));
    media.push({ originalSource: url, alt: `${g.value} — ${p.title}`, mediaContentType: 'IMAGE' });
  }

  const variants = [];
  for (const g of GARMENTS) for (const s of SIZES) {
    variants.push({ price: g.price, optionValues: [{ optionName: 'Garment', name: g.value }, { optionName: 'Size', name: s }] });
  }

  const d = await gql(`
    mutation($input: ProductSetInput!) {
      productSet(input: $input, synchronous: true) {
        product { id handle variants(first: 20) { nodes { id title } } }
        userErrors { field message }
      }
    }`, {
    input: {
      title: p.title,
      handle: p.slug,
      status: 'ACTIVE',
      tags: ['drop-001'],
      descriptionHtml: `<p>Heavyweight construction, puff-print front graphic, chain-stitched crest. Cut roomy through the chest — New Orleans proportions.</p>`,
      productOptions: [
        { name: 'Garment', values: GARMENTS.map(g => ({ name: g.value })) },
        { name: 'Size', values: SIZES.map(s => ({ name: s })) },
      ],
      variants,
      files: media,
      metafields: [
        { namespace: 'lf', key: 'story', type: 'multi_line_text_field', value: p.story },
        { namespace: 'lf', key: 'edition_size', type: 'number_integer', value: '150' },
        { namespace: 'lf', key: 'drop_accent', type: 'color', value: '#9fd8ff' },
      ],
    },
  });
  const errs = d.productSet.userErrors;
  if (errs.length) throw new Error(`${p.title}: ${JSON.stringify(errs)}`);
  console.log(`CREATED ${p.title} — ${d.productSet.product.variants.nodes.length} variants`);
}

for (const p of PRODUCTS) await createProduct(p);
console.log('Done.');
```

- [ ] **Step 4: Run + verify**

```bash
node scripts/create-products.mjs
```

Expected: `CREATED <title> — 15 variants` × 6, then `Done.` (Re-runs print `SKIP`.) If `productSet` rejects a field, print the exact userErrors and adapt only the input shape — do not change catalog content. Then verify:

```bash
curl -s "https://1xiwxi-yy.myshopify.com/products.json?limit=10" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for p in d['products']:
    print(p['title'], '| variants:', len(p['variants']), '| images:', len(p['images']), '| prices:', sorted(set(v['price'] for v in p['variants'])))"
```

Expected: 6 products, 15 variants each, 3 images each, prices `['75.00', '150.00']`. (If the store's password gate blocks `products.json`, verify in admin instead: 6 products, each 15 variants/3 images.)

- [ ] **Step 5: Commit**

```bash
git add scripts/ && git commit -m "Catalog loader: Drop 001 products via Admin GraphQL with alt-mapped media"
```

(Note: `scripts/product-images/` are generated artifacts of source mockups — commit them anyway; they're the canonical prepped set at <2MB total... verify with `du -sh scripts/product-images`; if >5MB, add `scripts/product-images/` to `.gitignore` and commit only the script, noting the regeneration command.)

### Task 14: Dev review, quality gates, ship

**Files:** none (verification + push)

- [ ] **Step 1: Dev server**

Run: `shopify theme dev --path theme --store 1xiwxi-yy.myshopify.com` (user runs interactively if the store password prompt appears).

- [ ] **Step 2 (WITH USER — content assignment in theme editor):** Open the dev theme editor link → Home: assign hero slide images (pick from culture/mockup imagery), assign `featured` blocks' products (Maria, Fleur-de-Lis). Save. Operator also creates the Story page (Task 12 Step 3) and reviews culture-strip picks.

- [ ] **Step 3: Full-flow checklist (user + agent, against dev URL)**

1. Home: slider auto-advances (6s), prev/next + numbered indicator work, lockup glows, sections reveal on scroll.
2. Shop: 6 products, hover swaps colorway, prices `$75 — $150`.
3. PDP: gallery arrows; selecting `Hoodie — Grey` switches price to $150 AND jumps gallery to the hoodie image; add to cart opens the drawer with the item.
4. Drawer: quantity +/− updates totals; header count updates; Checkout reaches Shopify checkout (place a test order only if a test gateway is enabled; otherwise stop at checkout page).
5. Story page renders manifesto + pillars.
6. 375px viewport: every page, no horizontal scroll; PDP collapses to single column.
7. Reduce Motion ON (fresh tab): no slider autoplay, reveals appear instantly, drawer snaps.
8. Teaser regression: `/password` page unchanged (flicker still once/session).

- [ ] **Step 4: Lighthouse**

```bash
npx --yes lighthouse http://127.0.0.1:9292/ --preset=perf --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless" --only-categories=performance,accessibility --output=json --output-path=/tmp/lh-home.json 2>/dev/null; python3 -c "
import json; r=json.load(open('/tmp/lh-home.json'))['categories']
print('home perf', r['performance']['score']*100, 'a11y', r['accessibility']['score']*100)"
```

Repeat for a PDP URL. Expected: perf ≥ 85, a11y ≥ 90. Fix regressions (image sizes, missing alt/labels) before proceeding; re-run until green.

- [ ] **Step 5: Fix findings, commit**

```bash
git add -A && git commit -m "Phase B1 review fixes"
```

(Skip if clean.)

- [ ] **Step 6: Push to the live theme (teaser stays gated — the password page is untouched, so this is safe), merge, tag**

```bash
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
curl -sL "https://laissezfaireleisureclub.com/" | grep -o "lf-teaser" | head -1   # teaser still serving
git checkout master && git merge --no-ff feat/phase-b1 -m "Ship Phase B1: full store behind the gate" && git tag v0.2.0-store
```

Expected: push succeeds; `lf-teaser` still prints (gate intact); tag created.

---

## Not in this plan (B2, separate plan)

Barba lights-out page transitions, split-text staggers, scroll-linked glow ramps, electrical hover buzz, cursor-follow footer, Observer slider gestures. Also operator items: Shopify Payments activation, real edition sizes, drop-day password flip + Klaviyo announcement.

## Self-review notes

- **Spec coverage:** shell/header/footer/drawer ✓ (T2-4), hero slider ✓ (T5), featured stories ✓ (T6), drop grid ✓ (T7), culture+email ✓ (T8), home wiring ✓ (T9), shop ✓ (T10), split PDP + related + variant-synced gallery + accordion + edition/story metafields ✓ (T11), story page ✓ (T12), 6 products × 15 variants × $75/$150 × metafields × alt-mapped images ✓ (T13), reduced-motion narrowing ✓ (T1), vendored libs ✓ (T1), quality gates + teaser-regression check ✓ (T14), orphan deletions with grep guards ✓ (T2,3,9,10,11).
- **Placeholders:** none — every file complete; culture-image choice and hero/featured content assignment are explicitly delegated content decisions with named owners (implementer pick + user checkpoint / theme editor with user), not code gaps.
- **Consistency:** `data-lf-cart-open`/`lf:cart:added` contract between header (T2), PDP (T11), and drawer (T4) matches; alt convention `"<Garment value> — <Title>"` produced by T13 matches T11's `indexOf(garment) === 0` check; metafields `lf.story`/`lf.edition_size`/`lf.drop_accent` written by T13, read by T11 (accent reserved for B2 use); `--lf-crest`/`--lf-wordmark` CSS custom-property pattern consistent with Phase A sections; money format in drawer JS uses `$` directly (store currency USD, confirmed live).
