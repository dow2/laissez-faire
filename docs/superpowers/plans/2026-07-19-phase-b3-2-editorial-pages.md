# Phase B3.2 — Editorial Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Home, Story, and Contact to full Odd Ritual structural parity per spec §4/B3.2 — hero slider v2, statement band, CTA row, draggable marquee, lookbook, community section (Home); reading-hover hero, editorial parallax band, flickthrough, sticky story stack, floating crests (Story); split-screen sticky layout (Contact) — shipping `v0.4.1-editorial`.

**Architecture:** New page-section Liquid files composed via `templates/index.json` (Home) and new/modified `templates/page.story.json` / `templates/page.contact.json`. All interactive behavior lives in `theme/assets/lf-sections.js` (page-section registry, matching B1/B2 convention) using `LF.init.*` + `data-lf-bound` + `LF.teardown`, dispatched by the existing `lf-motion.js` registry. No new vendors — `gsap.utils.wrap`/`gsap.utils.unitize` (already in vendored `gsap.min.js` core) replace the Observer-plugin drag pattern with native Pointer Events, per the spec's engineering constraints. Retired sections (`lf-hero-slider`, `lf-featured-story`, `lf-drop-grid`, `lf-culture-strip`) drop out of `index.json`'s render order but stay in the repo (dead-but-harmless, matching B3.1's retirement precedent).

**Tech Stack:** Shopify OS 2.0 Liquid, GSAP 3.13.0 core + ScrollTrigger + CustomEase (all already vendored from B2/B3.1), vanilla JS. Spec: `docs/superpowers/specs/2026-07-19-phase-b3-ritual-build-design.md`. Builds on B3.1 (`v0.4.0-chrome`, shipped) — `LF.scrollLock`, `LF.trapFocus`, `LF.init.navBehaviors` (consumes `[data-nav-light]` markers — moot for this plan, see self-review note: every B3.2 section stays on the night-black background, so nothing here is ever "light" enough to trigger it), `LF.init.footerFollow`, cursor/easter systems all live in `theme/assets/lf-chrome.js` and need no changes here.

**Current state this plan changes:** `templates/index.json` renders `lf-hero-slider` → `lf-featured-story` → `lf-drop-grid` → `lf-culture-strip` → `lf-email-block`. `templates/page.story.json` renders one monolithic `lf-story` section (hero + manifesto + pillars + content + seal). No `templates/page.contact.json` exists — the live Contact page (confirmed to exist via a 200 response, empty content) falls back to the generic `templates/page.json` → `sections/page.liquid`, which only prints `<h1>{{ page.title }}</h1>{{ page.content }}` — explaining the "nothing on the contact page" report. `theme/layout/theme.liquid` renders `{% sections 'footer-group' %}` unconditionally for every template.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `theme/sections/lf-hero-slider-v2.liquid` | Create | Home hero: numbered nav, Scroll indicator, Next button, directional clip wipes |
| `theme/sections/lf-statement.liquid` | Create | Dark brand-statement band |
| `theme/sections/lf-cta-row.liquid` | Create | 3-card CTA row w/ cursor-following pill |
| `theme/sections/lf-marquee.liquid` | Create | Made-in-NOLA block + draggable infinite product row |
| `theme/sections/lf-lookbook.liquid` | Create | Second full-bleed editorial slider |
| `theme/sections/lf-community.liquid` | Create | Giving-back intro + 4 filler NOLA partner rows |
| `theme/templates/index.json` | Modify | Home section order → new sections |
| `theme/sections/lf-story-hero.liquid` | Create | Story hero, reading-mode hover |
| `theme/sections/lf-story-editorial.liquid` | Create | Image band + offset parallax images + flickthrough |
| `theme/sections/lf-story-sticky.liquid` | Create | Vision eyebrow + 5-panel sticky stack + floating crest SVGs |
| `theme/templates/page.story.json` | Modify | Story section order → new sections + full-height footer |
| `theme/sections/lf-contact-split.liquid` | Create | Split-screen sticky contact layout w/ inline mini-footer |
| `theme/templates/page.contact.json` | Create | Contact template (new alternate template) |
| `theme/layout/theme.liquid` | Modify | Suppress global footer-group for `story`/`contact` template suffixes |
| `theme/assets/lf-sections.js` | Modify | `LF.init.heroV2`, `.ctaFollow`, `.marquee`, `.lookbook`, `.community`, `.storyHero`, `.flickthrough`, `.stickyStack`, `.floatingCrests`, `.scrollOverlap` |
| `theme/assets/lf-tokens.css` | Modify | Shared styles: overlap-scroll utility, reading-hover, flickthrough, sticky-stack, split-contact |

---

### Task 1: Home — Hero slider v2

**Files:**
- Create: `theme/sections/lf-hero-slider-v2.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.heroV2`)

- [ ] **Step 1: Create `theme/sections/lf-hero-slider-v2.liquid`:**

```liquid
<section class="lf-heroV2" data-lf-hero-v2 data-state="idle" data-autoplay="{{ section.settings.autoplay_seconds }}">
  <div class="lf-heroV2__list" data-lf-hero-list>
    {% for block in section.blocks %}
      <div class="lf-heroV2__slide {% if forloop.first %}is-active{% endif %}" {{ block.shopify_attributes }} data-lf-hero-slide data-index="{{ forloop.index0 }}">
        <div class="lf-heroV2__visual" data-lf-hero-visual>
          {% if block.settings.video != blank %}
            <video class="lf-heroV2__img" src="{{ block.settings.video }}" autoplay muted loop playsinline></video>
          {% elsif block.settings.image != blank %}
            {% liquid
              assign lf_hero_v2_loading = 'lazy'
              assign lf_hero_v2_priority = 'auto'
              if forloop.first
                assign lf_hero_v2_loading = 'eager'
                assign lf_hero_v2_priority = 'high'
              endif
            %}
            {{ block.settings.image | image_url: width: 2400 | image_tag: class: 'lf-heroV2__img', loading: lf_hero_v2_loading, fetchpriority: lf_hero_v2_priority, alt: block.settings.heading }}
          {% endif %}
        </div>
        <div class="lf-heroV2__shade"></div>
        <div class="lf-heroV2__copy">
          {% if block.settings.kicker != blank %}<p class="lf-heroV2__kicker">{{ block.settings.kicker }}</p>{% endif %}
          {% if block.settings.heading != blank %}<h2 class="lf-heroV2__heading lf-display lf-glow-text" data-lf-ignite>{{ block.settings.heading }}</h2>{% endif %}
          {% if block.settings.link != blank %}<a class="lf-heroV2__cta lf-display" href="{{ block.settings.link }}" data-cursor="{{ block.settings.cta_label | default: 'Shop' | escape }}">{{ block.settings.cta_label | default: 'Shop' }}</a>{% endif %}
        </div>
      </div>
    {% endfor %}
  </div>

  <nav class="lf-heroV2__nav" aria-label="Hero slides">
    <ol class="lf-heroV2__navlist" data-lf-hero-navlist>
      {% for block in section.blocks %}
        <li class="lf-heroV2__navitem {% if forloop.first %}is-active{% endif %}" data-lf-hero-dot data-index="{{ forloop.index0 }}">
          <button type="button" aria-label="Go to slide {{ forloop.index }}">{{ forloop.index | prepend: '0' | slice: -2, 2 }}</button>
        </li>
      {% endfor %}
    </ol>
  </nav>
  <p class="lf-heroV2__scroll" aria-hidden="true">Scroll</p>
  <button type="button" class="lf-heroV2__next" data-lf-hero-next aria-label="Next slide">Next</button>
</section>

{% stylesheet %}
.lf-heroV2 { position: relative; height: 100svh; overflow: hidden; color: var(--lf-body-text); }
.lf-heroV2__list, .lf-heroV2__slide, .lf-heroV2__visual { position: absolute; inset: 0; }
.lf-heroV2__slide { visibility: hidden; clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%); }
.lf-heroV2__slide.is-active { visibility: visible; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }
.lf-heroV2__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-heroV2__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(13,13,17,.55) 0%, rgba(13,13,17,.2) 45%, rgba(13,13,17,.85) 100%); }
.lf-heroV2__copy { position: absolute; left: 1.5rem; bottom: 7.25rem; max-width: 34ch; z-index: 2; }
.lf-heroV2__kicker { font-size: .7rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); margin: 0 0 .6rem; }
.lf-heroV2__heading { font-size: clamp(1.8rem, 6vw, 3.6rem); line-height: 1.05; margin: 0 0 1.2rem; }
.lf-heroV2__cta { color: var(--lf-body-text); text-decoration: none; letter-spacing: .18em; text-transform: uppercase; font-size: .8rem; border-bottom: 1px solid currentColor; padding-bottom: .2rem; }
.lf-heroV2__nav { position: absolute; right: 1.5rem; bottom: 2.2rem; z-index: 2; }
.lf-heroV2__navlist { list-style: none; display: flex; gap: .6rem; margin: 0; padding: 0; }
.lf-heroV2__navitem button {
  background: none; border: 1px solid rgba(255,255,255,.3); color: var(--lf-muted);
  font-size: .68rem; letter-spacing: .1em; padding: .35rem .6rem; cursor: pointer;
  transition: all .3s var(--lf-ease);
}
.lf-heroV2__navitem.is-active button { color: var(--lf-neon-core); border-color: var(--lf-neon-halo); text-shadow: 0 0 6px var(--lf-neon-halo); }
.lf-heroV2__navlist:hover .lf-heroV2__navitem:not(.is-active) button { opacity: .5; }
.lf-heroV2__scroll {
  position: absolute; left: 1.5rem; bottom: 2.2rem; z-index: 2; margin: 0;
  font-size: .66rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted);
  writing-mode: vertical-lr;
}
.lf-heroV2__next {
  position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%); z-index: 2;
  background: none; border: 0; cursor: pointer; color: var(--lf-body-text);
  font-size: .74rem; letter-spacing: .22em; text-transform: uppercase;
}
/* No CSS transition to disable here — slide motion is entirely GSAP-driven
   inline clip-path tweening (see LF.init.heroV2's `ctx.reduced` branch in
   lf-sections.js, which is the actual reduced-motion guard). */
@media (max-width: 749px) {
  .lf-heroV2__nav, .lf-heroV2__scroll { display: none; }
  .lf-heroV2__copy { bottom: 3.5rem; left: 1.1rem; right: 1.1rem; max-width: none; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Hero v2",
  "settings": [
    { "type": "range", "id": "autoplay_seconds", "label": "Autoplay seconds (0 = off)", "min": 0, "max": 15, "default": 6 }
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Slide",
      "settings": [
        { "type": "text", "id": "kicker", "label": "Kicker" },
        { "type": "text", "id": "heading", "label": "Heading" },
        { "type": "text", "id": "cta_label", "label": "CTA label" },
        { "type": "url", "id": "link", "label": "Link" },
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "video_url", "id": "video", "label": "Video (optional, overrides image)", "accept": ["youtube", "vimeo"] }
      ]
    }
  ],
  "max_blocks": 4
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.heroV2` to `theme/assets/lf-sections.js`** (before the file's closing `})();`):

```js
  // ——— Home hero v2: numbered nav, directional clip wipes, swipe ———
  LF.init.heroV2 = function (root, ctx) {
    var hero = (root || document).querySelector('[data-lf-hero-v2]');
    if (!hero || hero.hasAttribute('data-lf-bound')) return;
    hero.setAttribute('data-lf-bound', '1');
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-lf-hero-dot]'));
    var n = slides.length;
    if (n < 2) return;
    var i = 0, timer = null;
    var secs = parseInt(hero.getAttribute('data-autoplay'), 10) || 0;

    function go(nextIndex, forwards) {
      if (hero.getAttribute('data-state') === 'animating') return;
      var nextI = (nextIndex + n) % n;
      if (nextI === i) return;
      var prevSlide = slides[i], nextSlide = slides[nextI];
      var prevVisual = prevSlide.querySelector('[data-lf-hero-visual]');
      var nextVisual = nextSlide.querySelector('[data-lf-hero-visual]');
      dots[i].classList.remove('is-active');
      dots[nextI].classList.add('is-active');
      i = nextI;
      if (ctx.reduced || !window.gsap) {
        prevSlide.classList.remove('is-active');
        nextSlide.classList.add('is-active');
        return;
      }
      var openPoly = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
      var closedTop = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
      var closedBottom = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
      nextSlide.classList.add('is-active');
      hero.setAttribute('data-state', 'animating');
      var tl = gsap.timeline({
        defaults: { duration: 1, ease: 'lf-ease-3' },
        onComplete: function () { prevSlide.classList.remove('is-active'); hero.setAttribute('data-state', 'idle'); }
      });
      if (forwards) {
        gsap.set(nextSlide, { clipPath: closedTop });
        tl.to(nextSlide, { clipPath: openPoly })
          .to(prevSlide, { clipPath: closedBottom }, '<')
          .fromTo(prevVisual, { yPercent: 0 }, { yPercent: 10 }, '<')
          .fromTo(nextVisual, { yPercent: -10 }, { yPercent: 0 }, '<');
      } else {
        gsap.set(nextSlide, { clipPath: closedBottom });
        tl.to(nextSlide, { clipPath: openPoly })
          .to(prevSlide, { clipPath: closedTop }, '<')
          .fromTo(prevVisual, { yPercent: 0 }, { yPercent: -10 }, '<')
          .fromTo(nextVisual, { yPercent: 10 }, { yPercent: 0 }, '<');
      }
    }
    function arm() {
      if (secs > 0 && !ctx.reduced && n > 1) { clearInterval(timer); timer = setInterval(function () { go(i + 1, true); }, secs * 1000); }
    }
    var nextBtn = hero.querySelector('[data-lf-hero-next]');
    if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1, true); arm(); });
    dots.forEach(function (dot) {
      dot.querySelector('button').addEventListener('click', function () {
        var target = parseInt(dot.getAttribute('data-index'), 10);
        go(target, target > i);
        arm();
      });
    });
    // Mobile swipe via native Pointer Events (no Observer plugin per spec constraint).
    var list = hero.querySelector('[data-lf-hero-list]');
    var downX = null, activePointerId = null;
    list.addEventListener('pointerdown', function (e) {
      if (activePointerId != null) return; // ignore a second concurrent pointer
      activePointerId = e.pointerId;
      downX = e.clientX;
    });
    function endSwipe(e, shouldNavigate) {
      if (e.pointerId !== activePointerId) return;
      var dx = shouldNavigate ? e.clientX - downX : 0;
      activePointerId = null;
      downX = null;
      if (!shouldNavigate || Math.abs(dx) < 40) return;
      go(i + (dx < 0 ? 1 : -1), dx < 0);
      arm();
    }
    list.addEventListener('pointerup', function (e) { endSwipe(e, true); });
    list.addEventListener('pointercancel', function (e) { endSwipe(e, false); });
    arm();
    LF.teardown.push(function () { clearInterval(timer); });
  };
```

> **As-run:** the original code used inline ternary syntax (`loading: forloop.first ? 'eager' : 'lazy'`) inside the `image_tag` filter's arguments — Shopify's Liquid dialect doesn't support `? :` expressions there at all. `shopify theme check` (static linter) didn't catch it; only the live dev-server Liquid parser did, with a hard 500 ("Failed to Upload Theme Files", `Expected end_of_string but found question`). Fixed (already applied above) by computing `lf_hero_v2_loading`/`lf_hero_v2_priority` via a `{% liquid %}` if/assign block ahead of the tag, then referencing the plain variables — same eager/high-priority-on-first-slide behavior, valid syntax. Verified live: forward/backward clip-wipe transitions, swipe, and the reduced-motion fallback all settle to their correct end states with no stuck/incomplete animations.

> **As-run (round 2):** code review found a real Critical bug — `go()` had no re-entrancy guard, so a rapid second nav-dot click during an in-flight ~1s transition reassigned `i` before the first GSAP timeline resolved, letting two overlapping timelines both end up controlling the same slide's `clip-path` (timeline-nested `tl.to()` calls don't auto-overwrite each other the way top-level `gsap.to()` does) and risking a slide left permanently hidden. Fixed with the same `data-state` gate pattern already proven in `LF.init.menu` (`idle`/`animating`, checked at the top of `go()`, cleared in the timeline's `onComplete`) — live-verified with an actual rapid-double-click sequence settling cleanly. Two Important fixes rode along in the same pass: the swipe handler now tracks `activePointerId` (ignoring a second concurrent pointer) and handles `pointercancel`, and the dead `@media (prefers-reduced-motion: reduce) { .lf-heroV2__slide { transition: none; } }` CSS rule (there's no CSS `transition` on that class to disable — motion is entirely GSAP-driven) was replaced with a comment pointing at the real guard in JS. All three fixes are already reflected in the code above.

