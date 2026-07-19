# Laissez-Faire Leisure Club — Phase B2 (Signature Motion Layer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the locked motion language — Electrical Surge page transitions (Barba), single-stutter hovers (CSS), letter-ignite headings (SplitText + ScrollTrigger), crest cursor-follow, horizontal hero gestures (Observer) — plus the vibe-review backlog (cart hardening, Intl money, variant JSON, nav settings, README/RUNBOOK), tagged `v0.3.0-motion`.

**Architecture:** Section behavior JS migrates out of per-page `{% javascript %}` bundles into one shared `lf-sections.js` init registry (`window.LF.init.<name>(root, ctx)`), dispatched on load and on every Barba `afterEnter` — this is what makes DOM-swap navigation safe on Shopify. `lf-motion.js` owns Lenis, Barba + surge timelines, reduced-motion switchboard, and registry dispatch. Header/footer/cart-drawer/blackout live outside the Barba container and persist. Hover buzz is pure CSS in `lf-tokens.css`.

**Tech Stack:** GSAP 3.12.7 (+ ScrollTrigger, SplitText, Observer — all free, vendored, pinned), @barba/core 2.x (vendored), Lenis 1.2.3 (already vendored), Liquid, vanilla JS/CSS.

**Spec:** `docs/superpowers/specs/2026-07-18-phase-b2-motion-design.md`
**Store:** `1xiwxi-yy.myshopify.com` · live theme `#161862975716` · branch `feat/phase-b2`
**Verification model:** `shopify theme check --path theme` must stay at the 3-RemoteAsset-warning baseline after every task; behavioral checks run against `shopify theme dev` with expected results stated. Never push to the live theme until the final task. The teaser (`layout/password.liquid`, `sections/lf-teaser.liquid`, `templates/password.json`) must remain untouched by every task.

**Tokens quick reference:** `--lf-ground #0d0d11`, `--lf-neon-core #9fd8ff`, `--lf-neon-halo #4aa8ff`, `--lf-muted #7a7a85`, `--lf-body-text #c9c9d4`, `--lf-ease cubic-bezier(0.32,0.72,0,1)`.

## File structure

```
theme/
├── assets/
│   ├── SplitText.min.js        (Task 1: vendor 3.12.7)
│   ├── Observer.min.js         (Task 1: already-planned vendor — confirm/refresh 3.12.7)
│   ├── barba.min.js            (Task 1: vendor @barba/core 2.10.3)
│   ├── lf-motion.js            (Task 3: full rewrite — Lenis + Barba + surge + registry dispatch)
│   ├── lf-sections.js          (Task 5: NEW — header/hero/pdp/ignite/footer-follow inits)
│   └── lf-tokens.css           (Task 4: buzz, ignite, blackout CSS appended)
├── layout/theme.liquid         (Task 2: Barba wrapper/container, blackout div, script tags)
├── sections/
│   ├── lf-header.liquid        (Task 5: JS block removed → registry; Task 8: link settings)
│   ├── lf-hero-slider.liquid   (Task 5: JS block removed → registry)
│   ├── lf-product.liquid       (Task 5: JS block removed → registry; variants island → json filter)
│   ├── lf-cart-drawer.liquid   (Task 7: hardening + Intl money — JS block STAYS here, it renders on every page)
│   ├── lf-featured-story.liquid(Task 6: data-lf-ignite on h2)
│   ├── lf-collection.liquid    (Task 6: data-lf-ignite on h1)
│   ├── lf-story.liquid         (Task 6: data-lf-ignite on h1)
│   └── lf-footer.liquid        (Task 6: follow-crest element; Task 8: link settings)
├── README.md                   (Task 9: NEW, repo root)
└── RUNBOOK.md                  (Task 9: NEW, repo root)
```

---

### Task 1: Branch + vendors

**Files:**
- Create: `theme/assets/SplitText.min.js`, `theme/assets/barba.min.js`
- Verify/refresh: `theme/assets/Observer.min.js` (may not exist yet — B1 vendored only gsap/ScrollTrigger/lenis)

- [ ] **Step 1: Branch**

```bash
cd /Users/dow/laissez-faire && git checkout master && git pull && git checkout -b feat/phase-b2
```

- [ ] **Step 2: Vendor pinned libs**

```bash
curl -sL https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/SplitText.min.js -o theme/assets/SplitText.min.js
curl -sL https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/Observer.min.js -o theme/assets/Observer.min.js
curl -sL https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.js -o theme/assets/barba.min.js
head -c 120 theme/assets/SplitText.min.js; echo; head -c 120 theme/assets/barba.min.js; echo
du -h theme/assets/SplitText.min.js theme/assets/Observer.min.js theme/assets/barba.min.js
```

