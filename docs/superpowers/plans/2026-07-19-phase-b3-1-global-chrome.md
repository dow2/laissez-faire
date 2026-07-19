# Phase B3.1 — Global Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the nine global chrome systems from spec §4/B3.1 — menu overlay, preloader, cursor labels, nav behaviors, newsletter popup, easter-egg overlay, rebuilt footer with product image-follow, and the brand voice components — shipping `v0.4.0-chrome`.

**Architecture:** All chrome behavior lives in a new `lf-chrome.js` using the existing `LF.init.*` registry + `LF.teardown` contract dispatched by `lf-motion.js`. Chrome DOM renders in `theme.liquid` **outside** the Barba container (persistent across swaps; every init is bound-once via `data-lf-bound`). Only per-swap pieces (nav recolor markers) register teardowns. New Liquid sections: `lf-preloader`, `lf-menu`, `lf-signup-popup`, `lf-easter-egg`. `lf-header.liquid` and `lf-footer.liquid` are rebuilt in place.

**Tech Stack:** Shopify OS 2.0 Liquid, GSAP 3.13.0 (+ new self-hosted CustomEase 3.13.0 — the only vendor addition), ScrollTrigger, vanilla JS (no jQuery/Observer/Hammer). Spec: `docs/superpowers/specs/2026-07-19-phase-b3-ritual-build-design.md`.

**Working state assumptions:** repo `/Users/dow/laissez-faire`, branch created from `master` (post-`v0.3.0-motion`). Dev loop: `shopify theme dev --path theme --store 1xiwxi-yy.myshopify.com` serving `http://127.0.0.1:9292`. Playwright available via `NODE_PATH=/Users/dow/node_modules`.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `theme/assets/CustomEase.min.js` | Create (vendor) | GSAP CustomEase plugin, pinned 3.13.0 |
| `theme/assets/lf-chrome.js` | Create | All global-chrome inits (menu, preloader, cursor, popup, easter, nav, footer-follow) |
| `theme/sections/lf-preloader.liquid` | Create | First-visit preloader markup/CSS |
| `theme/sections/lf-menu.liquid` | Create | Full-screen menu overlay |
| `theme/sections/lf-signup-popup.liquid` | Create | Newsletter popup |
| `theme/sections/lf-easter-egg.liquid` | Create | Brand-flash overlay |
| `theme/snippets/lf-eyebrow.liquid` | Create | `(  text  )` eyebrow component |
| `theme/snippets/lf-stamp.liquid` | Create | `LFLC©26` stamp component |
| `theme/snippets/lf-code.liquid` | Create | Product code `(LF_…)` component |
| `theme/layout/theme.liquid` | Modify | Render chrome sections; script tags (CustomEase, lf-chrome) ; first-visit inline flag |
| `theme/sections/lf-header.liquid` | Modify (rebuild) | Nav: crest, Menu toggle (rolling text), cart count; recolor/pull-up hooks |
| `theme/sections/lf-footer.liquid` | Modify (rebuild) | Night + full-height variants, Site Index w/ image reveals, product image-follow |
| `theme/assets/lf-motion.js` | Modify | Register CustomEase curves `lf-ease-1`, `lf-ease-3` |
| `theme/assets/lf-sections.js` | Modify | Remove `LF.init.footerFollow` (absorbed by chrome image-follow) |
| `theme/assets/lf-tokens.css` | Modify | Remove `.lf-follow-crest` block; add chrome z-index scale comment |

Z-index scale (used consistently below): header 40, cart drawer 60, menu overlay 70, signup popup 75, easter egg 78, preloader 95, blackout 90 (existing), cursor 100.

---

### Task 1: Branch, vendor CustomEase, register eases

**Files:**
- Create: `theme/assets/CustomEase.min.js`
- Modify: `theme/assets/lf-motion.js`
- Modify: `theme/layout/theme.liquid`

- [ ] **Step 1: Branch**

```bash
cd /Users/dow/laissez-faire && git checkout master && git pull && git checkout -b feat/phase-b3-chrome
```

- [ ] **Step 2: Vendor CustomEase 3.13.0 (pinned, same family as existing gsap.min.js)**

```bash
curl -sf https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/CustomEase.min.js -o theme/assets/CustomEase.min.js
head -c 300 theme/assets/CustomEase.min.js   # sanity: minified JS, mentions CustomEase
```

Expected: file ~2KB, starts with a license/webpack banner mentioning CustomEase 3.13.0. If the CDN 404s, fall back to `https://unpkg.com/gsap@3.13.0/dist/CustomEase.min.js`.

- [ ] **Step 3: Add the script tag** in `theme/layout/theme.liquid` after the SplitText line, and the chrome script after `lf-sections.js` (registration before `lf-motion.js` dispatch):

```liquid
    <script src="{{ 'gsap.min.js' | asset_url }}" defer></script>
    <script src="{{ 'ScrollTrigger.min.js' | asset_url }}" defer></script>
    <script src="{{ 'SplitText.min.js' | asset_url }}" defer></script>
    <script src="{{ 'CustomEase.min.js' | asset_url }}" defer></script>
    <script src="{{ 'barba.min.js' | asset_url }}" defer></script>
    <script src="{{ 'lenis.min.js' | asset_url }}" defer></script>
    <script src="{{ 'lf-sections.js' | asset_url }}" defer></script>
    <script src="{{ 'lf-chrome.js' | asset_url }}" defer></script>
    <script src="{{ 'lf-motion.js' | asset_url }}" defer></script>
```