> **As-run (round 3):** Task 3's code review caught the same unescaped-`data-cursor`-attribute pattern in `lf-cta-row.liquid`; the identical fix was backported here (`| escape` added to the CTA link's `data-cursor` value) since this section has the exact same construct — already reflected in the code above.

- [ ] **Step 3: Theme check** — `shopify theme check --path theme 2>&1 | tail -5`. This section isn't referenced by any template yet (Task 7 wires `index.json`), so expect an `UnusedAssign`/no offense change beyond the existing baseline (no `OrphanedSnippet`-equivalent rule fires for sections).

- [ ] **Step 4: Commit**

```bash
git add theme/sections/lf-hero-slider-v2.liquid theme/assets/lf-sections.js
git commit -m "feat(b3.2): home hero slider v2 — numbered nav, clip-wipe transitions, swipe"
git status --short
```

**As-run notes (found during Task 12 user visual pass, fixed in `4d43f27`/`8b37510`/`4f9dced`):**
- **Duplicate logo overlap:** the original Step 1 markup included a `.lf-heroV2__lockup` wordmark at `left:1.5rem;top:1.5rem`, which visually overlapped the persistent site header's own crest icon (`lf-header.liquid`, `position:fixed`, always rendered top-left on every page) — nothing hides the header over the hero. Removed the lockup markup and its CSS entirely; the code above reflects this. The header's own logo is sufficient.
- **CTA/scroll indicator collision:** `.lf-heroV2__copy`'s `bottom` was `6rem`, leaving only ~3px clearance (a true overlap at every tested viewport) against `.lf-heroV2__scroll`'s `bottom: 2.2rem`. Bumped to `7.25rem`, giving ~17px clearance. Reflected above.
- **Mid-word heading breaks:** `LF.init.ignite` (defined once, shared across sections, not part of this task's own code block) used `new SplitText(el, { type: 'chars' })`, giving the browser no word-level grouping to wrap on — confirmed live that "Needle" fit its container width yet still split mid-word. Fixed by changing to `type: 'words, chars'`. This function lives outside Task 1's file scope; see wherever `LF.init.ignite` is defined in `theme/assets/lf-sections.js` for the corrected version.

---

### Task 2: Home — Statement band

**Files:**
- Create: `theme/sections/lf-statement.liquid`

- [ ] **Step 1: Create `theme/sections/lf-statement.liquid`:**

```liquid
<section class="lf-statement" data-lf-overlap>
  <div class="lf-statement__crest" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>
  <h2 class="lf-statement__text lf-display lf-glow-text" data-lf-ignite data-lf-reveal>{{ section.settings.statement }}</h2>
</section>

{% stylesheet %}
.lf-statement {
  min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 2rem; padding: 4rem 1.5rem; background: #08080b;
}
.lf-statement__crest {
  width: 72px; aspect-ratio: 300/320; background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 8px var(--lf-neon-halo)) drop-shadow(0 0 24px var(--lf-neon-halo));
  opacity: .8;
}
.lf-statement__text { font-size: clamp(1.4rem, 4.2vw, 2.6rem); line-height: 1.35; max-width: 22ch; margin: 0; }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Statement",
  "settings": [
    { "type": "textarea", "id": "statement", "label": "Statement", "default": "Born from a shared love of the city, rooted in a vision of authenticity and craft." }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Commit**

```bash
git add theme/sections/lf-statement.liquid
git commit -m "feat(b3.2): home statement band"
git status --short
```

> **As-run (site-wide directive, fixed in `6caeda2`):** the user explicitly directed that major editorial/visual "scene" sections fill exactly one viewport, with nothing from the next section visible until scrolling (confirmed scope via clarifying question: applies to hero/statement/story-hero/lookbook/story-editorial-images, NOT to CTA row/marquee/community/email/footer, which stay their compact size). `min-height: 70svh` → `100svh`; reflected above. Simple flex-centered text+crest, no crop/composition concerns. Verified: 900/900px @ 1440×900, 1080/1080px @ 1920×1080 (exact fill both sizes); `data-lf-overlap`'s scroll-stitch pin effect confirmed unaffected (height-independent).

---

### Task 3: Home — CTA row

**Files:**
- Create: `theme/sections/lf-cta-row.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.ctaFollow`)

- [ ] **Step 1: Create `theme/sections/lf-cta-row.liquid`:**

```liquid
<section class="lf-ctarow" data-lf-overlap style="--lf-ctarow-cols: {{ section.blocks.size | at_least: 1 }};">
  {% for block in section.blocks %}
    <a class="lf-ctarow__card" href="{{ block.settings.link }}" {{ block.shopify_attributes }} data-cursor="{{ block.settings.cta_label | default: 'View' | escape }}">
      {% if block.settings.image != blank %}
        {{ block.settings.image | image_url: width: 900 | image_tag: loading: 'lazy', class: 'lf-ctarow__img', alt: '' }}
      {% endif %}
      <div class="lf-ctarow__overlay"></div>
      <div class="lf-ctarow__copy">
        <p class="lf-ctarow__eyebrow">{% render 'lf-eyebrow', text: block.settings.eyebrow %}</p>
        <h3 class="lf-ctarow__title lf-display">{{ block.settings.title }}</h3>
      </div>
    </a>
  {% endfor %}
</section>

{% stylesheet %}
.lf-ctarow { display: grid; grid-template-columns: repeat(var(--lf-ctarow-cols, 3), 1fr); }
.lf-ctarow__card { position: relative; display: block; aspect-ratio: 4/3; text-decoration: none; overflow: hidden; }
.lf-ctarow__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--lf-ease); }
.lf-ctarow__card:hover .lf-ctarow__img { transform: scale(1.04); }
.lf-ctarow__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(13,13,17,.1) 0%, rgba(13,13,17,.75) 100%); }
.lf-ctarow__copy { position: absolute; left: 1.4rem; bottom: 1.6rem; right: 1.4rem; }
.lf-ctarow__eyebrow { margin: 0 0 .4rem; }
.lf-ctarow__title { color: var(--lf-body-text); font-size: 1.1rem; margin: 0; }
@media (max-width: 749px) { .lf-ctarow { grid-template-columns: 1fr; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF CTA Row",
  "blocks": [
    {
      "type": "card",
      "name": "Card",
      "settings": [
        { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "our products" },
        { "type": "text", "id": "title", "label": "Title", "default": "Shop now" },
        { "type": "text", "id": "cta_label", "label": "Cursor label", "default": "View" },
        { "type": "url", "id": "link", "label": "Link" },
        { "type": "image_picker", "id": "image", "label": "Image" }
      ]
    }
  ],
  "max_blocks": 3,
  "default": {
    "blocks": [
      { "type": "card", "settings": { "eyebrow": "our products", "title": "Shop now" } },
      { "type": "card", "settings": { "eyebrow": "our story", "title": "Read more" } },
      { "type": "card", "settings": { "eyebrow": "our community", "title": "Community" } }
    ]
  }
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.ctaFollow` to `theme/assets/lf-sections.js`:**

```js
  // ——— CTA row: cursor-following label pill per card (desktop only) ———
  LF.init.ctaFollow = function (root, ctx) {
    var row = (root || document).querySelector('.lf-ctarow');
    if (!row || row.hasAttribute('data-lf-bound')) return;
    row.setAttribute('data-lf-bound', '1');
    // Cursor labels themselves are handled globally by LF.init.cursor (lf-chrome.js)
    // via [data-cursor] — nothing further needed here beyond marking bound so
    // this init is idempotent; kept as its own function for clarity/future growth.
  };
```

> **As-run:** code review found three Important issues, all already reflected in the code above: (1) `data-cursor="{{ block.settings.cta_label | default: 'View' }}"` was unescaped in an HTML attribute — a merchant label containing `"` would break the tag; added `| escape`, matching the codebase's established convention (`lf-product.liquid`'s `data-alt`, `meta-tags.liquid`'s `content` attributes). (2) The grid was a fixed `repeat(3, 1fr)` with no degrade path for the 1-2 block case `max_blocks: 3` explicitly permits — fixed via a `--lf-ctarow-cols` custom property driven by `section.blocks.size`. (3) Each card's accessible name was duplicated (image `alt` repeated the same text as the adjacent visible `<h3>`) — changed the image to `alt: ''` since it's purely decorative next to a real heading.
> **As-run (found in the user's post-fix visual pass, fixed in `9990561`):** `aspect-ratio: 3/4` (portrait) combined with `object-fit: cover` on the seeded 2000×2000 square filler images produced cards measuring ~71-79% of viewport height at common desktop sizes — confirmed live via `getBoundingClientRect()` at 1440×900 (640px card height) and 1920×1080 (854px). The section visually dominated the screen and read as broken/oversized rather than a clean editorial row. Changed to `aspect-ratio: 4/3` (landscape) — no `object-position` tuning needed since the source photos are full-bleed subject shots that frame well at default center-center. Re-verified: 1440×900 dropped to 360px (0.40 of viewport), 1920×1080 to 480px (0.44), mobile stacked height dropped from ~1560px to ~877px.

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-cta-row.liquid theme/assets/lf-sections.js
git commit -m "feat(b3.2): home CTA row with cursor-labeled cards"
git status --short
```

---

### Task 4: Home — Made-in-NOLA block + draggable marquee

**Files:**
- Create: `theme/sections/lf-marquee.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.marquee`)

- [ ] **Step 1: Create `theme/sections/lf-marquee.liquid`:**

```liquid
<section class="lf-marquee-section">
  <div class="lf-marquee-section__statement" data-lf-reveal>
    <p class="lf-marquee-section__stamp">{% render 'lf-stamp' %} — Designed and made locally</p>
    <p class="lf-marquee-section__body">{{ section.settings.statement }}</p>
    <p class="lf-marquee-section__place">New Orleans, Louisiana</p>
  </div>
  <div class="lf-marquee" data-lf-marquee>
    <div class="lf-marquee__track" data-lf-marquee-track>
      {% assign products = collections.all.products %}
      {% for product in products limit: 12 %}
        <a class="lf-marquee__card" href="{{ product.url }}">
          {{ product.featured_image | image_url: width: 500 | image_tag: loading: 'lazy', alt: product.title, class: 'lf-marquee__img' }}
          <span class="lf-marquee__name">{{ product.title }}</span>
          <span class="lf-marquee__price">{{ product.price_min | money }}</span>
        </a>
      {% endfor %}
      {% for product in products limit: 12 %}
        <a class="lf-marquee__card" href="{{ product.url }}" aria-hidden="true" tabindex="-1">
          {{ product.featured_image | image_url: width: 500 | image_tag: loading: 'lazy', alt: '', class: 'lf-marquee__img' }}
          <span class="lf-marquee__name">{{ product.title }}</span>
          <span class="lf-marquee__price">{{ product.price_min | money }}</span>
        </a>
      {% endfor %}
    </div>
  </div>
</section>

{% stylesheet %}
.lf-marquee-section { padding: 4rem 0; overflow: hidden; }
.lf-marquee-section__statement { max-width: 640px; margin: 0 auto 3rem; padding: 0 1.5rem; text-align: center; }
.lf-marquee-section__stamp { color: var(--lf-neon-core); font-size: .7rem; letter-spacing: .22em; text-transform: uppercase; margin: 0 0 1rem; }
.lf-marquee-section__body { font-size: 1.05rem; line-height: 1.7; color: var(--lf-body-text); margin: 0 0 .6rem; }
.lf-marquee-section__place { color: var(--lf-muted); font-size: .74rem; letter-spacing: .18em; text-transform: uppercase; margin: 0; }
.lf-marquee { cursor: grab; touch-action: pan-y; }
.lf-marquee.is-dragging { cursor: grabbing; }
.lf-marquee__track { display: flex; gap: 1.2rem; padding: 0 1.5rem; width: max-content; }
.lf-marquee__card { flex: 0 0 200px; text-decoration: none; color: var(--lf-body-text); user-select: none; }
.lf-marquee__img { width: 100%; aspect-ratio: 4/5; object-fit: cover; display: block; margin-bottom: .6rem; pointer-events: none; -webkit-user-drag: none; }
.lf-marquee__name { display: block; font-size: .78rem; letter-spacing: .05em; }
.lf-marquee__price { display: block; color: var(--lf-muted); font-size: .74rem; margin-top: .2rem; }
@media (prefers-reduced-motion: reduce) {
  .lf-marquee { cursor: default; }
  .lf-marquee__track { flex-wrap: wrap; width: auto; transform: none !important; overflow: visible; justify-content: center; }
  .lf-marquee__card[aria-hidden="true"] { display: none; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Marquee",
  "settings": [
    { "type": "textarea", "id": "statement", "label": "Statement", "default": "Our city is rich in culture, diversity, and heritage — producing locally is harder, but it's the only way this ever made sense to us." }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.marquee` to `theme/assets/lf-sections.js`:**

```js
  // ——— Draggable infinite product marquee (native Pointer Events, no Observer plugin) ———
  LF.init.marquee = function (root, ctx) {
    var wrap = (root || document).querySelector('[data-lf-marquee]');
    if (!wrap || wrap.hasAttribute('data-lf-bound')) return;
    wrap.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !window.gsap) return;
    var track = wrap.querySelector('[data-lf-marquee-track]');
    if (!track) return;
    var section = wrap.closest('.lf-marquee-section');
    // The transform-driven track has no native scroll position of its own,
    // but its overflow:hidden ancestor (which also wraps the unrelated
    // statement text as a sibling) is still a valid target for the browser's
    // native focus-scroll-into-view behavior on every Tab keystroke. Left
    // alone, that native scrollLeft adjustment fights the GSAP transform and
    // can visibly drift the statement text sideways. Snap it back to 0 so
    // the GSAP transform stays the only source of truth for position.
    if (section) {
      section.addEventListener('focusin', function () {
        if (section.scrollLeft !== 0) section.scrollLeft = 0;
      });
    }
    var half = track.scrollWidth / 2; // second half is the duplicated loop content
    var wrapFn = gsap.utils.wrap(-half, 0);
    var total = 0;
    var xTo = gsap.quickTo(track, 'x', {
      duration: .5, ease: 'power3',
      modifiers: { x: gsap.utils.unitize(wrapFn) }
    });
    var dragging = false, startX = 0, startTotal = 0, activePointer = null, lastDragDistance = 0;

    function onDown(e) {
      dragging = true; startX = e.clientX; startTotal = total; activePointer = e.pointerId;
      wrap.classList.add('is-dragging');
      // Capture on the actual event target, not `track` — capturing on an
      // ancestor disrupts the browser's native click-event synthesis for
      // the descendant that was really interacted with, suppressing
      // navigation on every click (drag or not), not just genuine drags.
      try { e.target.setPointerCapture(activePointer); } catch (err) {}
    }
    function onMove(e) {
      if (!dragging || e.pointerId !== activePointer) return;
      total = startTotal + (e.clientX - startX);
      xTo(total);
    }
    function onUp(e) {
      if (!dragging || e.pointerId !== activePointer) return;
      // Capture the drag distance BEFORE resetting `dragging` — the click
      // handler runs after pointerup in the same interaction, so checking
      // `dragging` there would always read the just-reset false value.
      lastDragDistance = Math.abs(total - startTotal);
      dragging = false;
      wrap.classList.remove('is-dragging');
      try { e.target.releasePointerCapture(activePointer); } catch (err) {}
      activePointer = null;
    }
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);
    track.addEventListener('click', function (e) {
      // A genuine drag (moved more than a few px) shouldn't navigate; a tap/
      // click that barely moved should behave like a normal link click.
      if (lastDragDistance > 6) e.preventDefault();
    });

    function tick(time, deltaTime) {
      if (!dragging) { total -= deltaTime / 20; xTo(total); }
    }
    gsap.ticker.add(tick);
    LF.teardown.push(function () { gsap.ticker.remove(tick); gsap.killTweensOf(track); });
  };
```

> **As-run:** the original `setPointerCapture`/`releasePointerCapture` calls targeted `track` (an ancestor of the actual pointerdown target) — proven via an isolated A/B test to suppress the browser's native click-event synthesis on EVERY card click, drag or not (a zero-movement tap failed to navigate with capture active, and navigated correctly with `setPointerCapture` neutered). Compounding this, the click handler's `if (dragging) e.preventDefault();` was dead code — `onUp` resets `dragging = false` synchronously, and the browser's `click` event always fires after `pointerup` for the same interaction, so the check could never read true. Fixed both together (already reflected in the code above): pointer capture now targets `e.target` (the actual interacted element, not `track`), and a `lastDragDistance` flag captured before the `dragging` reset drives the click-suppression check instead. Live-verified the specific regression: a genuine drag no longer navigates, and a zero-movement click now correctly navigates to the product page (previously it silently failed to, for every card, every time).
>
> **As-run (round 2):** code review found two more Important gaps, both fixed and live-verified (already reflected in the code above). (1) `gsap.quickTo`'s tween on `track` was never killed in teardown — only the ticker callback was removed, so an in-flight `.5s power3` tween can keep GSAP's root timeline referencing the (soon-to-be-discarded) `track` for up to half a second after a Barba nav; added `gsap.killTweensOf(track)` alongside the ticker removal. (2) Keyboard Tab-focus on an off-screen card triggered the browser's native scroll-into-view on `.lf-marquee-section` (the `overflow:hidden` ancestor, which also wraps the unrelated statement text as a sibling) — completely uncoordinated with the GSAP transform driving the track's actual position, so the two could visibly fight and drift the statement text sideways while tabbing through cards. Fixed with a `focusin` handler that snaps `section.scrollLeft` back to 0 immediately, keeping the GSAP transform as the sole source of truth for position. Verified live: the teardown-drain no longer leaves the tween animating, and 5 real Tab presses through the card list all confirmed `scrollLeft` stayed at 0.

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-marquee.liquid theme/assets/lf-sections.js
git commit -m "feat(b3.2): made-in-NOLA statement + draggable product marquee"
git status --short
```

---

### Task 5: Home — Lookbook slider

**Files:**
- Create: `theme/sections/lf-lookbook.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.lookbook`)

- [ ] **Step 1: Create `theme/sections/lf-lookbook.liquid`:**

```liquid
<section class="lf-lookbook" data-lf-lookbook>
  <div class="lf-lookbook__list" data-lf-lookbook-list>
    {% for block in section.blocks %}
      <div class="lf-lookbook__slide {% if forloop.first %}is-active{% endif %}" {{ block.shopify_attributes }}>
        {% if block.settings.image != blank %}
          {{ block.settings.image | image_url: width: 2400 | image_tag: loading: 'lazy', class: 'lf-lookbook__img', alt: block.settings.caption }}
        {% endif %}
      </div>
    {% endfor %}
  </div>
  <div class="lf-lookbook__ui">
    <span class="lf-lookbook__stamp">{% render 'lf-stamp' %}</span>
    <span class="lf-lookbook__count"><span data-lf-lookbook-current>01</span> / <span>{{ section.blocks.size | prepend: '0' | slice: -2, 2 }}</span></span>
    <button type="button" data-lf-lookbook-prev aria-label="Previous">&larr;</button>
    <button type="button" data-lf-lookbook-next aria-label="Next">&rarr;</button>
  </div>
</section>

{% stylesheet %}
.lf-lookbook { position: relative; height: 100svh; overflow: hidden; }
.lf-lookbook__list, .lf-lookbook__slide { position: absolute; inset: 0; }
.lf-lookbook__slide { opacity: 0; transition: opacity .6s var(--lf-ease); }
.lf-lookbook__slide.is-active { opacity: 1; }
.lf-lookbook__img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%; }
.lf-lookbook__ui {
  position: absolute; left: 1.5rem; right: 1.5rem; bottom: 1.5rem; z-index: 2;
  display: flex; align-items: center; gap: 1.4rem; color: var(--lf-body-text);
  font-size: .72rem; letter-spacing: .18em; text-transform: uppercase;
}
.lf-lookbook__count { flex: 1; }
.lf-lookbook__ui button { background: none; border: 1px solid rgba(255,255,255,.35); color: inherit; padding: .4rem .7rem; cursor: pointer; }
@media (prefers-reduced-motion: reduce) { .lf-lookbook__slide { transition: none; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Lookbook",
  "blocks": [
    { "type": "slide", "name": "Slide", "settings": [
      { "type": "image_picker", "id": "image", "label": "Image" },
      { "type": "text", "id": "caption", "label": "Caption (alt text)" }
    ] }
  ],
  "max_blocks": 6
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.lookbook` to `theme/assets/lf-sections.js`:**

```js
  // ——— Lookbook slider: simple crossfade + counter ———
  LF.init.lookbook = function (root, ctx) {
    var section = (root || document).querySelector('[data-lf-lookbook]');
    if (!section || section.hasAttribute('data-lf-bound')) return;
    section.setAttribute('data-lf-bound', '1');
    var slides = Array.prototype.slice.call(section.querySelectorAll('.lf-lookbook__slide'));
    var n = slides.length;
    if (n < 2) return;
    var i = 0;
    var counter = section.querySelector('[data-lf-lookbook-current]');
    function go(next) {
      slides[i].classList.remove('is-active');
      i = (next + n) % n;
      slides[i].classList.add('is-active');
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    }
    var prevBtn = section.querySelector('[data-lf-lookbook-prev]');
    var nextBtn = section.querySelector('[data-lf-lookbook-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1); });
  };
```

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-lookbook.liquid theme/assets/lf-sections.js
git commit -m "feat(b3.2): home lookbook slider"
git status --short
```

> **As-run (found in the user's third visual pass, fixed in `d3ec598`):** `height: 90svh` forced the section to 90% of viewport height at every tested size (810-1035px), and cover-cropping the square 2000×2000 filler images into that near-hero-scale landscape frame left only ~50-56% of the source image visible — same defect pattern as the CTA row's aspect-ratio bug (`9990561`), just via a different CSS property. Replaced `height: 90svh` with `aspect-ratio: 10/3` (a wide cinematic banner ratio, empirically tested against several candidates via live screenshots) and added `object-position: 50% 22%` to bias the crop upward so the headdress/sky context stays in frame rather than a symmetric center-crop cutting into the subject. Re-verified: 432-600px tall at tested viewports (48-53% of viewport, in the same "modest" range the CTA row fix landed in), `.lf-lookbook__ui`'s counter/arrows still clear the section's bottom edge by 24px, and prev/next crossfade nav confirmed still functional on both slides.
> **As-run (found in the user's fourth visual pass, fixed in `839fee6`):** `aspect-ratio: 10/3` read as too compact once seen in context alongside the seeded community section below it (see Task 7's As-run notes). Bumped to `aspect-ratio: 8/3`, landing around 60-67% of viewport height instead of 48-53% — more gallery presence while staying well short of the original 90svh bug.
> **As-run (site-wide directive, fixed in `c6faafc`):** the user then directed that all major editorial/visual sections fill exactly one viewport (see Task 2's As-run for the full directive). Reverted the sizing mechanism from `aspect-ratio: 8/3` back to viewport-native `height: 100svh` — the original crop-too-tight bug was never really about the height value itself, it was the missing `object-position` tuning, which is still in place (`object-position: 50% 22%` on `.lf-lookbook__img`, unchanged). Verified live at true 100vh with the existing tuning: both slides read well-composed (full headdress/subject visible), no further `object-position` adjustment needed. Measured 900/900px @ 1440×900, 1080/1080px @ 1920×1080 (exact fill); prev/next crossfade re-confirmed functional on both slides.

---

### Task 6: Home — Community section

**Files:**
- Create: `theme/sections/lf-community.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.community`)

- [ ] **Step 1: Create `theme/sections/lf-community.liquid`:**

```liquid
<section class="lf-community">
  <div class="lf-community__intro" data-lf-reveal>
    <h2 class="lf-community__title lf-display lf-glow-text" data-lf-ignite>{{ section.settings.title }}</h2>
    <p class="lf-community__body">{{ section.settings.body }}</p>
  </div>
  <div class="lf-community__list">
    {% for block in section.blocks %}
      <div class="lf-community__row" data-lf-reveal>
        <div class="lf-community__imgwrap">
          {% if block.settings.image != blank %}
            {{ block.settings.image | image_url: width: 700 | image_tag: loading: 'lazy', class: 'lf-community__img', alt: block.settings.name }}
          {% endif %}
        </div>
        <div class="lf-community__copy">
          <h3 class="lf-community__name lf-display">{{ block.settings.name }}</h3>
          <p class="lf-community__blurb">{{ block.settings.blurb }}</p>
          {% if block.settings.link != blank %}<a class="lf-community__link" href="{{ block.settings.link }}" target="_blank" rel="noopener" data-cursor="Visit">Visit website</a>{% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
</section>

{% stylesheet %}
.lf-community { padding: 5rem 1.5rem; max-width: 1000px; margin: 0 auto; }
.lf-community__intro { text-align: center; margin-bottom: 3.5rem; }
.lf-community__title { font-size: clamp(1.5rem, 4vw, 2.2rem); margin: 0 0 1rem; }
.lf-community__body { color: var(--lf-body-text); font-size: .95rem; line-height: 1.7; max-width: 60ch; margin: 0 auto; }
.lf-community__row { display: grid; grid-template-columns: 160px 1fr; gap: 1.6rem; align-items: center; padding: 1.6rem 0; border-top: 1px solid #1e1e26; }
.lf-community__imgwrap { aspect-ratio: 4/3; overflow: hidden; }
.lf-community__img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--lf-ease); }
.lf-community__row:hover .lf-community__img { transform: scale(1.05); }
.lf-community__name { font-size: 1rem; margin: 0 0 .5rem; }
.lf-community__blurb { color: var(--lf-muted); font-size: .84rem; line-height: 1.6; margin: 0 0 .6rem; }
.lf-community__link { color: var(--lf-neon-core); font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; text-decoration: none; }
@media (max-width: 649px) { .lf-community__row { grid-template-columns: 1fr; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Community",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "Giving back" },
    { "type": "textarea", "id": "body", "label": "Body", "default": "We never set out to be just a clothing brand. Laissez-Faire is as much about culture as it is about craft — our greater community." }
  ],
  "blocks": [
    { "type": "partner", "name": "Partner", "settings": [
      { "type": "image_picker", "id": "image", "label": "Image" },
      { "type": "text", "id": "name", "label": "Name" },
      { "type": "textarea", "id": "blurb", "label": "Blurb" },
      { "type": "url", "id": "link", "label": "Link" }
    ] }
  ],
  "max_blocks": 6,
  "default": {
    "blocks": [
      { "type": "partner", "settings": { "name": "NOLA Second Line Society", "blurb": "Keeping the tradition of the second line alive for the next generation of the city's brass bands and social clubs." } },
      { "type": "partner", "settings": { "name": "Crescent City Youth Arts", "blurb": "Free after-school music and craft programs for kids across the Ninth Ward and beyond." } },
      { "type": "partner", "settings": { "name": "Magnolia Relief Fund", "blurb": "Rebuilding and repair support for New Orleans families still recovering from storm damage." } },
      { "type": "partner", "settings": { "name": "The Running Late Club", "blurb": "A community of night-shift workers, musicians, and service industry lifers who know the city after dark." } }
    ]
  }
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.community` to `theme/assets/lf-sections.js`:**

```js
  // ——— Community section: reveal-on-scroll only (data-lf-reveal handles it), no extra JS needed ———
  LF.init.community = function (root, ctx) {
    var section = (root || document).querySelector('.lf-community');
    if (!section || section.hasAttribute('data-lf-bound')) return;
    section.setAttribute('data-lf-bound', '1');
  };
```

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-community.liquid theme/assets/lf-sections.js
git commit -m "feat(b3.2): home community section with filler NOLA partners"
git status --short
```

---

### Task 7: Home — wire `index.json`, overlap-scroll stitching, nav markers

**Files:**
- Modify: `theme/templates/index.json` (full replacement)
- Modify: `theme/assets/lf-sections.js` (append `LF.init.scrollOverlap`)
- Modify: `theme/assets/lf-tokens.css` (append overlap-scroll utility)

- [ ] **Step 1: Replace `theme/templates/index.json` entirely:**

```json
{
  "sections": {
    "hero": {
      "type": "lf-hero-slider-v2",
      "blocks": {
        "slide1": {
          "type": "slide",
          "settings": {
            "kicker": "Drop 001",
            "heading": "Won't Bow Down",
            "cta_label": "Shop the Drop",
            "link": "shopify://collections/all",
            "image": "shopify://shop_images/lf-hero-chief.jpg"
          }
        },
        "slide2": {
          "type": "slide",
          "settings": {
            "kicker": "Nouvelle-Orléans",
            "heading": "Kill 'Em Dead, Needle & Thread",
            "cta_label": "Our Story",
            "link": "shopify://pages/story",
            "image": "shopify://shop_images/lf-hero-secondline.jpg"
          }
        }
      },
      "block_order": ["slide1", "slide2"],
      "settings": { "autoplay_seconds": 6 }
    },
    "statement": { "type": "lf-statement", "settings": {} },
    "ctarow": {
      "type": "lf-cta-row",
      "blocks": {
        "card1": { "type": "card", "settings": { "eyebrow": "our products", "title": "Shop the Drop", "cta_label": "Shop", "link": "shopify://collections/all", "image": "shopify://shop_images/lf-hero-chief.jpg" } },
        "card2": { "type": "card", "settings": { "eyebrow": "our story", "title": "Read More", "cta_label": "Read", "link": "shopify://pages/story", "image": "shopify://shop_images/lf-hero-secondline.jpg" } },
        "card3": { "type": "card", "settings": { "eyebrow": "our community", "title": "Get in Touch", "cta_label": "Connect", "link": "shopify://pages/contact", "image": "shopify://shop_images/lf-hero-chief.jpg" } }
      },
      "block_order": ["card1", "card2", "card3"],
      "settings": {}
    },
    "marquee": { "type": "lf-marquee", "settings": {} },
    "lookbook": {
      "type": "lf-lookbook",
      "blocks": {
        "slide1": { "type": "slide", "settings": { "image": "shopify://shop_images/lf-hero-chief.jpg", "caption": "Won't Bow Down" } },
        "slide2": { "type": "slide", "settings": { "image": "shopify://shop_images/lf-hero-secondline.jpg", "caption": "Kill 'Em Dead, Needle & Thread" } }
      },
      "block_order": ["slide1", "slide2"],
      "settings": {}
    },
    "community": {
      "type": "lf-community",
      "blocks": {
        "partner1": { "type": "partner", "settings": { "name": "NOLA Second Line Society", "blurb": "Keeping the tradition of the second line alive for the next generation of the city's brass bands and social clubs.", "image": "shopify://shop_images/lf-hero-secondline.jpg" } },
        "partner2": { "type": "partner", "settings": { "name": "Crescent City Youth Arts", "blurb": "Free after-school music and craft programs for kids across the Ninth Ward and beyond.", "image": "shopify://shop_images/lf-hero-chief.jpg" } },
        "partner3": { "type": "partner", "settings": { "name": "Magnolia Relief Fund", "blurb": "Rebuilding and repair support for New Orleans families still recovering from storm damage.", "image": "shopify://shop_images/lf-hero-secondline.jpg" } },
        "partner4": { "type": "partner", "settings": { "name": "The Running Late Club", "blurb": "A community of night-shift workers, musicians, and service industry lifers who know the city after dark.", "image": "shopify://shop_images/lf-hero-chief.jpg" } }
      },
      "block_order": ["partner1", "partner2", "partner3", "partner4"],
      "settings": {}
    },
    "email": { "type": "lf-email-block", "settings": {} }
  },
  "order": ["hero", "statement", "ctarow", "marquee", "lookbook", "community", "email"]
}
```

Note: `lf-hero-slider`, `lf-featured-story`, `lf-drop-grid`, `lf-culture-strip` drop out of the render order here but their `.liquid` files stay in the repo (retirement policy from B3.1's precedent). `lf-email-block` is retained from B1 unmodified in structure; its copy was later corrected from pre-launch "Notify Me" teaser language to live-site newsletter framing — see the As-run note after Task 12's script for details (fix landed during final verification, not as part of this task).
> ~~`lf-cta-row`'s block-level `default` settings (Task 3) supply its 3 cards since `index.json` doesn't list blocks explicitly for it.~~ **Superseded** — see the As-run note below: `index.json` was later corrected to list explicit blocks after shipping with none.

- [ ] **Step 2: Append `LF.init.scrollOverlap` to `theme/assets/lf-sections.js`:**

```js
  // ——— Overlap-scroll stitching: pinned section slides under the next as you scroll past ———
  LF.init.scrollOverlap = function (root, ctx) {
    if (ctx.reduced || !window.gsap || !window.ScrollTrigger) return;
    (root || document).querySelectorAll('[data-lf-overlap]:not([data-lf-overlap-bound])').forEach(function (el) {
      el.setAttribute('data-lf-overlap-bound', '1');
      gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top top', end: '+=500', scrub: true }
      }).to(el, { yPercent: 50, ease: 'power1.in' });
    });
  };
```

> **As-run:** `data-lf-overlap` was already baked into `lf-statement.liquid` and `lf-cta-row.liquid` from Task 2/Task 3's own creation (an earlier revision of this plan added it there directly rather than deferring to this task) — there's nothing left to "add" here; both sections already carry the marker and CTA row's grid-column CSS variable. This step is a no-op, kept only as a record of the original intent.

- [ ] **Step 3: Append overlap-scroll utility to `theme/assets/lf-tokens.css`:**

```css
/* Overlap-scroll stitching (B3.2): pinned section slides down over 500px of
   scroll so the next section appears to scroll up over it. Positioning
   context only — the yPercent tween itself is applied by ScrollTrigger. */
[data-lf-overlap] { position: relative; z-index: 1; will-change: transform; }
```

- [ ] **Step 4: Push to dev, verify** — home page loads with all 6 new sections in order, hero clip-wipes between slides, marquee drags, lookbook arrows work, community rows reveal on scroll.

```bash
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
```

- [ ] **Step 5: Commit**

```bash
git add theme/templates/index.json theme/assets/lf-sections.js theme/assets/lf-tokens.css
git commit -m "feat(b3.2): wire home page to new sections, add overlap-scroll stitching"
git status --short
```

> **As-run (found in Task 12 verification, fixed in `de44c28`):** the original Step 1 code block wired `"lookbook": { "type": "lf-lookbook", "settings": {} }` with no `blocks`/`block_order`. `LF.init.lookbook` (Task 5) only binds its prev/next click handlers `if (n >= 2)` slides exist, so this rendered 0 slides and left the arrows silently dead — no console error, easy to miss in a quick visual check. The code block above is corrected to seed 2 `slide` blocks reusing the hero's already-uploaded shop images (`lf-hero-chief.jpg`/`lf-hero-secondline.jpg`), matching the field names in `lf-lookbook.liquid`'s schema (`image`, `caption`).
> **Process lesson:** any section that loops `{% for block in section.blocks %}` (block-driven — lookbook, hero, cta-row) needs sample content seeded in the *same* task that wires it into a template, and verification needs to check actual block/slide count, not just section presence. Sections driven by top-level `settings.*` id fields instead of blocks (story-sticky, contact-split, community) render their real structure even with blank settings, so they don't have this failure mode — the distinction matters when writing or reviewing future wiring tasks (e.g. B3.3).
> **As-run (found in the user's Task 12 visual pass, fixed in `3b678f3`):** the process lesson above correctly predicted `ctarow` was at risk, but the original Step 1 code block still shipped it with `"settings": {}` and no blocks anyway. With 0 blocks, `--lf-ctarow-cols` resolved to 1 and the for-loop rendered zero `.lf-ctarow__card` elements, collapsing the section to `height: 0` — confirmed live (`{top: 1530, height: 0}`, sitting directly on top of the marquee section beneath it). With no buffer section, the statement band's `data-lf-overlap` slide-down effect had nothing to slide over but the marquee's product cards immediately below, producing a visible glitchy overlap the user reported as "scroll is buggy" / images colliding with statement text. Seeded 3 card blocks reusing the two hero images, matching `lf-cta-row.liquid`'s schema field names (`eyebrow`, `title`, `cta_label`, `link`, `image`). The code block above is corrected. Re-verified by scrolling in 200px increments from y=900–2300: `ctarow` now measures ~640px real height and both overlap effects (statement→ctarow, ctarow→marquee) scrub cleanly with proper separation.
> **As-run (found in the user's second visual pass, fixed in `96291f4`):** `lf-email-block.liquid` (retained unmodified from B1, not part of this plan's own task files) still carried its original pre-launch teaser copy — prompt "Be there when the lights come on.", button "Notify Me", `contact[tags]=teaser-list`. That copy made sense when the site was gated behind the password teaser; it reads as contradictory on the fully-built, fully-browsable home page this plan ships (the user is already shopping products, reading the story, viewing PDPs — "notify me when we launch" doesn't fit). Changed to newsletter-signup framing: prompt "First word on new drops, restocks, and second-line events.", button "Join", tag `newsletter` — consistent with the footer's existing "Join the list" button copy (`lf-footer.liquid`, unchanged). No layout/structure changes, copy only.
> **As-run (found in the user's second visual pass, fixed in `9990561`):** `lf-cta-row.liquid`'s `.lf-ctarow__card` used `aspect-ratio: 3/4` (portrait), which combined with `object-fit: cover` on the seeded 2000×2000 square filler images produced cards measuring 71-79% of viewport height at common desktop sizes (confirmed live: 640px at 1440×900, 854px at 1920×1080) — the row visually dominated the screen rather than reading as a compact editorial grid. Changed to `aspect-ratio: 4/3` (landscape); reflected in Step 1's code block above. Re-verified: 360px at 1440×900 (0.40 of viewport), 480px at 1920×1080 (0.44), mobile stacked height dropped from ~1560px to ~877px. No `object-position` tuning was needed — the source photos are full-bleed subject shots that already frame well at default center-center.
> **Checked, not a bug:** the user also reported the standard footer (nav links, product rack, legal/copyright) appeared to be missing entirely on the home page after the email signup block. Live DOM/CSS inspection found `.lf-footer` renders fully and correctly — real height (663px), all nav links, 6 populated product-rack items, legal nav, and copyright line all present and visible, no clipping/hiding ancestors. No code change made; most likely explanation is the visual break at the email block's bottom border reading as a natural stopping point before scrolling further.
> **As-run (found in the user's fourth visual pass, fixed in `e8bf5c2`):** `community` was the fourth section to ship with `"settings": {}` and no blocks at all — same bug class as lookbook (`de44c28`), cta-row (`3b678f3`), and story editorial/sticky (`635282c`). Section instances in JSON templates don't inherit a schema's `"default.blocks"` preset (that preset is only applied when a merchant adds the section fresh via the theme editor), so all 4 partner rows rendered as zero. The intro ("Giving back...") was followed immediately by the section's own `padding: 5rem`/`margin-bottom: 3.5rem` and nothing else, then the email block's own top padding stacked on top — reading as an oversized empty gap between two text blocks, which is what the user reported (perceived as a spacing bug; actual cause was missing content, not excess padding). Seeded the same 4 partner names/blurbs already defined as `lf-community.liquid`'s own schema `default.blocks` preset, alternating the two already-uploaded hero images across the 4 rows. Code block above corrected; re-verified live (4 `.lf-community__row` elements render with real name/blurb/image content).

---

### Task 8: Story — hero rebuild with reading-mode hover

**Files:**
- Create: `theme/sections/lf-story-hero.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.storyHero`)
- Modify: `theme/assets/lf-tokens.css` (append reading-hover rule)

- [ ] **Step 1: Create `theme/sections/lf-story-hero.liquid`:**

```liquid
<header class="lf-storyhero">
  <div class="lf-storyhero__crest" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');" data-lf-fadeout></div>
  <div class="lf-storyhero__head">
    <div class="lf-storyhero__intro">
      <p class="lf-storyhero__kicker" data-lf-fadeout>Est. New Orleans</p>
      <p class="lf-storyhero__name lf-script">{{ section.settings.intro }}</p>
    </div>
    <h1 class="lf-storyhero__title lf-display lf-glow-text" data-lf-ignite>{{ page.title }}</h1>
  </div>
</header>

{% stylesheet %}
.lf-storyhero { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem; text-align: center; padding: 4rem 1.5rem; }
.lf-storyhero__crest {
  width: 56px; aspect-ratio: 300/320; background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 8px var(--lf-neon-halo)); transition: opacity .3s ease;
}
.lf-storyhero__head { position: relative; max-width: 700px; }
.lf-storyhero__kicker { font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; color: var(--lf-muted); margin: 0 0 .6rem; transition: opacity .3s ease; }
.lf-storyhero__name { font-size: 1.3rem; color: var(--lf-body-text); margin: 0; }
.lf-storyhero__title { font-size: clamp(2rem, 6vw, 3.4rem); margin: .8rem 0 0; transition: opacity .3s ease; }
/* Reading-mode hover: hovering the intro fades the headline + this section's
   [data-lf-fadeout] elements so the page "makes room" for reading — matches
   OR's about-head_wrap pattern. */
@media (hover: hover) and (pointer: fine) {
  .lf-storyhero__head:has(.lf-storyhero__intro:hover) .lf-storyhero__title { opacity: .12; }
  /* Scoped to the section, not body — [data-lf-fadeout] is a generic,
     reusable attribute name other Story-page sections may adopt later;
     a page-wide selector here would dim their unrelated elements too. */
  .lf-storyhero:has(.lf-storyhero__intro:hover) [data-lf-fadeout] { opacity: .12; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Story Hero",
  "settings": [
    { "type": "text", "id": "intro", "label": "Intro line", "default": "A modern expression of New Orleans" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.storyHero` to `theme/assets/lf-sections.js`** (a no-op bind — the hover effect is pure CSS `:has()`, degrading gracefully to no effect on browsers without `:has()` support since the rest of the page stays fully readable either way):

```js
  // ——— Story hero: reading-mode hover is pure CSS (:has()); nothing to bind ———
  LF.init.storyHero = function (root, ctx) {
    var hero = (root || document).querySelector('.lf-storyhero');
    if (!hero || hero.hasAttribute('data-lf-bound')) return;
    hero.setAttribute('data-lf-bound', '1');
  };
```

> **As-run:** code review found the `[data-lf-fadeout]` fade rule was scoped to `body`, matching ANY such element anywhere in the page's DOM — a real forward-looking risk given Tasks 9/10 land on this exact Story page next and are natural candidates to reuse the same generic attribute name. Rescoped to `.lf-storyhero:has(...)` (already reflected above). Also dropped three unused `data-lf-reading-*` attributes and one dead `transition` declaration that never had anything wired to them (already reflected above) — verified live: the hover effect still dims this section's own elements correctly, and a probe element with `[data-lf-fadeout]` placed outside `.lf-storyhero` is now correctly unaffected by the hover (previously it would have dimmed too).

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-story-hero.liquid theme/assets/lf-sections.js
git commit -m "feat(b3.2): story hero with CSS reading-mode hover"
git status --short
```

> **As-run (site-wide directive, fixed in `327bada`):** same full-viewport-scene directive as Task 2's statement band. `min-height: 80svh` → `100svh`; reflected above. This was the section directly responsible for the user's original screenshot showing the next section's images peeking in at the bottom of the viewport. Verified: 900/900px @ 1440×900, 1080/1080px @ 1920×1080 (exact fill), no next-section content visible in the fitted viewport.

---

### Task 9: Story — editorial band (parallax images + flickthrough)

**Files:**
- Create: `theme/sections/lf-story-editorial.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.imgScroll`, `LF.init.flickthrough`)
- Modify: `theme/assets/lf-chrome.js` (export `LF.FINE` — see as-run note below)

- [ ] **Step 1: Create `theme/sections/lf-story-editorial.liquid`:**

```liquid
<section class="lf-storyed">
  <div class="lf-storyed__band" data-lf-reveal>
    <p class="lf-storyed__eyebrow">{% render 'lf-eyebrow', text: section.settings.eyebrow %}</p>
  </div>
  <div class="lf-storyed__offset">
    <div class="lf-storyed__imgwrap lf-storyed__imgwrap--left" data-lf-img-scroll>
      {% if section.settings.image_left != blank %}
        {{ section.settings.image_left | image_url: width: 1400 | image_tag: loading: 'lazy', class: 'lf-storyed__img', alt: '' }}
      {% endif %}
    </div>
    <div class="lf-storyed__imgwrap lf-storyed__imgwrap--right" data-lf-img-scroll>
      {% if section.settings.image_right != blank %}
        {{ section.settings.image_right | image_url: width: 1400 | image_tag: loading: 'lazy', class: 'lf-storyed__img', alt: '' }}
      {% endif %}
    </div>
  </div>
  <p class="lf-storyed__copy" data-lf-reveal>{{ section.settings.copy }}</p>
  <div class="lf-flickthrough" data-lf-flickthrough>
    {% for i in (1..3) %}
      {% assign img_key = 'flick_image_' | append: i %}
      {% if section.settings[img_key] != blank %}
        <div class="lf-flickthrough__img {% if forloop.first %}is-shown{% endif %}">
          {{ section.settings[img_key] | image_url: width: 900 | image_tag: loading: 'lazy', alt: '' }}
        </div>
      {% endif %}
    {% endfor %}
  </div>
</section>

{% stylesheet %}
.lf-storyed { padding: 3rem 1.5rem 5rem; max-width: 1100px; margin: 0 auto; }
.lf-storyed__band { text-align: center; margin-bottom: 3rem; }
.lf-storyed__offset { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; min-height: 100svh; align-content: center; }
.lf-storyed__imgwrap { overflow: clip; }
.lf-storyed__imgwrap--left { aspect-ratio: 4.35/2.8; align-self: start; }
.lf-storyed__imgwrap--right { aspect-ratio: 4.35/6; align-self: end; }
.lf-storyed__img { width: 100%; height: 120%; object-fit: cover; display: block; }
.lf-storyed__copy { max-width: 60ch; margin: 0 auto 4rem; font-size: 1rem; line-height: 1.75; color: var(--lf-body-text); text-align: center; }
.lf-flickthrough { position: relative; aspect-ratio: 4/3; max-width: 420px; margin: 0 auto; overflow: hidden; }
.lf-flickthrough__img { position: absolute; inset: 0; opacity: 0; transition: opacity .1s linear; }
.lf-flickthrough__img.is-shown { opacity: 1; }
.lf-flickthrough__img img { width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 649px) { .lf-storyed__offset { grid-template-columns: 1fr; } }
{% endstylesheet %}

{% schema %}
{
  "name": "LF Story Editorial",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "our craft" },
    { "type": "image_picker", "id": "image_left", "label": "Wide image" },
    { "type": "image_picker", "id": "image_right", "label": "Tall image" },
    { "type": "textarea", "id": "copy", "label": "Body copy", "default": "Informed by tradition, within the context of today's culture, we want every piece to carry the weight of where it came from." },
    { "type": "image_picker", "id": "flick_image_1", "label": "Flickthrough image 1" },
    { "type": "image_picker", "id": "flick_image_2", "label": "Flickthrough image 2" },
    { "type": "image_picker", "id": "flick_image_3", "label": "Flickthrough image 3" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.imgScroll` and `LF.init.flickthrough` to `theme/assets/lf-sections.js`:**

```js
  // ——— Editorial image parallax (scrubbed to scroll) ———
  LF.init.imgScroll = function (root, ctx) {
    if (ctx.reduced || !window.gsap || !window.ScrollTrigger) return;
    (root || document).querySelectorAll('[data-lf-img-scroll]:not([data-lf-imgscroll-bound])').forEach(function (wrap) {
      wrap.setAttribute('data-lf-imgscroll-bound', '1');
      var img = wrap.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: 20, ease: 'linear',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  };

  // ——— Flickthrough hover zoetrope (desktop hover, mobile auto-cycle) ———
  LF.init.flickthrough = function (root, ctx) {
    var wrap = (root || document).querySelector('[data-lf-flickthrough]');
    if (!wrap || wrap.hasAttribute('data-lf-bound')) return;
    wrap.setAttribute('data-lf-bound', '1');
    var imgs = Array.prototype.slice.call(wrap.querySelectorAll('.lf-flickthrough__img'));
    if (imgs.length < 2) return;
    var index = 0, interval = null;
    function nextImage() {
      imgs[index].classList.remove('is-shown');
      index = (index + 1) % imgs.length;
      imgs[index].classList.add('is-shown');
    }
    if (ctx.reduced) return;
    if (LF.FINE.matches) {
      wrap.addEventListener('mouseenter', function () {
        nextImage();
        clearInterval(interval);
        interval = setInterval(nextImage, 300);
      });
      wrap.addEventListener('mouseleave', function () { clearInterval(interval); });
    } else {
      interval = setInterval(nextImage, 500);
    }
    LF.teardown.push(function () { clearInterval(interval); });
  };
```

> **As-run:** `LF.init.flickthrough` reads `FINE.matches`, but `FINE` is declared as a private `var` inside `lf-chrome.js`'s own top-level IIFE (`(function () { ... var FINE = ...; ... })();`), not attached to `window` or the shared `LF` namespace — it was never actually accessible from a different file/IIFE like `lf-sections.js`, despite both files sharing `LF.init`/`LF.teardown`/etc. This was a structural assumption error in the original plan (confirmed via live testing: referencing bare `FINE` from `lf-sections.js` throws `ReferenceError: FINE is not defined`, script `defer` order is irrelevant since this is lexical scoping, not a load-timing race). Fixed by exporting it onto the shared namespace — in `theme/assets/lf-chrome.js`, immediately after the existing `var FINE = window.matchMedia('(min-width: 992px) and (pointer: fine)');` line, add:
> ```js
>   LF.FINE = FINE; // shared across files via the LF namespace (lf-sections.js reads this)
> ```
> and reference it as `LF.FINE.matches` in `LF.init.flickthrough` above (already reflected in the code block). This is the more idiomatic fix versus the alternatives considered (a second independent `matchMedia` call in `lf-sections.js`, which would create a redundant `MediaQueryList`; or inlining the raw query string directly in the function) — `LF` is already the established shared-state namespace for cross-file values (`LF.scrollLock`, `LF.trapFocus`, `LF.money`, `LF.esc`), so `LF.FINE` fits that existing pattern rather than adding a new mechanism. Live-verified after the fix: no `ReferenceError`, hover-cycling on desktop-width/fine-pointer contexts and auto-cycling on coarse/narrow contexts both work correctly.
>
> **As-run (round 2):** code review found the `mouseenter` handler didn't guard against stacking intervals if it somehow fired twice without an intervening `mouseleave` — a trivial, zero-cost defensive `clearInterval(interval)` before re-arming (already reflected above) matches the identical pattern `LF.init.hero`'s `arm()` already uses elsewhere in this same file.

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-story-editorial.liquid theme/assets/lf-sections.js theme/assets/lf-chrome.js
git commit -m "feat(b3.2): story editorial band — parallax images + flickthrough zoetrope"
git status --short
```

> **As-run (site-wide directive, fixed in `04e3598`):** unlike Task 2/8's simple full-height sections, this is a composite section (eyebrow + offset image pair + body copy + flickthrough zoetrope) — the directive was scoped to only the offset image pair being the "photo scene" (eyebrow/copy/flickthrough stay compact, matching the approved clarifying-question scope). Added `min-height: 100svh; align-content: center;` to `.lf-storyed__offset` (reflected above). Note: `align-content: center` was used instead of the more obvious `align-items: center`, because with `align-items: center` CSS Grid's default `align-content: stretch` forces the row to stretch to the full section height, and since the shorter landscape image is `align-self: start`, the void beneath it grows unboundedly with viewport height (measured 454px at 900px height → 683px at 1080px height). `align-content: center` keeps the row's natural content height (~709px, set by the taller portrait image) and centers that whole two-image cluster, making the void a constant ~453px regardless of viewport.
> **Known, pre-existing, not fixed here:** that ~453px void beneath the landscape image is NOT new — it existed before this task's height changes too, driven by the two images' very different aspect ratios (`4.35/2.8` landscape vs. `4.35/6` portrait) combined with `align-self: start`/`end` staggering. It was easy to miss when this content scrolled past compactly; now that it's an isolated full-viewport scene, the void reads as a much more prominent black gap next to the left image. Not fixed in this pass since it's a pre-existing design characteristic, not a regression, and closing it (e.g. narrowing the aspect-ratio gap between the two images, or changing the stagger mechanism) is a real design decision outside the literal scope of "make sections fill the viewport." Flagged for the user to decide on a follow-up.

---

### Task 10: Story — sticky stack + floating crests + full-height footer wiring

**Files:**
- Create: `theme/sections/lf-story-sticky.liquid`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.stickyStack`, `LF.init.floatingCrests`)
- Modify: `theme/templates/page.story.json` (full replacement)
- Modify: `theme/layout/theme.liquid` (suppress global footer-group for `story`/`contact` templates)

- [ ] **Step 1: Create `theme/sections/lf-story-sticky.liquid`:**

```liquid
<section class="lf-storysticky">
  <p class="lf-storysticky__eyebrow" data-lf-reveal>{% render 'lf-eyebrow', text: 'our story' %}</p>
  <div class="lf-storysticky__stack">
    {% for i in (1..5) %}
      {% assign title_key = 'panel_title_' | append: i %}
      {% assign body_key = 'panel_body_' | append: i %}
      {% assign img_key = 'panel_image_' | append: i %}
      {% if section.settings[title_key] != blank %}
        <div class="lf-storysticky__panel">
          <div class="lf-storysticky__img">
            {% if section.settings[img_key] != blank %}
              {{ section.settings[img_key] | image_url: width: 1200 | image_tag: loading: 'lazy', alt: '' }}
            {% endif %}
          </div>
          <div class="lf-storysticky__copy">
            <h2 class="lf-display">{{ section.settings[title_key] }}</h2>
            <p>{{ section.settings[body_key] }}</p>
          </div>
        </div>
      {% endif %}
    {% endfor %}
  </div>
  <div class="lf-storysticky__crests" data-lf-floating-crests>
    {% for i in (1..3) %}
      <div class="lf-storysticky__crest {% if forloop.first %}is-shown{% endif %}" aria-hidden="true" style="--lf-crest: url('{{ 'lf-crest.png' | asset_url }}');"></div>
    {% endfor %}
  </div>
</section>

{% stylesheet %}
.lf-storysticky { padding: 2rem 1.5rem 3rem; }
.lf-storysticky__eyebrow { text-align: center; margin-bottom: 2.5rem; }
.lf-storysticky__stack { display: flex; flex-direction: column; max-width: 900px; margin: 0 auto; }
.lf-storysticky__panel {
  position: sticky; top: 0; height: 100svh; display: flex; flex-direction: column;
  justify-content: center; gap: 1.5rem; background: var(--lf-ground);
}
.lf-storysticky__img { aspect-ratio: 6.5/3.75; overflow: hidden; }
.lf-storysticky__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-storysticky__copy h2 { font-size: clamp(1.2rem, 3vw, 1.7rem); color: var(--lf-neon-core); text-shadow: 0 0 8px var(--lf-neon-halo); margin: 0 0 .6rem; }
.lf-storysticky__copy p { color: var(--lf-body-text); font-size: .92rem; line-height: 1.7; margin: 0; max-width: 60ch; }
.lf-storysticky__crests { position: relative; height: 40svh; display: grid; place-items: center; }
.lf-storysticky__crest {
  grid-area: 1/1; width: 90px; aspect-ratio: 300/320; opacity: 0;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-crest) center/contain no-repeat; mask: var(--lf-crest) center/contain no-repeat;
  filter: drop-shadow(0 0 10px var(--lf-neon-halo));
}
.lf-storysticky__crest.is-shown { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .lf-storysticky__panel { position: relative; height: auto; padding: 2rem 0; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Story Sticky Stack",
  "settings": [
    { "type": "text", "id": "panel_title_1", "label": "Panel 1 title", "default": "The First Stitch" },
    { "type": "textarea", "id": "panel_body_1", "label": "Panel 1 body", "default": "Every Laissez-Faire piece starts as a sketch of something the city already wears — a second-line umbrella, a wrought-iron gate, a brass band's Sunday best." },
    { "type": "image_picker", "id": "panel_image_1", "label": "Panel 1 image" },
    { "type": "text", "id": "panel_title_2", "label": "Panel 2 title", "default": "Cut for the Heat" },
    { "type": "textarea", "id": "panel_body_2", "label": "Panel 2 body", "default": "New Orleans doesn't do seasons the way other cities do. Every fabric choice starts with humidity, not runway trends." },
    { "type": "image_picker", "id": "panel_image_2", "label": "Panel 2 image" },
    { "type": "text", "id": "panel_title_3", "label": "Panel 3 title", "default": "Built to Outlast a Season" },
    { "type": "textarea", "id": "panel_body_3", "label": "Panel 3 body", "default": "Slow production, small runs, real seams. We'd rather make less and have it last." },
    { "type": "image_picker", "id": "panel_image_3", "label": "Panel 3 image" },
    { "type": "text", "id": "panel_title_4", "label": "Panel 4 title", "default": "A Night Economy" },
    { "type": "textarea", "id": "panel_body_4", "label": "Panel 4 body", "default": "This city runs after dark. Our neon is a nod to every sign that's ever lit somebody's walk home." },
    { "type": "image_picker", "id": "panel_image_4", "label": "Panel 4 image" },
    { "type": "text", "id": "panel_title_5", "label": "Panel 5 title", "default": "Laissez Les Bons Temps Rouler" },
    { "type": "textarea", "id": "panel_body_5", "label": "Panel 5 body", "default": "Let the good times roll — not as a slogan, but as instructions." },
    { "type": "image_picker", "id": "panel_image_5", "label": "Panel 5 image" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append `LF.init.stickyStack` and `LF.init.floatingCrests` to `theme/assets/lf-sections.js`:**

```js
  // ——— Sticky story stack: pure CSS position:sticky, JS only for reduced-motion no-op guard ———
  LF.init.stickyStack = function (root, ctx) {
    var stack = (root || document).querySelector('.lf-storysticky__stack');
    if (!stack || stack.hasAttribute('data-lf-bound')) return;
    stack.setAttribute('data-lf-bound', '1');
  };

  // ——— Floating crests: cycle visibility scrubbed to scroll position ———
  LF.init.floatingCrests = function (root, ctx) {
    var wrap = (root || document).querySelector('[data-lf-floating-crests]');
    if (!wrap || wrap.hasAttribute('data-lf-bound')) return;
    wrap.setAttribute('data-lf-bound', '1');
    if (ctx.reduced || !window.gsap || !window.ScrollTrigger) return;
    var crests = Array.prototype.slice.call(wrap.querySelectorAll('.lf-storysticky__crest'));
    if (crests.length < 2) return;
    var tl = gsap.timeline({
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    crests.forEach(function (c, idx) {
      tl.set(crests, {
        autoAlpha: function (i) { return i === idx ? 1 : 0; },
        overwrite: 'auto'
      }, idx / (crests.length - 1));
    });
  };
```

- [ ] **Step 3: Replace `theme/templates/page.story.json` entirely:**

```json
{
  "sections": {
    "hero": { "type": "lf-story-hero", "settings": {} },
    "editorial": {
      "type": "lf-story-editorial",
      "settings": {
        "image_left": "shopify://shop_images/lf-hero-chief.jpg",
        "image_right": "shopify://shop_images/lf-hero-secondline.jpg",
        "flick_image_1": "shopify://shop_images/lf-hero-chief.jpg",
        "flick_image_2": "shopify://shop_images/lf-hero-secondline.jpg",
        "flick_image_3": "shopify://shop_images/lf-hero-chief.jpg"
      }
    },
    "sticky": {
      "type": "lf-story-sticky",
      "settings": {
        "panel_image_1": "shopify://shop_images/lf-hero-chief.jpg",
        "panel_image_2": "shopify://shop_images/lf-hero-secondline.jpg",
        "panel_image_3": "shopify://shop_images/lf-hero-chief.jpg",
        "panel_image_4": "shopify://shop_images/lf-hero-secondline.jpg",
        "panel_image_5": "shopify://shop_images/lf-hero-chief.jpg"
      }
    },
    "footer": { "type": "lf-footer", "settings": { "full_height": true } }
  },
  "order": ["hero", "editorial", "sticky", "footer"]
}
```

- [ ] **Step 4: Suppress the global footer-group for `story`/`contact` templates** — modify `theme/layout/theme.liquid`, changing:

```liquid
    <main id="lf-main" data-barba="wrapper">
      <div data-barba="container" data-barba-namespace="{{ template.name }}">{{ content_for_layout }}</div>
    </main>
    {% sections 'footer-group' %}
```

to:

```liquid
    <main id="lf-main" data-barba="wrapper">
      <div data-barba="container" data-barba-namespace="{{ template.name }}">
        {{ content_for_layout }}
        {%- comment -%} Story renders its own full-height footer as a template section (above);
           Contact's split layout has an inline mini-footer and no standard footer at all.
           Scoped to template.name == 'page' too — template.suffix alone is resource-type-
           agnostic in Shopify, so an unrelated future alternate template (e.g.
           product.story.json) named "story"/"contact" for a different purpose would
           otherwise silently lose its footer sitewide.
           Lives INSIDE the Barba container (not after </main>) so it's re-evaluated
           and swapped on every client-side navigation, not just on hard/fresh loads —
           otherwise a stale footer-group from a previous page persists across Barba
           transitions into pages that should suppress it (or vice versa). {%- endcomment -%}
        {% unless template.name == 'page' and template.suffix == 'story' or template.name == 'page' and template.suffix == 'contact' %}
          {% sections 'footer-group' %}
        {% endunless %}
      </div>
    </main>
```

> **As-run (found via direct user report "there are two footers on story page", fixed in `001db88`):** the `{% unless %}...{% sections 'footer-group' %}` block originally lived AFTER `</main>` (outside the Barba container), so it was only evaluated on a hard/fresh page load — never re-evaluated on a client-side Barba transition. Reproduced live: hard-load Home (1 footer, correct) → click the nav's in-app "Story" link (Barba client-side transition) → 2 footers (the stale Home footer-group, never removed because it lived outside the swapped container, plus Story's own full-height footer which correctly rendered as part of the swap). Fixed by moving the entire `{% unless %}` block to inside `<div data-barba="container">`, immediately after `{{ content_for_layout }}` — now it's part of what Barba swaps on every navigation, matching how Story's own template-level footer already behaved. Verified safe: `LF.init.footerFollow` and all footer-tied listeners already use the `data-lf-bound` idempotency guard + `LF.init.*` re-dispatch pattern that's designed to survive repeated re-run after every Barba swap, so nothing assumed the footer's DOM persisted untouched across navigations. Full verification matrix (6 cells, all pass): Home hard-load (1, standard), Home→Story via Barba (1, full-height — bug fixed), Story→Home via Barba (1, standard, correctly reappears), Home→Contact via Barba (0 `.lf-footer` + 1 `.lf-contact__mini-footer`, correct), Story hard-load (1, full-height, regression-safe), Contact hard-load (0 + mini-footer, regression-safe).

- [ ] **Step 5: Push to dev, verify** — `/pages/story` shows hero (with working reading-hover on desktop), editorial band with parallax images and flickthrough, 5 sticky panels that pin and stack while scrolling, floating crests cycling, then the full-height footer — and only ONE footer renders (not the default plus the full-height one).

```bash
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
```

> **As-run:** code review found two Important issues, both fixed and already reflected above. (1) The footer-suppression conditional checked bare `template.suffix`, which is resource-type-agnostic in Shopify (pages, articles, products, collections can all have suffixed alternate templates) — zero live risk today (only `page.story.json` exists), but a latent footgun for any future unrelated template happening to share the "story"/"contact" suffix name. Scoped with `template.name == 'page'` too, matching this same file's existing `template.name` usage for the Barba namespace. (2) `theme/sections/lf-footer.liquid`'s `.lf-footer--full` used `min-height: 100dvh` while every other full-viewport element in the theme (`lf-hero-slider`, `lf-hero-slider-v2`, `lf-teaser`, and this task's own sticky panels) consistently uses `100svh` — since this task is the first to place a `100dvh` element directly after a `100svh` sticky stack, the mismatch could produce a visible height snap at that boundary as mobile browser chrome collapses/expands during scroll. Switched to `100svh` for consistency (a fix to an already-shipped B3.1 file, made here because it's directly caused by what this task introduces).
> **As-run (found in the user's Task 12 visual pass, fixed in `635282c`):** Step 3's `page.story.json` originally wired both `editorial` and `sticky` with `"settings": {}` — same class of bug as lookbook/cta-row above, but with a twist: unlike text/textarea settings (which have schema `default` values and rendered fine), `image_picker` settings have no default, so `panel_image_1-5` (sticky) and `image_left`/`image_right`/`flick_image_1-3` (editorial) all resolved blank and no `<img>` ever rendered. Confirmed live: each `.lf-storysticky__img` container still reserved ~519px of height via its `aspect-ratio` CSS (an invisible box matching the page background color), and since `.lf-storysticky__panel` is a `100svh` flex column with `justify-content: center`, that invisible box pushed the real title/body copy down into the bottom third of the panel — reading as "small, dim, cornered text against a huge black void," which is exactly what the user reported. The editorial section's offset images and flickthrough zoetrope were equally blank for the same reason. Seeded both sections with the two hero images (code block above corrected). Re-verified by scrolling in 500px increments across the full page: all 5 panels and the editorial band now render full styled imagery, no black-void gaps remain.

- [ ] **Step 6: Commit**

```bash
git add theme/sections/lf-story-sticky.liquid theme/assets/lf-sections.js theme/templates/page.story.json theme/layout/theme.liquid theme/sections/lf-footer.liquid
git commit -m "feat(b3.2): story sticky stack, floating crests, full-height footer wiring"
git status --short
```

---

### Task 11: Contact — split-screen sticky layout

**Files:**
- Create: `theme/sections/lf-contact-split.liquid`
- Create: `theme/templates/page.contact.json`
- Modify: `theme/assets/lf-sections.js` (append `LF.init.contactSplit`)

- [ ] **Step 1: Create `theme/sections/lf-contact-split.liquid`:**

```liquid
<section class="lf-contact">
  <div class="lf-contact__imgs" data-lf-reveal>
    {% for i in (1..4) %}
      {% assign img_key = 'image_' | append: i %}
      {% if section.settings[img_key] != blank %}
        <div class="lf-contact__imgwrap">
          {{ section.settings[img_key] | image_url: width: 900 | image_tag: loading: 'lazy', alt: '' }}
        </div>
      {% endif %}
    {% endfor %}
  </div>
  <div class="lf-contact__info">
    <p class="lf-contact__label">{% render 'lf-eyebrow', text: 'contact us' %}</p>
    {% if section.settings.email != blank %}<a class="lf-contact__link lf-display" href="mailto:{{ section.settings.email | escape }}">{{ section.settings.email }}</a>{% endif %}
    <p class="lf-contact__sub">{{ section.settings.body }}</p>
    {% if section.settings.instagram_url != blank %}<a class="lf-contact__ig" href="{{ section.settings.instagram_url }}" target="_blank" rel="me noopener" data-cursor="Follow">Instagram</a>{% endif %}
    <div class="lf-contact__mini-footer">
      <div class="lf-contact__wordmark" role="img" aria-label="Laissez-Faire Leisure Club"
           style="--lf-wordmark: url('{{ 'lf-wordmark.png' | asset_url }}');"></div>
      <p class="lf-contact__legal">{% render 'lf-stamp' %} — New Orleans, Louisiana</p>
    </div>
  </div>
</section>

{% stylesheet %}
.lf-contact { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
.lf-contact__imgs { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; overflow-y: auto; }
.lf-contact__imgwrap { aspect-ratio: 4/5; overflow: hidden; }
.lf-contact__imgwrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-contact__info {
  position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column;
  justify-content: center; gap: 1rem; padding: 2rem 2.5rem; min-width: 0;
}
.lf-contact__label { margin: 0; }
.lf-contact__link { font-size: clamp(1.6rem, 4vw, 2.6rem); color: var(--lf-neon-core); text-shadow: 0 0 10px var(--lf-neon-halo); text-decoration: none; overflow-wrap: break-word; display: inline-block; max-width: 100%; }
.lf-contact__sub { color: var(--lf-body-text); font-size: .9rem; line-height: 1.6; max-width: 40ch; margin: 0; }
.lf-contact__ig { color: var(--lf-muted); font-size: .78rem; letter-spacing: .16em; text-transform: uppercase; text-decoration: none; }
.lf-contact__ig:hover { color: var(--lf-neon-core); }
.lf-contact__mini-footer { margin-top: 2.5rem; }
.lf-contact__wordmark {
  width: 220px; aspect-ratio: 2129/749; background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-wordmark) center/contain no-repeat; mask: var(--lf-wordmark) center/contain no-repeat;
  filter: drop-shadow(0 0 6px var(--lf-neon-halo)); margin-bottom: .6rem;
}
.lf-contact__legal { color: var(--lf-muted); font-size: .64rem; letter-spacing: .1em; margin: 0; }
@media (max-width: 749px) {
  .lf-contact { grid-template-columns: 1fr; }
  .lf-contact__info { position: relative; height: auto; padding: 2.5rem 1.25rem; }
}
{% endstylesheet %}

{% schema %}
{
  "name": "LF Contact Split",
  "settings": [
    { "type": "text", "id": "email", "label": "Email", "default": "hello@laissezfaireleisureclub.com" },
    { "type": "textarea", "id": "body", "label": "Body copy", "default": "Questions about a drop, a fit, or the club — we read everything." },
    { "type": "url", "id": "instagram_url", "label": "Instagram URL" },
    { "type": "image_picker", "id": "image_1", "label": "Image 1" },
    { "type": "image_picker", "id": "image_2", "label": "Image 2" },
    { "type": "image_picker", "id": "image_3", "label": "Image 3" },
    { "type": "image_picker", "id": "image_4", "label": "Image 4" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create `theme/templates/page.contact.json`:**

```json
{
  "sections": {
    "main": { "type": "lf-contact-split", "settings": {} }
  },
  "order": ["main"]
}
```

- [ ] **Step 3: Append `LF.init.contactSplit` to `theme/assets/lf-sections.js`:**

```js
  // ——— Contact split layout: pure CSS sticky, nothing to bind beyond the idempotency guard ———
  LF.init.contactSplit = function (root, ctx) {
    var section = (root || document).querySelector('.lf-contact');
    if (!section || section.hasAttribute('data-lf-bound')) return;
    section.setAttribute('data-lf-bound', '1');
  };
```

- [ ] **Step 4: Push to dev, verify** — a page assigned the "page.contact" template renders the split layout with no standard footer beneath it.

```bash
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
```

**Manual step required (cannot be done from theme code):** in Shopify admin → Online Store → Pages → Contact, set **Theme template** to `page.contact`. Theme files only make the template available; assigning it to the actual Contact page is an admin action, same category as the drop-day steps in `RUNBOOK.md`.

- [ ] **Step 5: Commit**

```bash
git add theme/sections/lf-contact-split.liquid theme/templates/page.contact.json theme/assets/lf-sections.js
git commit -m "feat(b3.2): contact page — split-screen sticky layout, new alternate template"
git status --short
```

**As-run notes:**
- **Live verification of alternate page templates:** `shopify theme dev`'s local proxy (`http://127.0.0.1:<port>/pages/<handle>?view=<suffix>`) bypasses the storefront password gate entirely — it's tied to the CLI's authenticated session, not the storefront's password cookie. This is simpler than the live-domain `?preview_theme_id=` + session-cookie technique used in Phase B2, and works for previewing an alternate template on an *existing* page before it's admin-assigned. Used `/pages/contact?view=contact` to confirm `lf-contact-split.liquid` renders (not the generic `page.liquid` fallback), sticky behavior holds, and no standard footer renders beneath it (confirming Task 10's `template.suffix == 'contact'` branch, previously only tested for `'story'`).
- **Fixed grid blowout:** the unbroken `mailto:` email text at up to `2.6rem` had no wrap constraint, and CSS grid items default to `min-width: auto` (content-based) rather than `0` — this let `.lf-contact__info`'s intrinsic content width push it past its fair `1fr` share, measured at ~419px/981px instead of ~700px/700px at a 1400px viewport, squeezing the image column. Fixed by adding `min-width: 0` to `.lf-contact__info` (lets the grid track actually shrink to its fair share) and `overflow-wrap: break-word; display: inline-block; max-width: 100%;` to `.lf-contact__link` (stops the email string itself from overflowing once the column shrinks). Both fixes are folded into Step 1's code block above.
- **Known pre-existing pattern, not fixed here:** `<p class="lf-contact__label">{% render 'lf-eyebrow' %}</p>` nests a block-level `<p>` inside another `<p>` (`lf-eyebrow.liquid` already emits its own `<p class="lf-eyebrow">`), which browsers auto-repair, leaving `.lf-contact__label` as a dead empty node. The same pattern exists in `lf-story-editorial.liquid`, `lf-cta-row.liquid`, and `lf-story-sticky.liquid` from earlier tasks — this is systemic across the phase, not specific to Contact, and is out of scope for a single-task fix. Worth a dedicated cleanup pass (e.g. changing the wrapper to `<div>` or removing it in favor of `lf-eyebrow`'s own tag) before or during B3.3.
- **Code-quality review fixes:** the `mailto:` href interpolated the free-text `email` setting unescaped into a double-quoted attribute — a `"`-containing value from the theme customizer could break out of the attribute (stored-injection risk). Fixed by adding `| escape`. Also aligned `rel="noopener"` on the Instagram link to `rel="me noopener"`, the established convention already used by the other two Instagram links in the codebase (`lf-footer.liquid`, `lf-teaser.liquid`). Both fixes are folded into Step 1's code block above. Note: `lf-footer.liquid`'s own `contact_email` mailto link has the identical unescaped-attribute gap already shipped from an earlier phase — out of scope to fix here since this task didn't touch that file, but worth including in the same future cleanup pass as the `<p>`-nesting issue above.

---

### Task 12: Verification + ship `v0.4.1-editorial`

**Files:** none (verification + deploy)

- [ ] **Step 1: theme check** — `shopify theme check --path theme` — expect no new offenses vs. the B3.1 baseline (4 warnings: 3 RemoteAsset + 1 OrphanedSnippet for `lf-eyebrow` — this task renders `lf-eyebrow` in 3 new places, so that warning should clear too; confirm actual count and treat any *new* warning type as a real finding to fix).

- [ ] **Step 2: Push to dev theme, restart dev server** (new templates were added):

```bash
shopify theme push --path theme --development --store 1xiwxi-yy.myshopify.com
```

- [ ] **Step 3: Scripted behind-the-gate pass** (write to scratchpad, run with `NODE_PATH=/Users/dow/node_modules node <file>`; base `http://127.0.0.1:9292`; note the B3.1 lesson baked in below — reload the SAME tab for repeat-visit checks, and use generous waits for anything GSAP-timeline-driven):

```js
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:9292';
(async () => {
  const browser = await chromium.launch();

  // 1. Home: hero v2 nav dots advance + clip-wipe, marquee drags, lookbook arrows work
  const p = await browser.newPage();
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const dotsBefore = await p.evaluate(() => document.querySelector('.lf-heroV2__navitem.is-active').getAttribute('data-index'));
  await p.click('[data-lf-hero-dot]:nth-child(2) button');
  await p.waitForTimeout(1500);
  const dotsAfter = await p.evaluate(() => document.querySelector('.lf-heroV2__navitem.is-active').getAttribute('data-index'));
  console.log('hero dot changed:', dotsBefore !== dotsAfter);

  await p.click('[data-lf-lookbook-next]');
  await p.waitForTimeout(700);
  console.log('lookbook advanced:', await p.evaluate(() => document.querySelector('[data-lf-lookbook-current]').textContent === '02'));

  const marqueeXBefore = await p.evaluate(() => getComputedStyle(document.querySelector('[data-lf-marquee-track]')).transform);
  await p.waitForTimeout(2000);
  const marqueeXAfter = await p.evaluate(() => getComputedStyle(document.querySelector('[data-lf-marquee-track]')).transform);
  console.log('marquee auto-scrolled:', marqueeXBefore !== marqueeXAfter);

  // 2. Story: sticky panels present, reading-hover CSS applies (if :has() supported), footer is full-height variant, only ONE footer
  const s = await browser.newPage();
  await s.goto(BASE + '/pages/story', { waitUntil: 'load' });
  await s.waitForTimeout(800);
  console.log('story sticky panels:', await s.evaluate(() => document.querySelectorAll('.lf-storysticky__panel').length) === 5);
  console.log('story footer is full-height:', await s.evaluate(() => document.querySelector('.lf-footer--full') !== null));
  console.log('only one footer on story page:', await s.evaluate(() => document.querySelectorAll('.lf-footer').length) === 1);

  // 3. Contact: split layout renders, no standard/full-height footer at all
  const c = await browser.newPage();
  await c.goto(BASE + '/pages/contact', { waitUntil: 'load' }).catch(() => {});
  console.log('contact split renders:', await c.evaluate(() => !!document.querySelector('.lf-contact')));
  console.log('contact has no footer:', await c.evaluate(() => document.querySelectorAll('.lf-footer').length) === 0);

  // 4. 375px overflow sweep across all touched templates
  for (const path of ['/', '/pages/story', '/pages/contact']) {
    const m = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await m.goto(BASE + path, { waitUntil: 'load' }).catch(() => {});
    await m.waitForTimeout(400);
    console.log('375px', path, 'overflow:', await m.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth));
    await m.close();
  }

  // 5. Reduced motion: marquee wraps flat, sticky panels become non-sticky, no page errors
  const ctx2 = await browser.newContext({ reducedMotion: 'reduce' });
  const r = await ctx2.newPage();
  const rErrors = [];
  r.on('pageerror', e => rErrors.push(e.message));
  await r.goto(BASE + '/', { waitUntil: 'load' });
  await r.waitForTimeout(500);
  console.log('RM: marquee track wraps (not horizontal scroll):', await r.evaluate(() =>
    getComputedStyle(document.querySelector('.lf-marquee__track')).flexWrap === 'wrap'));
  await r.goto(BASE + '/pages/story', { waitUntil: 'load' });
  console.log('RM: sticky panels are static:', await r.evaluate(() =>
    getComputedStyle(document.querySelector('.lf-storysticky__panel')).position !== 'sticky'));
  console.log('RM: zero page errors:', rErrors.length === 0);

  // 6. Cart + teaser regression (unchanged by this plan, quick spot check)
  await p.click('[data-lf-cart-open]');
  await p.waitForTimeout(800);
  console.log('cart drawer still opens:', await p.evaluate(() => document.querySelector('[data-lf-drawer]').classList.contains('is-open')));
  const t = await browser.newPage();
  await t.goto(BASE + '/password', { waitUntil: 'load' }).catch(() => {});
  console.log('teaser intact, barba-free:', await t.evaluate(() =>
    !!document.querySelector('.lf-teaser, [data-lf-teaser]') && !document.querySelector('[data-barba]')));

  await browser.close();
})();
```

Expected: every line `true` / overflow `0`. Fix findings, re-run until clean; commit fixes as `fix(b3.2): <finding>` and amend the relevant plan code blocks.

> **As-run:** theme check held at 3 warnings (all pre-existing `RemoteAsset` in `lf-fonts.liquid`) — the B3.1-baseline `OrphanedSnippet` warning for `lf-eyebrow` cleared as predicted, since Contact/Story now render it. First script run found `lookbook advanced: false` — root-caused to Task 7's `index.json` wiring the lookbook section with zero blocks (see Task 7's As-run note above), fixed in `de44c28`, re-verified clean. All other checks passed on the first run.

- [ ] **Step 4: User visual pass** on the dev preview (hero feel, marquee drag feel, sticky stack pacing, contact layout, story reading-hover on a real desktop browser). Fix + re-verify anything raised.

- [ ] **Step 5: Ship**

```bash
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
curl -sL "https://laissezfaireleisureclub.com/" | grep -o "lf-teaser" | head -1   # teaser still gating
git checkout master && git merge --no-ff feat/phase-b3-editorial -m "Ship B3.2: editorial pages" && git tag v0.4.1-editorial
git push origin master --tags
```

Expected: teaser still prints; tag exists on GitHub. Remember to also do Task 11's manual admin step (assign the `page.contact` template to the live Contact page) after shipping — theme code alone doesn't do this.

---

## Not in this plan

Shop/PDP rebuild + neon flood (B3.3 plan). Real partner orgs, real lookbook photography/video, real contact email/social (all filler, marked for swap per spec §5). `templates/page.json`'s generic fallback stays as-is for any other page that doesn't opt into `page.story`/`page.contact`.

## Branch setup (do this before Task 1)

```bash
cd /Users/dow/laissez-faire && git checkout master && git pull && git checkout -b feat/phase-b3-editorial
```

## Self-review notes

- **Spec coverage (B3.2 §4):** Home 7→6-content-sections (hero v2, statement, CTA row, marquee, lookbook, community — email block retained from B1) ✓ (T1-T7), overlap-scroll stitching ✓ (T7); nav recolor is deliberately NOT wired to any B3.2 section — `[data-nav-light]` exists in B3.1 for a section with a light/bright background, and per spec §2 the whole site stays night-black with no light-mode sections, so no B3.2 section ever qualifies; an earlier draft of this plan mistakenly added an unhandled `data-nav-dark` marker (no corresponding code anywhere in `lf-chrome.js`) to several sections — removed before implementation, since a marker with no behavior is worse than no marker at all; Story: reading-hover hero ✓ (T8), editorial band+parallax+flickthrough ✓ (T9), sticky stack+floating crests ✓ (T10), full-height footer ✓ (T10); Contact: split-screen sticky, no standard footer, inline mini-footer ✓ (T11). Engineering constraints: no new vendors (marquee drag uses `gsap.utils.wrap`/`unitize`, already in core, + native Pointer Events) ✓, teardown discipline (marquee ticker, flickthrough interval, hero autoplay timer all push to `LF.teardown`) ✓, reduced-motion (marquee wraps flat, sticky panels un-stick, flickthrough/parallax/crests all early-return) ✓, desktop gating via existing `FINE` for flickthrough hover mode ✓.
- **Placeholder scan:** none — all filler copy is real, usable text (marked implicitly as spec-sanctioned filler per §5/§6 of the design spec, not literal "TBD" placeholders). All code blocks complete.
- **Consistency:** `LF.init.*` names (`heroV2`, `ctaFollow`, `marquee`, `lookbook`, `community`, `storyHero`, `imgScroll`, `flickthrough`, `stickyStack`, `floatingCrests`, `contactSplit`, `scrollOverlap`) are each defined once and don't collide with any B1-B3.1 name; `data-lf-bound` guard pattern applied to every new init; `FINE`/`LF.teardown`/`LF.scrollLock` reused from `lf-chrome.js` (B3.1) without redefinition; `template.suffix` values (`story`, `contact`) match the JSON template filenames (`page.story.json`, `page.contact.json`) exactly, required for Shopify's alternate-template resolution to work.