Expected: real minified JS (SplitText header shows `/*! SplitText 3.12.7`; barba UMD wrapper, ~25KB). If the jsdelivr path for SplitText 404s (it shipped to the public package at 3.13), retry with `gsap@3.13.0/dist/SplitText.min.js` and pin ALL gsap-family vendors to the same 3.13.0 (re-download gsap, ScrollTrigger, Observer at 3.13.0 too — mixed GSAP versions are not supported). Record which version was used.

- [ ] **Step 3: Check + commit**

Run: `shopify theme check --path theme` → 3-warning baseline.

```bash
git add theme/assets && git commit -m "Vendor SplitText, Observer, Barba for the motion layer"
```

### Task 2: Layout — Barba wrapper, blackout, script tags

**Files:**
- Modify (rewrite): `theme/layout/theme.liquid`

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
    <main id="lf-main" data-barba="wrapper">
      <div data-barba="container" data-barba-namespace="{{ template.name }}">{{ content_for_layout }}</div>
    </main>
    {% sections 'footer-group' %}
    {% section 'lf-cart-drawer' %}
    <div id="lf-blackout" aria-hidden="true"></div>
    <script src="{{ 'gsap.min.js' | asset_url }}" defer></script>
    <script src="{{ 'ScrollTrigger.min.js' | asset_url }}" defer></script>
    <script src="{{ 'SplitText.min.js' | asset_url }}" defer></script>
    <script src="{{ 'Observer.min.js' | asset_url }}" defer></script>
    <script src="{{ 'barba.min.js' | asset_url }}" defer></script>
    <script src="{{ 'lenis.min.js' | asset_url }}" defer></script>
    <script src="{{ 'lf-sections.js' | asset_url }}" defer></script>
    <script src="{{ 'lf-motion.js' | asset_url }}" defer></script>
  </body>
</html>
```

(Order matters: `lf-sections.js` registers inits; `lf-motion.js` dispatches them. Both deferred, so DOM is parsed first. `lf-sections.js` doesn't exist until Task 5 — the resulting `MissingTemplate`-style asset 404 is inert at runtime and `theme check` does not flag asset_url references; note any new offense honestly.)

**Note:** footer group is OUTSIDE the Barba container, so the footer (and its cursor-follow) persists across swaps — matching header/drawer. Barba fetches full pages and swaps only the container.

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/layout/theme.liquid && git commit -m "Barba wrapper/container in layout, blackout overlay, motion script tags"
```

Expected: 3-warning baseline.

### Task 3: `lf-motion.js` — core rewrite (complete file)

**Files:**
- Modify (rewrite): `theme/assets/lf-motion.js`

- [ ] **Step 1: Write `theme/assets/lf-motion.js`**

```js
/* LF motion core: Lenis smooth scroll, Barba surge transitions, reduced-motion
   switchboard, and the section init registry dispatch. Sections register
   behavior in lf-sections.js as LF.init.<name>(root, ctx); this file calls
   them on first load and after every Barba swap. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.LF = window.LF || {};
  LF.init = LF.init || {};
  LF.ctx = { reduced: reduced };

  function runInits(root) {
    Object.keys(LF.init).forEach(function (k) {
      try { LF.init[k](root || document, LF.ctx); } catch (e) { /* one broken section must not kill the rest */ }
    });
  }
  LF.runInits = runInits;

  // Smooth scroll
  if (!reduced && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.11 });
    window.lfLenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }

  // Scroll reveals ([data-lf-reveal]) as a registry init so swapped-in pages get them too.
  LF.init.reveals = function (root, ctx) {
    var els = (root || document).querySelectorAll('[data-lf-reveal]:not(.lf-revealed)');
    if (ctx.reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('lf-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('lf-revealed'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };

  // First-load dispatch (scripts are deferred: DOM is ready).
  runInits(document);

  // ——— Barba surge transitions ———
  if (!window.barba || !window.gsap) return;
  var blackout = document.getElementById('lf-blackout');
  if (!blackout) return;

  if (reduced) {
    // Instant swap, no surge — still Barba so nav stays consistent, but zero animation.
    barba.init({
      timeout: 7000,
      prevent: preventRule,
      transitions: [{
        leave: function () {},
        enter: function () { window.scrollTo(0, 0); }
      }]
    });
  } else {
    barba.init({
      timeout: 7000,
      prevent: preventRule,
      transitions: [{
        leave: function (data) {
          bumpNav();
          var f = trimFactor();
          return gsap.timeline()
            .to(data.current.container, {
              keyframes: [{ opacity: .1 }, { opacity: 1 }, { opacity: .15 }, { opacity: .9 }, { opacity: .05 }, { opacity: 0 }],
              duration: .55 * f, ease: 'steps(5)'
            })
            .to(blackout, { opacity: 1, duration: .12 * f }, '<70%')
            .then();
        },
        enter: function (data) {
          window.scrollTo(0, 0);
          if (window.lfLenis) lfLenis.scrollTo(0, { immediate: true });
          var f = trimFactor();
          gsap.set(data.next.container, { opacity: 0 });
          return gsap.timeline()
            .to(blackout, { opacity: 0, duration: .15 * f, delay: .15 * f })
            .to(data.next.container, {
              keyframes: [{ opacity: .8 }, { opacity: .1 }, { opacity: 1 }, { opacity: .2 }, { opacity: 1 }, { opacity: .6 }, { opacity: 1 }],
              duration: .9 * f, ease: 'steps(6)'
            }, '<')
            .then();
        }
      }]
    });
  }

  function preventRule(data) {
    var el = data.el;
    var href = (data.href || '');
    if (el && el.closest('[data-no-barba]')) return true;
    if (/\/checkouts?|\/cart\/c\/|\/account|\/password/.test(href)) return true;
    return false;
  }

  var navCount = 0;
  try { navCount = parseInt(sessionStorage.getItem('lfNav') || '0', 10) || 0; } catch (e) {}
  function bumpNav() { navCount++; try { sessionStorage.setItem('lfNav', String(navCount)); } catch (e) {} }
  function trimFactor() { return navCount > 0 ? 0.7 : 1; }

  barba.hooks.beforeLeave(function () {
    if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
  });
  barba.hooks.afterEnter(function (data) {
    var m = data && data.next && data.next.html && data.next.html.match(/<title>([\s\S]*?)<\/title>/i);
    if (m) {
      var t = document.createElement('textarea'); t.innerHTML = m[1]; document.title = t.value;
    }
    runInits(data.next.container);
    var main = document.getElementById('lf-main');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
  });
})();
```

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/assets/lf-motion.js && git commit -m "Motion core: Barba surge transitions, registry dispatch, reduced-motion switchboard"
```

### Task 4: Tokens CSS — buzz, ignite, blackout

**Files:**
- Modify: `theme/assets/lf-tokens.css` (append at end)

- [ ] **Step 1: Append to `theme/assets/lf-tokens.css`**

```css
/* ——— B2 motion layer ——— */