(`lf-chrome.js` is created in Task 2 — pushing with a dangling tag for one commit is fine on the dev theme, but Tasks 1–2 are committed together below to avoid it entirely. Do not push until Task 2's commit.)

- [ ] **Step 4: Register eases** in `theme/assets/lf-motion.js` — insert immediately after the `LF.ctx = { reduced: reduced };` line:

```js
  // OR-derived ease vocabulary (spec §3). CustomEase is optional at runtime:
  // if the vendor failed to load, gsap falls back to the string default.
  if (window.CustomEase) {
    CustomEase.create('lf-ease-1', 'M0,0 C0.15,0 0.15,1 1,1');
    CustomEase.create('lf-ease-3', '0.65, 0.01, 0.05, 0.99');
  }
```

- [ ] **Step 5: Theme check**

Run: `shopify theme check --path theme 2>&1 | tail -3`
Expected: same offense count as `master` baseline (no new offenses).

- [ ] **Step 6: Do not commit yet** — Task 2 completes the pair (dangling script tag). Continue directly.

---

### Task 2: `lf-chrome.js` scaffold + chrome section mounts in layout

**Files:**
- Create: `theme/assets/lf-chrome.js`
- Modify: `theme/layout/theme.liquid`

- [ ] **Step 1: Create `theme/assets/lf-chrome.js`** (complete file; later tasks append inits before the final `})();`):

```js
/* LF global chrome: menu overlay, preloader, cursor labels, newsletter popup,
   easter-egg overlay, nav behaviors, footer image-follow. Registry inits are
   dispatched by lf-motion.js on first load and after every Barba swap. Chrome
   DOM lives OUTSIDE the Barba container, so every init here binds once and
   guards with data-lf-bound; only per-swap resources (nav recolor triggers)
   register LF.teardown entries. */
(function () {
  window.LF = window.LF || {};
  LF.init = LF.init || {};
  LF.teardown = LF.teardown || [];

  var FINE = window.matchMedia('(min-width: 992px) and (pointer: fine)');

  // Body scroll lock shared by menu + popup. Counted so nested opens are safe.
  var lockCount = 0;
  LF.scrollLock = function (on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    document.documentElement.style.overflow = lockCount > 0 ? 'hidden' : '';
  };

  // Minimal focus trap: keeps Tab inside `root` until release() is called.
  LF.trapFocus = function (root) {
    var prev = document.activeElement;
    var sel = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(root.querySelectorAll(sel), function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    var target = root.querySelector(sel);
    if (target) target.focus();
    return function release() {
      document.removeEventListener('keydown', onKey);
      if (prev && prev.focus) prev.focus({ preventScroll: true });
    };
  };
})();
```

- [ ] **Step 2: Mount chrome sections** in `theme/layout/theme.liquid`. Replace the current `<body>` block with:

```liquid
  <body>
    {% section 'lf-preloader' %}
    {% sections 'header-group' %}
    {% section 'lf-menu' %}
    <main id="lf-main" data-barba="wrapper">
      <div data-barba="container" data-barba-namespace="{{ template.name }}">{{ content_for_layout }}</div>
    </main>
    {% sections 'footer-group' %}
    {% section 'lf-cart-drawer' %}
    {% section 'lf-easter-egg' %}
    {% section 'lf-signup-popup' %}
    <div id="lf-blackout" aria-hidden="true"></div>
    <div class="lf-cursor" data-lf-cursor aria-hidden="true"><p></p></div>
```

(script tags from Task 1 follow, then `</body>`.) Also add the **first-visit flag** as the first child of `<head>` scripts — insert directly before `{{ content_for_header }}`:

```liquid
    <script>
      /* Pre-paint session flag so the preloader never flashes on repeat visits. */
      try { if (!sessionStorage.getItem('lfVisited')) document.documentElement.classList.add('lf-first-visit'); } catch (e) {}
    </script>
```

The four `{% section %}` files don't exist yet — Shopify renders unknown sections as empty in dev but `theme check` flags them; Tasks 3–7 create them within this same PR. Create empty stubs now so every intermediate commit is clean:

```bash
for s in lf-preloader lf-menu lf-signup-popup lf-easter-egg; do
  printf '%s\n' "{% comment %} B3.1 stub — filled by its plan task {% endcomment %}" "{% schema %}" "{ \"name\": \"stub\", \"settings\": [] }" "{% endschema %}" > "theme/sections/$s.liquid"
done
```

(Each later task **replaces the stub file wholesale** with real content and its real schema name.)

- [ ] **Step 3: Theme check** — `shopify theme check --path theme 2>&1 | tail -3`, expected: no new offenses.

- [ ] **Step 4: Commit Tasks 1+2 together**

```bash
git add theme/assets/CustomEase.min.js theme/assets/lf-chrome.js theme/assets/lf-motion.js theme/layout/theme.liquid theme/sections/lf-preloader.liquid theme/sections/lf-menu.liquid theme/sections/lf-signup-popup.liquid theme/sections/lf-easter-egg.liquid
git commit -m "feat(b3.1): CustomEase vendor, lf-chrome scaffold, chrome mounts + first-visit flag"
git status --short   # MUST be clean — verify the compound add missed nothing
```

---

### Task 3: Header rebuild — Menu toggle, rolling text, nav behaviors

**Files:**
- Modify: `theme/sections/lf-header.liquid` (full replacement)
- Modify: `theme/assets/lf-chrome.js` (append `LF.init.navBehaviors`)
- Modify: `theme/assets/lf-tokens.css` (z-index comment + roll-text utility)

- [ ] **Step 1: Replace `theme/sections/lf-header.liquid` entirely:**

```liquid
<header class="lf-header" data-lf-header>
  <a class="lf-header__home" href="{{ routes.root_url }}" aria-label="Laissez-Faire Leisure Club — home">
    <span class="lf-header__crest" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');" aria-hidden="true"></span>
  </a>
  <div class="lf-header__right">
    <button class="lf-header__cart" type="button" data-lf-cart-open aria-label="Open cart">
      Cart <span class="lf-header__count" data-lf-cart-count>{{ cart.item_count }}</span>
    </button>
    <button class="lf-header__menu lf-roll" type="button" data-lf-menu-open aria-expanded="false" aria-controls="lf-menu">
      <span class="lf-roll__inner" data-text="Menu">Menu</span>
    </button>
  </div>
</header>

{% stylesheet %}
.lf-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: .9rem 1.25rem;
  transition: transform .3s ease-out, background .3s ease-out;
}
.lf-header.is-pulled { transform: translateY(-100%); }
.lf-header.is-bright .lf-header__cart, .lf-header.is-bright .lf-header__menu { color: var(--lf-ground); }
.lf-header__crest {
  display: block; width: 30px; aspect-ratio: 300/320;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat;
  mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 4px var(--lf-neon-halo));
}
.lf-header__right { display: flex; align-items: center; gap: 1.6rem; }
.lf-header__cart, .lf-header__menu {
  font-family: var(--lf-font-body); font-size: .74rem; letter-spacing: .22em; text-transform: uppercase;
  color: var(--lf-body-text); background: none; border: 0; cursor: pointer; padding: 0;
}
.lf-header__cart:hover, .lf-header__menu:hover { color: var(--lf-neon-core); }
.lf-header__count {
  display: inline-block; min-width: 1.3em; text-align: center; margin-left: .25em;
  color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo);
}
{% endstylesheet %}

{% schema %}
{ "name": "LF Header", "settings": [] }
{% endschema %}
```

Note: the old inline mobile overlay + its `LF.init.header` burger logic are superseded by the full-screen menu (Task 4). Page links move into the menu. The old header schema's link settings are dropped — the menu section owns links now.

- [ ] **Step 2: Remove `LF.init.header`** from `theme/assets/lf-sections.js` (the whole `// ——— Header: mobile overlay menu` block, lines ~24–39) — the burger/overlay markup no longer exists.

- [ ] **Step 3: Add roll-text utility + z-index note to `theme/assets/lf-tokens.css`** (append at end):

```css
/* ——— B3.1 chrome ——— */
/* z-scale: header 40 / drawer 60 / menu 70 / popup 75 / easter 78 / blackout 90 / preloader 95 / cursor 100 */

/* Rolling text hover (OR h-flip): duplicate glyph via text-shadow, roll down on hover. */
.lf-roll { overflow: hidden; display: inline-block; line-height: 1.1; }
.lf-roll__inner {
  display: inline-block; text-shadow: 0 -1.1em 0 currentColor;
  transition: transform 0ms var(--lf-ease);
}
.lf-roll:hover .lf-roll__inner { transform: translateY(1.1em); transition-duration: 400ms; }
@media (prefers-reduced-motion: reduce) { .lf-roll:hover .lf-roll__inner { transform: none; } }
```

- [ ] **Step 4: Append `LF.init.navBehaviors` to `theme/assets/lf-chrome.js`** (before the closing `})();`):

```js
  // ——— Nav behaviors: section-aware brighten + pull-up at footer ———
  // Markers live INSIDE the swapped container, so triggers are re-created on
  // every dispatch and die in lf-motion.js's beforeLeave ScrollTrigger sweep.
  LF.init.navBehaviors = function (root) {
    var header = document.querySelector('[data-lf-header]');
    if (!header || !window.ScrollTrigger) return;
    header.classList.remove('is-bright', 'is-pulled');
    (root || document).querySelectorAll('[data-nav-light]').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom top',
        onEnter: function () { header.classList.add('is-bright'); },
        onEnterBack: function () { header.classList.add('is-bright'); },
        onLeave: function () { header.classList.remove('is-bright'); },
        onLeaveBack: function () { header.classList.remove('is-bright'); }
      });
    });
    var footer = document.querySelector('.lf-footer');
    if (footer) {
      ScrollTrigger.create({
        trigger: footer, start: 'clamp(top 20%)',
        onEnter: function () { header.classList.add('is-pulled'); },
        onLeaveBack: function () { header.classList.remove('is-pulled'); }
      });
    }
  };
```

- [ ] **Step 5: Theme check + manual smoke** — `shopify theme check --path theme` clean; on the dev server the header shows crest / Cart / Menu, no burger.

- [ ] **Step 6: Commit**

```bash
git add theme/sections/lf-header.liquid theme/assets/lf-sections.js theme/assets/lf-chrome.js theme/assets/lf-tokens.css
git commit -m "feat(b3.1): header rebuild — Menu toggle, roll-text hover, nav brighten + pull-up"
git status --short
```

---

### Task 4: Menu overlay

**Files:**
- Replace stub: `theme/sections/lf-menu.liquid`
- Modify: `theme/assets/lf-chrome.js` (append `LF.init.menu`)

- [ ] **Step 1: Replace `theme/sections/lf-menu.liquid` wholesale:**

```liquid
<div class="lf-menu" id="lf-menu" data-lf-menu-root data-state="closed" aria-hidden="true">
  <div class="lf-menu__veil" data-lf-menu-close></div>
  <div class="lf-menu__imgpanel" style="background-image: url('{{ 'lf-culture-1.jpg' | asset_url }}');" aria-hidden="true"></div>
  <div class="lf-menu__panel lf-menu__panel--1" aria-hidden="true"></div>
  <div class="lf-menu__panel lf-menu__panel--2">
    <nav class="lf-menu__list" aria-label="Menu">
      <a class="lf-menu__link lf-display" href="{{ section.settings.link_1_url | default: routes.all_products_collection_url }}" data-lf-menu-close>{{ section.settings.link_1_label | default: 'Shop' }}</a>
      <a class="lf-menu__link lf-display" href="{{ routes.root_url }}" data-lf-menu-close>Home</a>
      <a class="lf-menu__link lf-display" href="{{ section.settings.link_2_url | default: '/pages/story' }}" data-lf-menu-close>{{ section.settings.link_2_label | default: 'Story' }}</a>
      <a class="lf-menu__link lf-display" href="{{ section.settings.link_3_url | default: '/pages/contact' }}" data-lf-menu-close>{{ section.settings.link_3_label | default: 'Contact' }}</a>
    </nav>
    <button class="lf-menu__close" type="button" data-lf-menu-close>Close</button>
    <div class="lf-menu__extras" data-lf-menu-fade>
      <p>Laissez les bons temps rouler — {% render 'lf-stamp' %}</p>
      <p>New Orleans, Louisiana</p>
      <button type="button" class="lf-menu__cart" data-lf-cart-open>Cart <span data-lf-cart-count>{{ cart.item_count }}</span></button>
    </div>
  </div>
</div>

{% stylesheet %}
.lf-menu { position: fixed; inset: 0; z-index: 70; display: none; }
.lf-menu[data-state="open"], .lf-menu[data-state="animating"] { display: block; }
.lf-menu__veil { position: absolute; inset: 0; background: rgba(0,0,0,.6); opacity: 0; }
.lf-menu__imgpanel {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  opacity: .35; transform: translateY(-101%);
}
.lf-menu__panel { position: absolute; inset: 0; transform: translateY(-101%); }
.lf-menu__panel--1 { background: #08080b; border-bottom: 1px solid var(--lf-neon-halo); }
.lf-menu__panel--2 {
  background: var(--lf-panel); border-bottom: 1px solid var(--lf-neon-halo);
  display: flex; flex-direction: column; justify-content: space-between; padding: 6rem 2rem 2rem;
}
.lf-menu__list { display: flex; flex-direction: column; gap: 1.2rem; }
.lf-menu__link {
  font-size: clamp(2rem, 7vw, 4rem); color: var(--lf-neon-core);
  text-shadow: 0 0 12px var(--lf-neon-halo); text-decoration: none;
  overflow: hidden; transition: opacity .2s ease-out;
}
.lf-menu__list:hover .lf-menu__link:not(:hover) { opacity: .35; }
.lf-menu__close {
  position: absolute; top: 1.2rem; right: 1.4rem; background: none; border: 0; cursor: pointer;
  color: var(--lf-body-text); font-size: .74rem; letter-spacing: .22em; text-transform: uppercase;
}
.lf-menu__extras { display: flex; gap: 2.5rem; flex-wrap: wrap; align-items: baseline; opacity: 0; }
.lf-menu__extras p { color: var(--lf-muted); font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; margin: 0; }
.lf-menu__cart { background: none; border: 0; cursor: pointer; color: var(--lf-neon-core); font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; }
@media (prefers-reduced-motion: reduce) {
  .lf-menu__imgpanel, .lf-menu__panel { transform: none; }
  .lf-menu__veil, .lf-menu__extras { opacity: 1; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Menu",
  "settings": [
    { "type": "text", "id": "link_1_label", "label": "Link 1 label", "default": "Shop" },
    { "type": "url", "id": "link_1_url", "label": "Link 1 URL" },
    { "type": "text", "id": "link_2_label", "label": "Link 2 label", "default": "Story" },
    { "type": "url", "id": "link_2_url", "label": "Link 2 URL" },
    { "type": "text", "id": "link_3_label", "label": "Link 3 label", "default": "Contact" },
    { "type": "url", "id": "link_3_url", "label": "Link 3 URL" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.menu` to `lf-chrome.js`:**

```js
  // ——— Full-screen menu overlay ———
  LF.init.menu = function (root, ctx) {
    var menu = document.querySelector('[data-lf-menu-root]');
    if (!menu || menu.hasAttribute('data-lf-bound')) return;
    menu.setAttribute('data-lf-bound', '1');
    var openBtns = document.querySelectorAll('[data-lf-menu-open]');
    var veil = menu.querySelector('.lf-menu__veil');
    var imgPanel = menu.querySelector('.lf-menu__imgpanel');
    var panels = menu.querySelectorAll('.lf-menu__panel');
    var links = menu.querySelectorAll('.lf-menu__link');
    var fades = menu.querySelectorAll('[data-lf-menu-fade]');
    var release = null;

    function setOpenState(open) {
      menu.setAttribute('aria-hidden', String(!open));
      openBtns.forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    }

    function open() {
      LF.scrollLock(true);
      setOpenState(true);
      if (ctx.reduced || !window.gsap) {
        menu.setAttribute('data-state', 'open');
        release = LF.trapFocus(menu);
        return;
      }
      menu.setAttribute('data-state', 'animating');
      gsap.timeline({ onComplete: function () {
          menu.setAttribute('data-state', 'open');
          release = LF.trapFocus(menu);
        } })
        .fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, ease: 'expo.out' })
        .fromTo(imgPanel, { yPercent: -101 }, { yPercent: 0, duration: .575, ease: 'lf-ease-3' }, '<')
        .fromTo(panels, { yPercent: -101 }, { yPercent: 0, stagger: 0.1, duration: .575, ease: 'lf-ease-3' }, '<15%')
        .fromTo(links, { yPercent: 130 }, { yPercent: 0, stagger: 0.05, duration: .575, ease: 'lf-ease-3' }, '<20%')
        .fromTo(fades, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, ease: 'sine.out' }, '<70%');
    }

    function close(afterFn) {
      if (release) { release(); release = null; }
      LF.scrollLock(false);
      setOpenState(false);
      if (ctx.reduced || !window.gsap) {
        menu.setAttribute('data-state', 'closed');
        if (afterFn) afterFn();
        return;
      }
      menu.setAttribute('data-state', 'animating');
      gsap.timeline({ onComplete: function () {
          menu.setAttribute('data-state', 'closed');
          if (afterFn) afterFn();
        } })
        .to(fades, { autoAlpha: 0, duration: .3, ease: 'expo.out' })
        .to(links, { yPercent: 130, duration: .45, ease: 'expo.out' }, '<')
        .to(panels, { yPercent: -101, stagger: 0.1, duration: .5, ease: 'expo.out' }, '<10%')
        .to(imgPanel, { yPercent: -101, duration: .5, ease: 'expo.out' }, '<')
        .to(veil, { autoAlpha: 0, duration: .3 }, '<30%');
    }

    openBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (menu.getAttribute('data-state') === 'closed') open();
      });
    });
    menu.addEventListener('click', function (e) {
      var closer = e.target.closest('[data-lf-menu-close]');
      if (!closer || menu.getAttribute('data-state') !== 'open') return;
      var link = closer.closest('a[href]');
      if (link) {
        // Let Barba take the navigation; close instantly so the surge owns the screen.
        if (release) { release(); release = null; }
        LF.scrollLock(false); setOpenState(false);
        menu.setAttribute('data-state', 'closed');
        gsap && gsap.set([veil, imgPanel, panels, links, fades], { clearProps: 'all' });
      } else {
        e.preventDefault();
        close();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.getAttribute('data-state') === 'open') close();
    });
  };
```

- [ ] **Step 3: Verify on dev server** — Menu opens with panel drop, links stagger in, sibling-dim hover works, Esc and Close and veil-click close it, Tab stays inside, body doesn't scroll behind, clicking a link navigates via surge with the menu gone. Reduced-motion (devtools emulation): instant open/close.

- [ ] **Step 4: Commit**

```bash
git add theme/sections/lf-menu.liquid theme/assets/lf-chrome.js
git commit -m "feat(b3.1): full-screen menu overlay with panel-drop choreography + focus trap"
git status --short
```

---

### Task 5: Preloader + popup auto-open timer

**Files:**
- Replace stub: `theme/sections/lf-preloader.liquid`
- Modify: `theme/assets/lf-chrome.js` (append `LF.init.preloader`)

- [ ] **Step 1: Replace `theme/sections/lf-preloader.liquid`:**

```liquid
<div class="lf-preloader" data-lf-preloader aria-hidden="true">
  <div class="lf-preloader__inner">
    <div class="lf-preloader__crest" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>
    <div class="lf-preloader__img" style="background-image: url('{{ 'lf-culture-2.jpg' | asset_url }}');"></div>
  </div>
</div>

{% stylesheet %}
.lf-preloader { position: fixed; inset: 0; z-index: 95; background: #000; display: none; }
html.lf-first-visit .lf-preloader { display: block; }
.lf-preloader__inner { position: absolute; inset: 0; display: grid; place-items: center; }
.lf-preloader__crest {
  width: 96px; aspect-ratio: 300/320; background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 10px var(--lf-neon-halo)) drop-shadow(0 0 34px var(--lf-neon-halo));
  opacity: 0; z-index: 1;
}
.lf-preloader__img {
  position: absolute; inset: 30% 15%; background-size: cover; background-position: center;
  clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%); opacity: .5;
}
@media (prefers-reduced-motion: reduce) { html.lf-first-visit .lf-preloader { display: none; } }
{% endstylesheet %}

{% schema %}
{ "name": "LF Preloader", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.preloader` to `lf-chrome.js`:**

```js
  // ——— First-visit preloader + popup auto-open ———
  LF.init.preloader = function (root, ctx) {
    var pre = document.querySelector('[data-lf-preloader]');
    if (!pre || pre.hasAttribute('data-lf-bound')) return;
    pre.setAttribute('data-lf-bound', '1');
    var firstVisit = document.documentElement.classList.contains('lf-first-visit');
    try { sessionStorage.setItem('lfVisited', '1'); } catch (e) {}
    if (!firstVisit) return;

    function done() {
      pre.style.display = 'none';
      document.documentElement.classList.remove('lf-first-visit');
    }
    if (ctx.reduced || !window.gsap) { done(); }
    else {
      var crest = pre.querySelector('.lf-preloader__crest');
      var img = pre.querySelector('.lf-preloader__img');
      gsap.timeline({ onComplete: done })
        .to(crest, { opacity: 1, duration: .9, ease: 'sine.in' })
        .to(crest, { keyframes: [{ opacity: .2 }, { opacity: 1 }, { opacity: .4 }, { opacity: 1 }], duration: .45, ease: 'steps(3)' })
        .to(img, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .7, ease: 'lf-ease-3' }, '<')
        .to(pre, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: .7, ease: 'lf-ease-3', delay: .2 });
    }

    // Newsletter auto-open: once per session, 10s after first-ever load.
    try {
      if (!sessionStorage.getItem('lfPopupShown')) {
        setTimeout(function () {
          sessionStorage.setItem('lfPopupShown', '1');
          if (LF.openSignup) LF.openSignup();
        }, 10000);
      }
    } catch (e) {}
  };
```

- [ ] **Step 3: Verify** — fresh incognito tab: preloader plays ~2s then reveals page; reload: no preloader, not even a flash; 10s after the first load the popup opens (after Task 6 lands; before that `LF.openSignup` is undefined and safely skipped). Reduced-motion: no preloader at all.

- [ ] **Step 4: Commit**

```bash
git add theme/sections/lf-preloader.liquid theme/assets/lf-chrome.js
git commit -m "feat(b3.1): session-once preloader with crest ignite + popup auto-open timer"
git status --short
```

---

### Task 6: Newsletter popup

**Files:**
- Replace stub: `theme/sections/lf-signup-popup.liquid`
- Modify: `theme/assets/lf-chrome.js` (append `LF.init.signup`)

- [ ] **Step 1: Replace `theme/sections/lf-signup-popup.liquid`:**

```liquid
<div class="lf-signup" data-lf-signup hidden>
  <div class="lf-signup__scrim" data-lf-signup-close></div>
  <div class="lf-signup__box" role="dialog" aria-modal="true" aria-label="Join the club">
    <div class="lf-signup__img" style="background-image: url('{{ 'lf-culture-3.jpg' | asset_url }}');" aria-hidden="true"></div>
    <div class="lf-signup__content">
      <button type="button" class="lf-signup__close" data-lf-signup-close aria-label="Close">&times;</button>
      <p class="lf-signup__head lf-display">Become part of the club.</p>
      <p class="lf-signup__sub">First word on drops, parties, and the rack. {% render 'lf-stamp' %}</p>
      {% form 'customer', class: 'lf-signup__form' %}
        <input type="hidden" name="contact[tags]" value="newsletter,popup">
        <div class="lf-signup__row">
          <input type="email" name="contact[email]" placeholder="EMAIL" required aria-label="Email">
          <button type="submit">Join</button>
        </div>
        {% if form.posted_successfully? %}<p class="lf-signup__ok" role="status">You're on the list.</p>{% endif %}
        {% if form.errors %}<p class="lf-signup__err" role="alert">{{ form.errors.messages.email | default: 'Try again.' }}</p>{% endif %}
      {% endform %}
    </div>
  </div>
</div>

{% stylesheet %}
.lf-signup { position: fixed; inset: 0; z-index: 75; display: flex; align-items: center; justify-content: center; }
.lf-signup[hidden] { display: none; }
.lf-signup__scrim { position: absolute; inset: 0; background: rgba(0,0,0,.65); }
.lf-signup__box {
  position: relative; display: grid; grid-template-columns: 1fr 1.2fr; width: min(92vw, 640px);
  background: var(--lf-panel); border: 1px solid var(--lf-neon-halo); box-shadow: 0 0 30px rgba(74,168,255,.25);
}
.lf-signup__img { background-size: cover; background-position: center; min-height: 260px; }
.lf-signup__content { padding: 1.6rem; position: relative; }
.lf-signup__close { position: absolute; top: .4rem; right: .7rem; background: none; border: 0; color: var(--lf-body-text); font-size: 1.4rem; cursor: pointer; }
.lf-signup__head { color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); font-size: 1rem; letter-spacing: .12em; margin: 0 0 .6rem; }
.lf-signup__sub { color: var(--lf-muted); font-size: .74rem; letter-spacing: .06em; margin: 0 0 1.2rem; }
.lf-signup__row { display: flex; gap: .6rem; border-bottom: 1px solid #2a2a33; padding-bottom: .5rem; }
.lf-signup__row input {
  flex: 1; background: none; border: 0; outline: 0; color: var(--lf-body-text);
  font-family: var(--lf-font-body); font-size: .8rem; letter-spacing: .18em; text-transform: uppercase;
}
.lf-signup__row button {
  background: none; border: 0; cursor: pointer; color: var(--lf-neon-core);
  text-shadow: 0 0 8px var(--lf-neon-halo); font-size: .8rem; letter-spacing: .2em; text-transform: uppercase;
}
.lf-signup__ok { color: var(--lf-neon-core); font-size: .74rem; margin-top: .8rem; }
.lf-signup__err { color: #ff7a7a; font-size: .74rem; margin-top: .8rem; }
@media (max-width: 649px) { .lf-signup__box { grid-template-columns: 1fr; } .lf-signup__img { min-height: 140px; } }
{% endstylesheet %}

{% schema %}
{ "name": "LF Signup Popup", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.signup` to `lf-chrome.js`:**

```js
  // ——— Newsletter popup ———
  LF.init.signup = function () {
    var box = document.querySelector('[data-lf-signup]');
    if (!box || box.hasAttribute('data-lf-bound')) return;
    box.setAttribute('data-lf-bound', '1');
    var release = null;
    LF.openSignup = function () {
      if (!box.hasAttribute('hidden')) return;
      box.removeAttribute('hidden');
      LF.scrollLock(true);
      release = LF.trapFocus(box);
    };
    function close() {
      if (box.hasAttribute('hidden')) return;
      box.setAttribute('hidden', '');
      LF.scrollLock(false);
      if (release) { release(); release = null; }
    }
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-lf-signup-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hasAttribute('hidden')) close();
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-lf-signup-open]')) LF.openSignup();
    });
    // Reopen after a successful post (Shopify reloads the page with params).
    if (location.search.indexOf('customer_posted=true') > -1) LF.openSignup();
  };
```

- [ ] **Step 3: Verify** — `LF.openSignup()` from console opens with focus trapped, Esc/scrim/× close it, form posts to Shopify and re-opens showing "You're on the list." Auto-open fires 10s after a fresh-session load.

- [ ] **Step 4: Commit**

```bash
git add theme/sections/lf-signup-popup.liquid theme/assets/lf-chrome.js
git commit -m "feat(b3.1): newsletter popup with native customer form + focus management"
git status --short
```

---

### Task 7: Cursor label system + easter-egg overlay

**Files:**
- Replace stub: `theme/sections/lf-easter-egg.liquid`
- Modify: `theme/assets/lf-chrome.js` (append `LF.init.cursor`, `LF.init.easter`)
- Modify: `theme/assets/lf-tokens.css` (cursor styles)

- [ ] **Step 1: Replace `theme/sections/lf-easter-egg.liquid`:**

```liquid
<div class="lf-easter" data-lf-easter aria-hidden="true">
  <div class="lf-easter__img" style="background-image: url('{{ 'lf-culture-1.jpg' | asset_url }}');"></div>
  <div class="lf-easter__text">
    <p class="lf-display">Laissez-Faire Leisure Club</p>
    <p>a neon-lit expression of New Orleans — {% render 'lf-stamp' %}</p>
  </div>
</div>

{% stylesheet %}
.lf-easter { position: fixed; inset: 0; z-index: 78; display: none; pointer-events: none; background: #000; }
.lf-easter.is-on { display: flex; align-items: flex-end; justify-content: space-between; padding: 2rem; }
.lf-easter__img { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: .55; }
.lf-easter__text { position: relative; }
.lf-easter__text .lf-display { color: var(--lf-neon-core); text-shadow: 0 0 10px var(--lf-neon-halo); font-size: 1.1rem; margin: 0 0 .3rem; }
.lf-easter__text p:last-child { color: var(--lf-muted); font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; margin: 0; }
{% endstylesheet %}

{% schema %}
{ "name": "LF Easter Egg", "settings": [] }
{% endschema %}
```

- [ ] **Step 2: Append cursor styles to `theme/assets/lf-tokens.css`:**

```css
/* Labeled cursor pill (desktop, pointer:fine — element in theme.liquid) */
.lf-cursor {
  position: fixed; top: 0; left: 0; z-index: 100; pointer-events: none; opacity: 0;
  background: var(--lf-panel); border: 1px solid var(--lf-neon-halo);
  padding: .3rem .7rem; will-change: transform;
}
.lf-cursor p {
  margin: 0; color: var(--lf-neon-core); text-shadow: 0 0 6px var(--lf-neon-halo);
  font-size: .62rem; letter-spacing: .2em; text-transform: uppercase; white-space: nowrap;
}
body.lf-cursor-on .lf-cursor { opacity: 1; }
@media (max-width: 991px), (pointer: coarse) { .lf-cursor { display: none; } }
@media (prefers-reduced-motion: reduce) { .lf-cursor { display: none; } }
```

- [ ] **Step 3: Append `LF.init.cursor` and `LF.init.easter` to `lf-chrome.js`:**

```js
  // ——— Labeled cursor (desktop only) ———
  LF.init.cursor = function (root, ctx) {
    var pill = document.querySelector('[data-lf-cursor]');
    if (!pill || pill.hasAttribute('data-lf-bound')) return;
    pill.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !FINE.matches || !window.gsap) return;
    var label = pill.querySelector('p');
    var xTo = gsap.quickTo(pill, 'x', { duration: .25, ease: 'power3' });
    var yTo = gsap.quickTo(pill, 'y', { duration: .25, ease: 'power3' });
    var current = null, lastText = '';
    window.addEventListener('mousemove', function (e) {
      var nearRight = e.clientX > window.innerWidth * 0.9;
      var nearBottom = e.clientY > window.innerHeight * 0.9;
      gsap.to(pill, { xPercent: nearRight ? -110 : 12, yPercent: nearBottom ? -110 : 16, duration: .15, ease: 'power3' });
      xTo(e.clientX); yTo(e.clientY);
      if (current) {
        var txt = (nearRight && current.getAttribute('data-easter-label')) || current.getAttribute('data-cursor') || '';
        if (txt !== lastText) { label.textContent = txt; lastText = txt; }
      }
    });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('[data-cursor]');
      current = t;
      if (t) {
        document.body.classList.add('lf-cursor-on');
        var txt = t.getAttribute('data-cursor') || '';
        if (txt !== lastText) { label.textContent = txt; lastText = txt; }
      } else {
        document.body.classList.remove('lf-cursor-on');
      }
    });
  };

  // ——— Easter-egg brand flash ———
  LF.init.easter = function (root, ctx) {
    var egg = document.querySelector('[data-lf-easter]');
    if (!egg || egg.hasAttribute('data-lf-bound')) return;
    egg.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !FINE.matches) return;
    var scrolling = false, scrollTimer = null;
    window.addEventListener('scroll', function () {
      scrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { scrolling = false; }, 150);
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('[data-easter]') && !scrolling) egg.classList.add('is-on');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('[data-easter]')) egg.classList.remove('is-on');
    });
  };
```

- [ ] **Step 4: Verify** — add a temporary `data-cursor="View Piece"` to any element on the dev page: pill follows and shows the label; near the right edge it flips side and (with `data-easter-label`) swaps text. `data-easter` hover flashes the overlay; it never triggers mid-scroll. Coarse pointers and reduced-motion: cursor hidden, easter inert.

- [ ] **Step 5: Commit**

```bash
git add theme/sections/lf-easter-egg.liquid theme/assets/lf-chrome.js theme/assets/lf-tokens.css
git commit -m "feat(b3.1): labeled cursor system + easter-egg brand flash overlay"
git status --short
```

---

### Task 8: Footer rebuild — variants, Site Index reveals, product image-follow

**Files:**
- Replace: `theme/sections/lf-footer.liquid` (wholesale)
- Modify: `theme/assets/lf-chrome.js` (append `LF.init.footerFollow`)
- Modify: `theme/assets/lf-sections.js` (delete old `LF.init.footerFollow`, lines ~186–202)
- Modify: `theme/assets/lf-tokens.css` (delete `.lf-follow-crest` block and its reduced-motion line)

- [ ] **Step 1: Replace `theme/sections/lf-footer.liquid` wholesale:**

```liquid
<footer class="lf-footer {% if section.settings.full_height %}lf-footer--full{% endif %}">
  <div class="lf-footer__top">
    <div class="lf-footer__brand">
      <div class="lf-footer__wordmark" role="img" aria-label="Laissez-Faire Leisure Club"
           style="--lf-wordmark: url('{{ 'lf-wordmark.png' | asset_url }}');" data-lf-reveal></div>
      <p class="lf-footer__club lf-script">a neon-lit expression of New Orleans</p>
    </div>
    <div class="lf-footer__grid">
      <nav class="lf-footer__col" aria-label="Site index">
        <p class="lf-footer__label">Site Index</p>
        <a href="{{ routes.all_products_collection_url }}" data-lf-findex="0">Shop now</a>
        <a href="{{ routes.root_url }}" data-lf-findex="1">Home</a>
        <a href="/pages/story" data-lf-findex="2">Story</a>
        <a href="{{ section.settings.contact_url | default: '/pages/contact' }}" data-lf-findex="3">Contact</a>
        <div class="lf-footer__findex" aria-hidden="true">
          <div style="background-image:url('{{ 'lf-culture-1.jpg' | asset_url }}')"></div>
          <div style="background-image:url('{{ 'lf-culture-2.jpg' | asset_url }}')"></div>
          <div style="background-image:url('{{ 'lf-culture-3.jpg' | asset_url }}')"></div>
          <div style="background-image:url('{{ 'lf-culture-1.jpg' | asset_url }}')"></div>
        </div>
      </nav>
      <nav class="lf-footer__col" aria-label="Social and contact">
        <p class="lf-footer__label">The Club</p>
        {% if section.settings.instagram_url != blank %}<a href="{{ section.settings.instagram_url }}" rel="me noopener" target="_blank">Instagram</a>{% endif %}
        {% if section.settings.contact_email != blank %}<a href="mailto:{{ section.settings.contact_email }}">{{ section.settings.contact_email }}</a>{% endif %}
        <button type="button" data-lf-signup-open class="lf-footer__joinbtn">Join the list</button>
      </nav>
      <div class="lf-footer__col lf-footer__followcol">
        <p class="lf-footer__label">The Rack</p>
        <ul class="lf-footer__plist" data-lf-flist>
          {% for product in collections.all.products limit: 8 %}
            <li>
              <a href="{{ product.url }}" data-lf-fimg="{{ product.featured_image | image_url: width: 480 }}">
                <span>{{ product.title }}</span>
                <span class="lf-footer__pcode">{% render 'lf-code', product: product %}</span>
              </a>
            </li>
          {% endfor %}
        </ul>
        <div class="lf-footer__follow" data-lf-follow aria-hidden="true"><img alt=""></div>
      </div>
    </div>
  </div>
  <div class="lf-footer__bottom">
    <nav class="lf-footer__legalnav" aria-label="Policies">
      {% for policy in shop.policies %}{% if policy != blank %}<a href="{{ policy.url }}">{{ policy.title }}</a>{% endif %}{% endfor %}
    </nav>
    <p class="lf-footer__legal">All rights reserved _ {% render 'lf-stamp' %} — New Orleans, Louisiana</p>
  </div>
</footer>

{% stylesheet %}
.lf-footer { padding: 4rem 1.25rem 1.5rem; border-top: 1px solid #1a1a22; }
.lf-footer--full { min-height: 100dvh; display: flex; flex-direction: column; justify-content: space-between; }
.lf-footer__wordmark {
  width: min(88vw, 900px); aspect-ratio: 2129/749; margin: 0 auto;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-wordmark) center/contain no-repeat; mask: var(--lf-wordmark) center/contain no-repeat;
  filter: drop-shadow(0 0 8px var(--lf-neon-halo)) drop-shadow(0 0 30px var(--lf-neon-halo));
}
.lf-footer__club { text-align: center; color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); font-size: 1.05rem; margin: .6rem 0 2.4rem; }
.lf-footer__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; max-width: 1100px; margin: 0 auto 2.5rem; }
.lf-footer__col { display: flex; flex-direction: column; gap: .55rem; position: relative; }
.lf-footer__label { color: var(--lf-neon-core); font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; margin: 0 0 .4rem; }
.lf-footer__col a, .lf-footer__joinbtn {
  color: var(--lf-muted); font-size: .74rem; letter-spacing: .18em; text-transform: uppercase; text-decoration: none;
  background: none; border: 0; padding: 0; cursor: pointer; text-align: left; font-family: var(--lf-font-body);
}
.lf-footer__col a:hover, .lf-footer__joinbtn:hover { color: var(--lf-neon-core); }
.lf-footer__findex { position: absolute; right: -20%; top: 0; width: 130px; aspect-ratio: 4/5; pointer-events: none; }
.lf-footer__findex div {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  visibility: hidden; border: 1px solid var(--lf-neon-halo);
}
.lf-footer__findex div.show { visibility: visible; }
.lf-footer__plist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.lf-footer__plist a { display: flex; justify-content: space-between; gap: .8rem; padding: .32rem 0; border-bottom: 1px solid #191922; }
.lf-footer__pcode { color: #55555f; }
.lf-footer__follow {
  position: absolute; right: -34%; top: 0; width: min(200px, 18vw); aspect-ratio: 4/5;
  overflow: hidden; pointer-events: none; border: 1px solid var(--lf-neon-halo);
  box-shadow: 0 0 24px rgba(74,168,255,.25);
  clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%); will-change: transform;
}
.lf-footer__follow img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-footer__bottom { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; max-width: 1100px; margin: 0 auto; border-top: 1px solid #1a1a22; padding-top: 1rem; }
.lf-footer__legalnav { display: flex; gap: 1.1rem; flex-wrap: wrap; }
.lf-footer__legalnav a { color: var(--lf-muted); font-size: .64rem; letter-spacing: .14em; text-transform: uppercase; text-decoration: none; }
.lf-footer__legal { color: var(--lf-muted); font-size: .64rem; letter-spacing: .1em; margin: 0; }
@media (max-width: 899px) {
  .lf-footer__grid { grid-template-columns: 1fr; }
  .lf-footer__findex, .lf-footer__follow { display: none; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Footer",
  "settings": [
    { "type": "checkbox", "id": "full_height", "label": "Full-height (100dvh) variant", "default": false },
    { "type": "url", "id": "instagram_url", "label": "Instagram URL" },
    { "type": "text", "id": "contact_email", "label": "Contact email" },
    { "type": "url", "id": "contact_url", "label": "Contact page URL" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Delete the old crest-follow** — remove `LF.init.footerFollow` from `theme/assets/lf-sections.js` (the whole `// ——— Footer crest cursor-follow` block through its closing `};`), remove the `<div class="lf-follow-crest" …>` line's counterpart CSS: delete the `.lf-follow-crest { … }` rule block and the `.lf-follow-crest { display: none; }` line inside the reduced-motion block in `theme/assets/lf-tokens.css`.

- [ ] **Step 3: Append the new `LF.init.footerFollow` to `lf-chrome.js`:**

```js
  // ——— Footer: Site Index per-link reveals + product image-follow ———
  LF.init.footerFollow = function (root, ctx) {
    var footer = document.querySelector('.lf-footer');
    if (!footer || footer.hasAttribute('data-lf-bound')) return;
    footer.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !FINE.matches || !window.gsap) return;

    // Site Index reveals
    var findexImgs = footer.querySelectorAll('.lf-footer__findex div');
    footer.querySelectorAll('[data-lf-findex]').forEach(function (a) {
      var i = parseInt(a.getAttribute('data-lf-findex'), 10);
      a.addEventListener('mouseenter', function () {
        findexImgs.forEach(function (d, j) { d.classList.toggle('show', j === i); });
      });
      a.addEventListener('mouseleave', function () {
        findexImgs.forEach(function (d) { d.classList.remove('show'); });
      });
    });

    // Product image-follow
    var list = footer.querySelector('[data-lf-flist]');
    var panel = footer.querySelector('[data-lf-follow]');
    if (!list || !panel) return;
    var img = panel.querySelector('img');
    var currentSrc = null;
    list.querySelectorAll('[data-lf-fimg]').forEach(function (a) {
      var pre = new Image(); pre.src = a.getAttribute('data-lf-fimg');
    });
    var yTo = gsap.quickTo(panel, 'y', { duration: .35, ease: 'power3' });
    list.addEventListener('mouseenter', function () {
      gsap.fromTo(panel,
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .5, ease: 'expo.inOut' });
    });
    list.addEventListener('mouseleave', function () {
      gsap.to(panel, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', duration: .5, ease: 'expo.inOut' });
      currentSrc = null;
    });
    list.addEventListener('mousemove', function (e) {
      var listRect = list.getBoundingClientRect();
      var h = panel.offsetHeight;
      var y = e.clientY - listRect.top - h / 2;
      y = Math.max(0, Math.min(y, listRect.height - h));
      yTo(y);
      var row = e.target.closest('[data-lf-fimg]');
      if (row) {
        var src = row.getAttribute('data-lf-fimg');
        if (src && src !== currentSrc) { currentSrc = src; img.src = src; }
      }
    });
  };
```

- [ ] **Step 4: Verify** — footer shows wordmark, three columns, policies row; hovering Site Index links reveals the matching image; entering the product list wipes the follow panel in, it tracks the cursor vertically clamped to the list, image swaps per row; "Join the list" opens the popup; mobile (≤899px) hides both follow elements; reduced-motion leaves a plain static footer.

- [ ] **Step 5: Commit**

```bash
git add theme/sections/lf-footer.liquid theme/assets/lf-chrome.js theme/assets/lf-sections.js theme/assets/lf-tokens.css
git commit -m "feat(b3.1): footer rebuild — variants, Site Index reveals, product image-follow"
git status --short
```

---

### Task 9: Voice snippets (stamp, eyebrow, product code)

**Files:**
- Create: `theme/snippets/lf-stamp.liquid`, `theme/snippets/lf-eyebrow.liquid`, `theme/snippets/lf-code.liquid`

- [ ] **Step 1: Create the three snippets** (these are referenced by Tasks 4–8; if executing in order, create this task FIRST or accept the render errors on dev until now — executors: **do this task before Task 4**; it is ordered here for narrative only, and the task order note in "Execution order" below is binding):

`theme/snippets/lf-stamp.liquid`:
```liquid
{%- comment -%} Brand stamp ornament. Usage: {% render 'lf-stamp' %} {%- endcomment -%}
<span class="lf-stamp" aria-hidden="true">LFLC&copy;26</span>
```

`theme/snippets/lf-eyebrow.liquid`:
```liquid
{%- comment -%} Parenthetical eyebrow. Usage: {% render 'lf-eyebrow', text: 'our story' %} {%- endcomment -%}
<p class="lf-eyebrow">(&nbsp;&nbsp;&nbsp;{{ text }}&nbsp;&nbsp;&nbsp;)</p>
```

`theme/snippets/lf-code.liquid`:
```liquid
{%- comment -%} Product code. Prefers metafield lfc.code; falls back to handle-derived. Usage: {% render 'lf-code', product: product %} {%- endcomment -%}
{%- if product.metafields.lfc.code != blank -%}
  <span class="lf-code">({{ product.metafields.lfc.code }})</span>
{%- else -%}
  <span class="lf-code">(LF_{{ product.handle | replace: '-', '_' | upcase | truncate: 10, '' }})</span>
{%- endif -%}
```

- [ ] **Step 2: Add shared styles to `theme/assets/lf-tokens.css`** (append):

```css
/* Voice components */
.lf-stamp { letter-spacing: .12em; }
.lf-eyebrow { color: var(--lf-muted); font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; }
.lf-code { color: #55555f; font-size: .9em; letter-spacing: .08em; }
```

- [ ] **Step 3: Commit**

```bash
git add theme/snippets/lf-stamp.liquid theme/snippets/lf-eyebrow.liquid theme/snippets/lf-code.liquid theme/assets/lf-tokens.css
git commit -m "feat(b3.1): voice components — stamp, eyebrow, product code snippets"
git status --short
```

**Execution order (binding):** Tasks 1 → 2 → **9** → 3 → 4 → 5 → 6 → 7 → 8 → 10.

---

### Task 10: Verification + ship `v0.4.0-chrome`

**Files:** none (verification + deploy)

- [ ] **Step 1: theme check** — `shopify theme check --path theme` clean (no new offenses vs. master baseline).

- [ ] **Step 2: Push to dev theme** — `shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com` (dev server must be restarted if schema names changed).

- [ ] **Step 3: Scripted behind-the-gate pass** (write to scratchpad, run with `NODE_PATH=/Users/dow/node_modules node <file>`; base `http://127.0.0.1:9292`):

```js
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:9292';
(async () => {
  const browser = await chromium.launch();

  // 1. Preloader: shows on first visit, absent on second (same context = same sessionStorage)
  const ctx1 = await browser.newContext();
  const p1 = await ctx1.newPage();
  await p1.goto(BASE + '/', { waitUntil: 'load' });
  console.log('preloader first visit visible:', await p1.evaluate(() =>
    getComputedStyle(document.querySelector('[data-lf-preloader]')).display !== 'none'
    || !document.documentElement.classList.contains('lf-first-visit'))); // true either mid-anim or already done
  await p1.waitForTimeout(3500);
  console.log('preloader finished (hidden):', await p1.evaluate(() =>
    getComputedStyle(document.querySelector('[data-lf-preloader]')).display === 'none'));
  const p2 = await ctx1.newPage();
  await p2.goto(BASE + '/', { waitUntil: 'load' });
  console.log('preloader absent on repeat:', await p2.evaluate(() =>
    !document.documentElement.classList.contains('lf-first-visit')));

  // 2. Menu: open, focus trapped, Esc closes, link nav closes + surges
  await p2.click('[data-lf-menu-open]');
  await p2.waitForTimeout(900);
  console.log('menu open:', await p2.evaluate(() => document.querySelector('[data-lf-menu-root]').getAttribute('data-state') === 'open'));
  console.log('focus inside menu:', await p2.evaluate(() => !!document.activeElement.closest('[data-lf-menu-root]')));
  await p2.keyboard.press('Escape');
  await p2.waitForTimeout(900);
  console.log('menu closed by Esc:', await p2.evaluate(() => document.querySelector('[data-lf-menu-root]').getAttribute('data-state') === 'closed'));
  console.log('scroll unlocked:', await p2.evaluate(() => document.documentElement.style.overflow === ''));
  await p2.click('[data-lf-menu-open]');
  await p2.waitForTimeout(900);
  await p2.click('.lf-menu__link[href*="/collections/"]');
  await p2.waitForTimeout(2500);
  console.log('menu link navigated:', p2.url().indexOf('/collections/') > -1);

  // 3. Signup popup: openSignup works, Esc closes
  await p2.evaluate(() => LF.openSignup());
  console.log('popup open:', await p2.evaluate(() => !document.querySelector('[data-lf-signup]').hasAttribute('hidden')));
  await p2.keyboard.press('Escape');
  console.log('popup closed:', await p2.evaluate(() => document.querySelector('[data-lf-signup]').hasAttribute('hidden')));

  // 4. Footer image-follow present + hidden on mobile width
  console.log('follow panel exists:', await p2.evaluate(() => !!document.querySelector('[data-lf-follow]')));

  // 5. Cart regression (drawer still opens from header)
  await p2.click('[data-lf-cart-open]');
  await p2.waitForTimeout(800);
  console.log('cart drawer opens:', await p2.evaluate(() => {
    const d = document.querySelector('[data-lf-drawer]');
    return d && d.classList.contains('is-open');
  }));

  // 6. Reduced motion: menu instant, preloader skipped, cursor hidden
  const ctx2 = await browser.newContext({ reducedMotion: 'reduce' });
  const p3 = await ctx2.newPage();
  await p3.goto(BASE + '/', { waitUntil: 'load' });
  console.log('RM: preloader skipped:', await p3.evaluate(() =>
    getComputedStyle(document.querySelector('[data-lf-preloader]')).display === 'none'));
  await p3.click('[data-lf-menu-open]');
  console.log('RM: menu open instantly:', await p3.evaluate(() => document.querySelector('[data-lf-menu-root]').getAttribute('data-state') === 'open'));
  console.log('RM: cursor hidden:', await p3.evaluate(() => getComputedStyle(document.querySelector('[data-lf-cursor]')).display === 'none'));

  // 7. 375px overflow sweep
  for (const path of ['/', '/collections/all', '/products/maria', '/pages/story']) {
    const m = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await m.goto(BASE + path, { waitUntil: 'load' });
    await m.waitForTimeout(400);
    console.log('375px', path, 'overflow:', await m.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth));
    await m.close();
  }

  // 8. Teaser regression
  const t = await browser.newPage();
  await t.goto(BASE + '/password', { waitUntil: 'load' }).catch(() => {});
  console.log('teaser intact, barba-free:', await t.evaluate(() =>
    !!document.querySelector('.lf-teaser, [data-lf-teaser]') && !document.querySelector('[data-barba]')));

  await browser.close();
})();
```

Expected: every line `true` / overflow `0`. Fix findings, re-run until clean; commit fixes as `fix(b3.1): <finding>` and amend the relevant plan code blocks.

- [ ] **Step 4: User visual pass** on the dev preview (menu feel, preloader, footer follow, popup styling). Fix + re-verify anything raised.

- [ ] **Step 5: Ship**

```bash
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
curl -sL "https://laissezfaireleisureclub.com/" | grep -o "lf-teaser" | head -1   # teaser still gating
git checkout master && git merge --no-ff feat/phase-b3-chrome -m "Ship B3.1: global chrome" && git tag v0.4.0-chrome
git push origin master --tags
```

Expected: teaser still prints; tag exists on GitHub.

---

## Not in this plan

Page rebuilds (B3.2 plan), commerce rebuilds (B3.3 plan), real imagery/video, `data-cursor`/`data-easter`/`[data-nav-light]` attribute placement on page content (each page task adds its own markers when it's rebuilt — chrome ships with the *systems* live but sparsely triggered).

## Self-review notes

- **Spec coverage (B3.1 §4):** menu ✓ (T4), preloader + 10s popup timer ✓ (T5), cursor + secret labels ✓ (T7), nav recolor/pull-up ✓ (T3), popup ✓ (T6), easter egg ✓ (T7), footer variants + index reveals + image-follow (absorbing crest-follow) ✓ (T8), voice pass ✓ (T9), a11y floor (focus traps, Esc, aria-expanded) ✓ (T4/T6/T3), reduced-motion table ✓ (every init early-returns; CSS fallbacks in T4/T5/T7), desktop gating via `FINE` ✓, teardown discipline: chrome binds once; nav triggers die in the existing `beforeLeave` sweep ✓ (T3 note).
- **Placeholder scan:** none — all code complete; stubs are real files replaced wholesale by named tasks.
- **Consistency:** `data-lf-menu-open/close`, `data-lf-signup`/`LF.openSignup`, `data-lf-cursor`, `data-lf-easter`, `data-lf-follow`/`data-lf-fimg`/`data-lf-findex`, `lf-ease-3` usage, and the z-index scale are each defined once and referenced consistently across tasks; `LF.init.header` removal (T3) matches the header markup that no longer renders a burger; execution-order override for T9 is stated in both T9 and after it.