/* Blackout overlay for surge page transitions (driven by lf-motion.js) */
#lf-blackout { position: fixed; inset: 0; background: #000; opacity: 0; pointer-events: none; z-index: 90; }

/* Single-stutter hover: one electrical catch, then steady brighter glow.
   Applied to the theme's interactive neon elements. */
@keyframes lf-buzz-once {
  0% { opacity: 1; } 12% { opacity: .35; } 22% { opacity: 1; }
  34% { opacity: .6; } 46% { opacity: 1; } 100% { opacity: 1; }
}
.lf-pdp__add:hover, .lf-teaser__row button:hover, .lf-email__row button:hover,
.lf-drawer__checkout:hover, .lf-hero__cta:hover, .lf-fstory__cta:hover, .lf-dgrid__cta:hover {
  animation: lf-buzz-once .45s steps(1, end) 1;
}
.lf-header__nav a:hover, .lf-footer__cols a:hover {
  animation: lf-buzz-once .45s steps(1, end) 1;
}

/* Letter ignite: chars are pre-colored lit; dim = low opacity on the night ground. */
[data-lf-ignite] { visibility: visible; }
.lf-ignite-char { display: inline-block; white-space: pre; opacity: .12; }
.lf-ignite-done .lf-ignite-char, .lf-lit .lf-ignite-char { opacity: 1; }

/* Crest cursor-follow (footer, desktop only — element added in lf-footer.liquid) */
.lf-follow-crest {
  position: fixed; width: 64px; aspect-ratio: 300/320; pointer-events: none; z-index: 80;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat;
  mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 6px var(--lf-neon-halo)) drop-shadow(0 0 20px var(--lf-neon-halo));
  opacity: 0; top: 0; left: 0; will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .lf-pdp__add:hover, .lf-teaser__row button:hover, .lf-email__row button:hover,
  .lf-drawer__checkout:hover, .lf-hero__cta:hover, .lf-fstory__cta:hover, .lf-dgrid__cta:hover,
  .lf-header__nav a:hover, .lf-footer__cols a:hover { animation: none; }
  .lf-ignite-char { opacity: 1 !important; }
  .lf-follow-crest { display: none; }
}
```

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/assets/lf-tokens.css && git commit -m "Motion CSS: hover buzz, ignite char states, blackout, follow-crest"
```

### Task 5: `lf-sections.js` registry + section JS migration

**Files:**
- Create: `theme/assets/lf-sections.js`
- Modify: `theme/sections/lf-header.liquid` (delete its `{% javascript %}` block entirely)
- Modify: `theme/sections/lf-hero-slider.liquid` (delete its `{% javascript %}` block entirely)
- Modify: `theme/sections/lf-product.liquid` (delete its `{% javascript %}` block entirely; replace the variants `<script type="application/json">` island — see Step 3)

- [ ] **Step 1: Write `theme/assets/lf-sections.js` (complete file)**

```js
/* LF section behaviors as registry inits. Registered here, dispatched by
   lf-motion.js on first load and after every Barba swap. Each init must be
   idempotent: guard with data-lf-bound markers, and query within `root`. */
(function () {
  window.LF = window.LF || {};
  LF.init = LF.init || {};

  var fmtCache = {};
  LF.money = function (cents) {
    var cur = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD';
    fmtCache[cur] = fmtCache[cur] || new Intl.NumberFormat(undefined, { style: 'currency', currency: cur });
    return fmtCache[cur].format(cents / 100);
  };
  LF.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // ——— Header: mobile overlay menu (header persists outside Barba; bind once) ———
  LF.init.header = function () {
    var burger = document.querySelector('[data-lf-menu-toggle]');
    var overlay = document.querySelector('[data-lf-menu]');
    if (!burger || !overlay || burger.hasAttribute('data-lf-bound')) return;
    burger.setAttribute('data-lf-bound', '1');
    burger.addEventListener('click', function () {
      var open = overlay.hasAttribute('hidden');
      if (open) { overlay.removeAttribute('hidden'); } else { overlay.setAttribute('hidden', ''); }
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('a')) { overlay.setAttribute('hidden', ''); document.documentElement.style.overflow = ''; }
    });
  };

  // ——— Hero slider: buttons, autoplay, horizontal gestures ———
  LF.init.hero = function (root, ctx) {
    var hero = (root || document).querySelector('[data-lf-hero]');
    if (!hero || hero.hasAttribute('data-lf-bound')) return;
    hero.setAttribute('data-lf-bound', '1');
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-slide]'));
    var cur = hero.querySelector('[data-lf-current]');
    var i = 0, n = slides.length, timer = null;
    var secs = parseInt(hero.getAttribute('data-autoplay'), 10) || 0;
    function go(next) {
      slides[i].classList.remove('is-active');
      i = (next + n) % n;
      slides[i].classList.add('is-active');
      if (cur) cur.textContent = String(i + 1).padStart(2, '0');
    }
    function arm() {
      if (secs > 0 && !ctx.reduced && n > 1) { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, secs * 1000); }
    }
    var next = hero.querySelector('[data-lf-next]'), prev = hero.querySelector('[data-lf-prev]');
    if (next) next.addEventListener('click', function () { go(i + 1); arm(); });
    if (prev) prev.addEventListener('click', function () { go(i - 1); arm(); });
    arm();
    // Horizontal-only gestures; vertical scroll stays native.
    if (!ctx.reduced && window.Observer && n > 1) {
      Observer.create({
        target: hero, type: 'touch,wheel', lockAxis: true, tolerance: 60, preventDefault: false,
        onLeft: function () { go(i + 1); arm(); },
        onRight: function () { go(i - 1); arm(); }
      });
    }
  };

  // ——— PDP: variant sync, gallery, AJAX add-to-cart ———
  LF.init.pdp = function (root) {
    var pdp = (root || document).querySelector('[data-lf-pdp]');
    if (!pdp || pdp.hasAttribute('data-lf-bound')) return;
    pdp.setAttribute('data-lf-bound', '1');
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
    function showSlide(nn) {
      if (!slides.length) return;
      slides[gi].classList.remove('is-active');
      gi = (nn + slides.length) % slides.length;
      slides[gi].classList.add('is-active');
      if (gnum) gnum.textContent = (gi + 1) + ' / ' + slides.length;
    }
    function syncGalleryTo(garment) {
      var target = slides.findIndex(function (s) { return (s.getAttribute('data-alt') || '').indexOf(garment) === 0; });
      if (target >= 0) showSlide(target);
    }
    function update() {
      var opts = selectedOptions();
      var v = findVariant(opts);
      if (v) {
        idInput.value = v.id;
        priceEl.textContent = LF.money(v.price);
        addPrice.textContent = LF.money(v.price);
        addBtn.disabled = !v.available;
        soldEl.hidden = v.available;
      }
      if (opts[0]) syncGalleryTo(opts[0]);
    }
    pdp.querySelectorAll('.lf-pdp__opt input').forEach(function (r) { r.addEventListener('change', update); });
    var gp = pdp.querySelector('[data-lf-gprev]'), gn = pdp.querySelector('[data-lf-gnext]');
    if (gp) gp.addEventListener('click', function () { showSlide(gi - 1); });
    if (gn) gn.addEventListener('click', function () { showSlide(gi + 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      addBtn.disabled = true;
      fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(idInput.value, 10), quantity: 1 })
      }).then(function (r) {
        if (!r.ok) throw new Error('add failed');
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
  };

  // ——— Letter ignite (SplitText + ScrollTrigger) ———
  LF.init.ignite = function (root, ctx) {
    var els = (root || document).querySelectorAll('[data-lf-ignite]:not([data-lf-ignited])');
    els.forEach(function (el) {
      el.setAttribute('data-lf-ignited', '1');
      if (ctx.reduced || !window.SplitText || !window.ScrollTrigger || !window.gsap) {
        el.classList.add('lf-lit');
        return;
      }
      var split = new SplitText(el, { type: 'chars', charsClass: 'lf-ignite-char' });
      var per = Math.min(0.055, 0.9 / Math.max(split.chars.length, 1));
      ScrollTrigger.create({
        trigger: el, start: 'top 55%', once: true,
        onEnter: function () {
          gsap.to(split.chars, {
            keyframes: [{ opacity: .5 }, { opacity: .12 }, { opacity: 1 }, { opacity: .3 }, { opacity: 1 }],
            duration: .5, ease: 'steps(4)', stagger: per,
            onComplete: function () { el.classList.add('lf-ignite-done'); }
          });
        }
      });
    });
  };

  // ——— Footer crest cursor-follow (footer persists; bind once) ———
  LF.init.footerFollow = function (root, ctx) {
    if (ctx.reduced || !window.gsap) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var wm = document.querySelector('.lf-footer__wordmark');
    var crest = document.querySelector('.lf-follow-crest');
    if (!wm || !crest || crest.hasAttribute('data-lf-bound')) return;
    crest.setAttribute('data-lf-bound', '1');
    var qx = gsap.quickTo(crest, 'x', { duration: 0.4, ease: 'power3' });
    var qy = gsap.quickTo(crest, 'y', { duration: 0.4, ease: 'power3' });
    var zone = wm.closest('.lf-footer') || wm;
    zone.addEventListener('mousemove', function (e) {
      qx(e.clientX - 32); qy(e.clientY - 40);
    });
    zone.addEventListener('mouseenter', function () { gsap.to(crest, { opacity: .9, duration: .3 }); });
    zone.addEventListener('mouseleave', function () { gsap.to(crest, { opacity: 0, duration: .3 }); });
  };
})();
```

- [ ] **Step 2: Delete the `{% javascript %}` blocks** (entire tag pair and contents) from `theme/sections/lf-header.liquid`, `theme/sections/lf-hero-slider.liquid`, and `theme/sections/lf-product.liquid`. Do not touch their markup, `{% stylesheet %}`, or `{% schema %}` in this task (Tasks 6/8 make their own edits).

- [ ] **Step 3: In `theme/sections/lf-product.liquid`, replace the hand-assembled variants island (P3-003):**

Replace:

```liquid
  <script type="application/json" data-lf-variants>
    [{% for v in product.variants %}{"id":{{ v.id }},"available":{{ v.available }},"price":"{{ v.price | money }}","options":{{ v.options | json }}}{% unless forloop.last %},{% endunless %}{% endfor %}]
  </script>
```

with:

```liquid
  {%- comment -%} price is cents; client formats via Intl (LF.money). {%- endcomment -%}
  <script type="application/json" data-lf-variants>
    [{% for v in product.variants %}{{ v | json }}{% unless forloop.last %},{% endunless %}{% endfor %}]
  </script>
```

(`variant | json` includes `id`, `available`, `price` in cents, and `options` — exactly what `LF.init.pdp` consumes.)

- [ ] **Step 4: Check + commit**

```bash
shopify theme check --path theme
git add theme/assets/lf-sections.js theme/sections/lf-header.liquid theme/sections/lf-hero-slider.liquid theme/sections/lf-product.liquid
git commit -m "Migrate section JS to lf-sections registry; gestures, ignite, crest follow; variant JSON via json filter"
```

Expected: 3-warning baseline.

### Task 6: Ignite attributes + follow-crest element

**Files:**
- Modify: `theme/sections/lf-featured-story.liquid` — the `<h2 class="lf-display lf-glow-text">{{ product.title }}</h2>` line becomes `<h2 class="lf-display lf-glow-text" data-lf-ignite>{{ product.title }}</h2>`
- Modify: `theme/sections/lf-collection.liquid` — `<h1 class="lf-display lf-glow-text">{{ collection.title }}</h1>` gains `data-lf-ignite`
- Modify: `theme/sections/lf-story.liquid` — `<h1 class="lf-display lf-glow-text">{{ page.title }}</h1>` gains `data-lf-ignite`
- Modify: `theme/sections/lf-product.liquid` — `<h1 class="lf-display lf-glow-text">{{ product.title }}</h1>` gains `data-lf-ignite`
- Modify: `theme/sections/lf-footer.liquid` — add `<div class="lf-follow-crest" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>` as the LAST child inside the `<footer class="lf-footer">` element

- [ ] **Step 1: Make the five edits above** (attribute additions + one new element; nothing else changes).

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/sections && git commit -m "Ignite attributes on display headings; follow-crest element in footer"
```

### Task 7: Cart drawer hardening + Intl money (P2-001, P2-002, P3-001)

**Files:**
- Modify: `theme/sections/lf-cart-drawer.liquid` — replace its `{% javascript %}` block content with:

```js
  var drawer = document.querySelector('[data-lf-drawer]');
  if (drawer) {
    var itemsEl = drawer.querySelector('[data-lf-cart-items]');
    var subEl = drawer.querySelector('[data-lf-cart-subtotal]');

    function fail() {
      itemsEl.innerHTML = '<p class="lf-drawer__empty" role="alert">Something flickered — <button type="button" class="lf-drawer__retry" data-lf-cart-retry>try again</button></p>';
    }
    function render(cart) {
      document.querySelectorAll('[data-lf-cart-count]').forEach(function (el) { el.textContent = cart.item_count; });
      subEl.textContent = LF.money(cart.total_price);
      if (!cart.items.length) { itemsEl.innerHTML = '<p class="lf-drawer__empty">The rack is empty.</p>'; return; }
      itemsEl.innerHTML = cart.items.map(function (it) {
        return '<div class="lf-drawer__item">' +
          '<img src="' + (it.image ? LF.esc(it.image) + (it.image.indexOf('?') > -1 ? '&' : '?') + 'width=120' : '') + '" width="60" height="60" alt="">' +
          '<div><p>' + LF.esc(it.product_title) + '</p><p class="muted">' + LF.esc(it.variant_title || '') + '</p>' +
          '<span class="lf-drawer__qty">' +
          '<button type="button" data-lf-line="' + LF.esc(it.key) + '" data-lf-set="' + (it.quantity - 1) + '">−</button>' +
          '<span>' + it.quantity + '</span>' +
          '<button type="button" data-lf-line="' + LF.esc(it.key) + '" data-lf-set="' + (it.quantity + 1) + '">+</button>' +
          '</span></div>' +
          '<p>' + LF.money(it.final_line_price) + '</p></div>';
      }).join('');
    }
    function refresh() {
      return fetch('/cart.js').then(function (r) {
        if (!r.ok) throw new Error('cart fetch failed');
        return r.json();
      }).then(render).catch(fail);
    }
    function open() { drawer.removeAttribute('hidden'); requestAnimationFrame(function () { drawer.classList.add('is-open'); }); refresh(); }
    function close() { drawer.classList.remove('is-open'); setTimeout(function () { drawer.setAttribute('hidden', ''); }, 460); }

    document.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-lf-cart-open]');
      var closeBtn = e.target.closest('[data-lf-cart-close]');
      var qtyBtn = e.target.closest('[data-lf-line]');
      var retryBtn = e.target.closest('[data-lf-cart-retry]');
      if (openBtn) { e.preventDefault(); open(); }
      if (closeBtn) { close(); }
      if (retryBtn) { refresh(); }
      if (qtyBtn) {
        // Line-item keys contain colons — pass whole, never split.
        fetch('/cart/change.js', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: qtyBtn.getAttribute('data-lf-line'), quantity: Math.max(0, parseInt(qtyBtn.getAttribute('data-lf-set'), 10)) })
        }).then(function (r) {
          if (!r.ok) throw new Error('change failed');
          return r.json();
        }).then(render).catch(fail);
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hasAttribute('hidden')) close(); });
    document.addEventListener('lf:cart:added', open);
  }
```

Also append one CSS rule inside the section's `{% stylesheet %}` block (after the `.lf-drawer__empty` rule):

```css
.lf-drawer__retry { background: none; border: 0; color: var(--lf-neon-core); text-decoration: underline; cursor: pointer; font: inherit; }
```

(Drawer JS stays in the section — the drawer renders from the layout on every page, so its per-page bundle is always present, and it must work even if `lf-sections.js` fails. It uses `LF.money`/`LF.esc`, which load earlier via `lf-sections.js`; the guard is that both scripts are deferred in order. The server-rendered Liquid fallback items still cover the no-JS case.)

- [ ] **Step 2: Check + commit**

```bash
shopify theme check --path theme
git add theme/sections/lf-cart-drawer.liquid
git commit -m "Harden cart drawer: r.ok+catch with retry, escaped titles, Intl money"
```

### Task 8: Nav link settings (P3-004)

**Files:**
- Modify: `theme/sections/lf-header.liquid`, `theme/sections/lf-footer.liquid`

- [ ] **Step 1: Header** — replace the two hardcoded nav anchors:

```liquid
  <nav class="lf-header__nav" aria-label="Main">
    <a href="{{ section.settings.link_1_url | default: routes.all_products_collection_url }}">{{ section.settings.link_1_label | default: 'Shop' }}</a>
    <a href="{{ section.settings.link_2_url | default: '/pages/story' }}">{{ section.settings.link_2_label | default: 'Story' }}</a>
  </nav>
```

Apply the same pattern to the two links inside the mobile overlay (`data-lf-menu`), and replace the header schema with:

```json
{
  "name": "LF Header",
  "settings": [
    { "type": "text", "id": "link_1_label", "label": "Link 1 label", "default": "Shop" },
    { "type": "url", "id": "link_1_url", "label": "Link 1 URL" },
    { "type": "text", "id": "link_2_label", "label": "Link 2 label", "default": "Story" },
    { "type": "url", "id": "link_2_url", "label": "Link 2 URL" }
  ]
}
```

- [ ] **Step 2: Footer** — same treatment for the footer's Shop/Story anchors, adding the identical four settings to the footer schema (alongside its existing `instagram_url`/`contact_email`).

- [ ] **Step 3: Check + commit**

```bash
shopify theme check --path theme
git add theme/sections/lf-header.liquid theme/sections/lf-footer.liquid
git commit -m "Nav links become schema settings with route-based defaults"
```

### Task 9: README + RUNBOOK (P2-004, P2-005)

**Files:**
- Create: `README.md`, `RUNBOOK.md` (repo root)

- [ ] **Step 1: Write `README.md`**

```markdown
# Laissez-Faire Leisure Club — storefront

New Orleans luxury streetwear. Shopify Online Store 2.0 theme, hand-built
(no Dawn, no page builders). Public site: https://laissezfaireleisureclub.com
(password-gated until drop day; teaser collects emails).

## Layout of this repo

- `theme/` — the Shopify theme (Liquid + vanilla CSS/JS)
  - `assets/lf-tokens.css` — design tokens + motion CSS (single source of visual truth)
  - `assets/lf-motion.js` — Lenis, Barba surge transitions, init-registry dispatch
  - `assets/lf-sections.js` — section behaviors (`LF.init.*`), swap-safe
  - `sections/lf-*.liquid` — all LF sections (markup + scoped styles + schema)
  - vendored libs: GSAP/ScrollTrigger/SplitText/Observer/Barba/Lenis (pinned, self-hosted)
- `scripts/create-products.mjs` — Drop 001 catalog loader (Admin GraphQL,
  client-credentials auth; secret in macOS Keychain `lf-shopify-client-secret`)
- `docs/superpowers/specs|plans/` — design specs and implementation plans (source of truth
  for every decision; read newest first)

## Dev loop

```bash
shopify theme dev --path theme --store 1xiwxi-yy.myshopify.com   # local preview w/ hot reload
shopify theme check --path theme                                  # lint (baseline: 3 RemoteAsset warnings)
```

## Deploy

```bash
# development theme (safe):
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
# live theme (public front door is the password page until drop day):
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
```

CI runs theme-check on every push (`.github/workflows/theme-check.yml`).
See `RUNBOOK.md` for drop-day, rollback, and credentials.
```

- [ ] **Step 2: Write `RUNBOOK.md`**

```markdown
# Runbook — Laissez-Faire Leisure Club

## Drop day (opening the store)

1. Shopify admin → Settings → Payments → activate Shopify Payments.
2. Verify products/prices/inventory in admin (edition sizes: metafield `lfc.edition_size`).
3. Online Store → Preferences → Password protection → OFF.
4. Klaviyo → send the "lights on" campaign to the `teaser-list` segment.
5. Smoke test on laissezfaireleisureclub.com: browse → PDP → cart → real checkout.

## Rollback (bad theme push)

```bash
git checkout <last-good-tag>            # e.g. v0.2.0-store
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
git checkout master
```
Tags: `v0.1.0-teaser` (teaser only) · `v0.2.0-store` (full store) · `v0.3.0-motion` (motion layer).

## Credentials

- **Storefront password:** admin → Online Store → Preferences (also entered via the
  teaser's "Members" link).
- **Admin API (catalog scripts):** Dev Dashboard app `lf-catalog-loader`,
  client-credentials grant. Client ID is public (in `scripts/create-products.mjs`);
  Secret lives in macOS Keychain item `lf-shopify-client-secret`.
  Rotate: Dev Dashboard → app → Settings → Credentials → Rotate, then
  `security add-generic-password -U -a lf -s lf-shopify-client-secret -w` (silent prompt).
  Scope changes: new version → Release → re-approve install on the store.

## Known constraints

- Metafield namespace is `lfc` (Shopify requires ≥3 chars).
- Product images map to variants by alt text: `"<Garment> — <Title>"` — keep the
  convention when uploading new media.
- Skeleton's `.shopify-section` page grid is disabled in `lf-tokens.css`
  (`display:block`) — don't remove that override.
- The teaser (`password.liquid` + `lf-teaser.liquid`) must stay Barba-free and
  is the only publicly visible surface until drop day.
```

- [ ] **Step 3: Commit**

```bash
git add README.md RUNBOOK.md && git commit -m "Add README and operations runbook"
```

### Task 10: Verification + ship

**Files:** none (verification + deploy)

- [ ] **Step 1: Push to the development theme + start dev server** (user runs `shopify theme dev` interactively if the store password prompt appears):

```bash
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
```

- [ ] **Step 2: Behind-the-gate checklist (user + agent, on the dev preview):**

1. Surge transition home↔shop↔PDP↔story, both directions; first nav full-length, later navs visibly quicker.
2. Cart drawer opens after add-to-cart mid-swap-session; header count survives navigation; quantity +/− works; kill network in devtools → drawer shows the retry line instead of dying.
3. Ignite fires on featured h2s, collection h1, PDP h1, story h1 — once each, staggered, capped.
4. Hover: single stutter then steady glow on buttons and nav links.
5. Footer: crest trails cursor (desktop); absent on touch.
6. Hero: horizontal swipe/drag advances slides; vertical scroll over the hero scrolls the page; buttons + autoplay still work.
7. 375px pass on every template.
8. Reduce Motion ON, fresh tab: instant page swaps, everything statically lit, no follow, no buzz, site fully usable.
9. Teaser regression on `/password`: flicker-once, signup, Members entry — unchanged.

- [ ] **Step 3: Lighthouse gates**

```bash
npx --yes lighthouse http://127.0.0.1:9292/ --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless" --only-categories=performance,accessibility --output=json --output-path=/tmp/lh-b2-home.json 2>/dev/null
npx --yes lighthouse http://127.0.0.1:9292/products/maria --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless" --only-categories=performance,accessibility --output=json --output-path=/tmp/lh-b2-pdp.json 2>/dev/null
python3 -c "
import json
for n,p in [('home','/tmp/lh-b2-home.json'),('pdp','/tmp/lh-b2-pdp.json')]:
    r=json.load(open(p))['categories']; print(n, round(r['performance']['score']*100), round(r['accessibility']['score']*100))"
```

Expected: ≥85 / ≥90 both pages. If perf fails: apply the spec §4 fallback ladder in order — (1) swap the five vendor `<script defer>` tags for a post-`load` injector snippet, re-measure; (2) drop Observer.min.js + the gesture block, re-measure. Document whichever rung shipped.

- [ ] **Step 4: Fix findings, commit** (`git add -A && git commit -m "Phase B2 review fixes"` — skip if clean).

- [ ] **Step 5: Ship**

```bash
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
curl -sL "https://laissezfaireleisureclub.com/" | grep -o "lf-teaser" | head -1   # teaser still gating
git checkout master && git merge --no-ff feat/phase-b2 -m "Ship Phase B2: signature motion layer" && git tag v0.3.0-motion
git push origin master --tags
```

Expected: teaser still prints; CI green on GitHub; tag `v0.3.0-motion` exists.

---

## Not in this plan

Drop-day operator actions (payments, password flip, Klaviyo campaign — see RUNBOOK.md). Real product photography. Any new pages/sections.

## Self-review notes

- **Spec coverage:** surge w/ exact timings + repeat-trim + checkout bypass ✓ (T3), stutter hover CSS ✓ (T4), letter ignite w/ 55ms stagger + 0.9s cap + once-per-view + script-font exemption (no `data-lf-ignite` on script elements) ✓ (T4/5/6), crest follow pointer-fine ✓ (T5/6), horizontal-only gestures ✓ (T5), registry architecture + persistent header/footer/drawer ✓ (T2/3/5), reduced-motion switchboard ✓ (T3/4/5), perf gates + fallback ladder ✓ (T10), all seven backlog rows ✓ (T5 P3-003, T7 P2-001/002+P3-001, T8 P3-004, T9 P2-004/005), teaser isolation ✓ (every task + T10 regression).
- **Placeholders:** none; all file contents complete.
- **Consistency:** `LF.money`/`LF.esc` defined in T5, consumed in T5 (pdp) and T7 (drawer); script order in T2 loads `lf-sections.js` before `lf-motion.js` (registration before dispatch) and drawer JS runs at DOMContentLoaded-equivalent after both (deferred order); variants island cents contract matches `LF.money(v.price)`; `data-lf-bound` guards make every init idempotent across Barba dispatches; blackout id `lf-blackout` matches T2 markup, T3 JS, T4 CSS; `.lf-follow-crest` matches T4 CSS, T5 init, T6 element; ignite selector `[data-lf-ignite]` matches T4 CSS + T5 init + T6 attributes.
