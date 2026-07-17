# Laissez-Faire Teaser + Theme Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase A of the approved spec — a custom Shopify theme scaffold whose password page is the Laissez-Faire neon teaser (flicker-on wordmark, manifesto line, email capture) — so the brand collects emails on its own domain while Phase B (full store) is built in the same repo.

**Architecture:** Custom Online Store 2.0 theme cloned from Shopify's Skeleton starter into `theme/`. Brand neon is rendered programmatically: the flat-alpha wordmark PNG is used as a CSS `mask-image` and painted with token colors + `drop-shadow` glow, so flicker/color changes are pure CSS. Email capture uses Shopify's native `{% form 'customer' %}` on the password page (Klaviyo syncs these via its Shopify integration — no API keys in theme code).

**Tech Stack:** Shopify CLI 3.x, Liquid (OS 2.0 JSON templates), vanilla CSS/JS, Google Fonts (Graduate, Kaushan Script, Archivo), `sips` for asset export. No jQuery, no build step, no external runtime JS.

**Spec:** `docs/superpowers/specs/2026-07-16-laissez-faire-site-design.md` (Phase A scope; Phase B full store is a separate follow-up plan)

**Verification model:** Liquid themes have no unit-test harness; the TDD loop here is `shopify theme check` (static analysis, must stay clean) + explicit visual/behavioral checks against `shopify theme dev` with expected results stated per step. Work happens on branch `feat/teaser` in the main checkout (no worktrees — Edit-tool/worktree desync risk per user memory).

## File structure

```
laissez-faire/
├── docs/superpowers/…                    (existing spec + this plan)
└── theme/                                (Task 2 scaffold — Skeleton starter)
    ├── assets/
    │   ├── lf-tokens.css                 (Task 4: design tokens + glow utilities + reduced-motion)
    │   ├── lf-wordmark.png               (Task 3: from lf3.png, 1500px wide)
    │   └── lf-fleur.png                  (Task 3: from lf4.png, 600px wide)
    ├── layout/
    │   └── password.liquid               (Task 6: night-room shell for the teaser)
    ├── sections/
    │   └── lf-teaser.liquid              (Task 5: sign, manifesto, email form, IG link + schema)
    ├── snippets/
    │   └── lf-fonts.liquid               (Task 4: Google Fonts loader)
    └── templates/
        └── password.json                 (Task 6: wires lf-teaser onto the password page)
```

---

### Task 1: Prerequisites (operator + CLI)

**Files:** none (environment only)

- [ ] **Step 1: Install Shopify CLI**

```bash
brew tap shopify/shopify && brew install shopify-cli
```

- [ ] **Step 2: Verify CLI**

Run: `shopify version`
Expected: a `3.x` version number prints.

- [ ] **Step 3 (OPERATOR ACTION — blocks Tasks 7–8 only):** Create the Shopify store if none exists: https://www.shopify.com/free-trial → note the `*.myshopify.com` domain. Tasks 2–6 proceed without it.

- [ ] **Step 4: Create working branch**

```bash
cd /Users/dow/laissez-faire && git checkout -b feat/teaser
```

### Task 2: Scaffold the theme from Skeleton

**Files:**
- Create: `theme/` (entire Skeleton starter)

- [ ] **Step 1: Clone Skeleton starter**

```bash
cd /Users/dow/laissez-faire
shopify theme init theme --clone-url https://github.com/Shopify/skeleton-theme
```

(If the CLI prompts for a name, it has ignored the positional arg — answer `theme`.)

- [ ] **Step 2: Verify scaffold shape**

Run: `ls theme`
Expected: `assets  blocks  config  layout  locales  sections  snippets  templates` (Skeleton may omit `blocks`; required minimum is `assets config layout locales sections snippets templates`).

- [ ] **Step 3: Baseline theme check**

Run: `shopify theme check --path theme`
Expected: exit code 0, `0 offenses` (Skeleton ships clean; if it reports offenses, note them — they are the pre-existing baseline, do not fix in this task).

- [ ] **Step 4: Remove the starter's git metadata if present, then commit**

```bash
rm -rf theme/.git
git add theme && git commit -m "Scaffold theme from Shopify Skeleton starter"
```

### Task 3: Export brand assets into the theme

**Files:**
- Create: `theme/assets/lf-wordmark.png` (source: `/Users/dow/Documents/LF/lf3.png`, 3000×1800, has alpha — flat monoline script)
- Create: `theme/assets/lf-fleur.png` (source: `/Users/dow/Documents/LF/lf4.png`, 3000×1800, has alpha — engraved fleur-de-lis)

- [ ] **Step 1: Export downscaled copies (PNG, preserve alpha — do NOT convert to JPEG)**

```bash
cd /Users/dow/laissez-faire
sips -Z 1500 -s format png "/Users/dow/Documents/LF/lf3.png" --out theme/assets/lf-wordmark.png
sips -Z 600  -s format png "/Users/dow/Documents/LF/lf4.png"  --out theme/assets/lf-fleur.png
```

- [ ] **Step 2: Verify alpha survived and sizes are sane**

Run: `sips -g pixelWidth -g hasAlpha theme/assets/lf-wordmark.png theme/assets/lf-fleur.png && du -h theme/assets/lf-*.png`
Expected: `hasAlpha: yes` on both; wordmark ≤ 300KB, fleur ≤ 200KB. If larger, re-run Step 1 with `-Z 1200` / `-Z 480`.

- [ ] **Step 3: Commit**

```bash
git add theme/assets/lf-wordmark.png theme/assets/lf-fleur.png
git commit -m "Add wordmark and fleur-de-lis exports with alpha for CSS masking"
```

### Task 4: Design tokens, glow utilities, and fonts

**Files:**
- Create: `theme/assets/lf-tokens.css`
- Create: `theme/snippets/lf-fonts.liquid`

- [ ] **Step 1: Write `theme/assets/lf-tokens.css`**

```css
/* Laissez-Faire design tokens — spec §2. Glow is display-only; body text never glows. */
:root {
  --lf-ground: #0d0d11;
  --lf-panel: #14141a;
  --lf-body-text: #c9c9d4;
  --lf-muted: #7a7a85;

  --lf-neon-core: #9fd8ff;   /* house neon: ice blue */
  --lf-neon-halo: #4aa8ff;

  /* per-drop accents (Phase B swaps these via metafield) */
  --lf-accent-red-core: #fff3dd;
  --lf-accent-red-halo: #c8102e;
  --lf-accent-green-core: #f5f0a0;
  --lf-accent-green-halo: #2fbf71;
  --lf-accent-purple-core: #9fd8ff;
  --lf-accent-purple-halo: #8b3df0;

  --lf-font-display: 'Graduate', 'Arial Black', sans-serif;
  --lf-font-script: 'Kaushan Script', cursive;
  --lf-font-body: 'Archivo', Arial, sans-serif;

  --lf-ease: cubic-bezier(0.32, 0.72, 0, 1); /* single site-wide easing family */
}

body {
  background: var(--lf-ground);
  color: var(--lf-body-text);
  font-family: var(--lf-font-body);
  font-weight: 300;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

.lf-glow-text {
  color: var(--lf-neon-core);
  text-shadow: 0 0 8px var(--lf-neon-halo), 0 0 28px var(--lf-neon-halo);
}

.lf-script { font-family: var(--lf-font-script); }
.lf-display {
  font-family: var(--lf-font-display);
  letter-spacing: .04em;
  text-transform: uppercase;
}

/* Neon sign flicker — applied once per session by lf-teaser.liquid JS */
@keyframes lf-flicker {
  0%, 100% { opacity: 1; }
  8%  { opacity: .15; }
  12% { opacity: 1; }
  16% { opacity: .3; }
  22% { opacity: 1; }
  38% { opacity: .2; }
  44% { opacity: 1; }
  58% { opacity: .85; }
  63% { opacity: 1; }
}
.lf-flicker-on { animation: lf-flicker 2.2s var(--lf-ease) 1; }

/* Accessibility hard requirement (spec §4): static glow, no flicker */
@media (prefers-reduced-motion: reduce) {
  .lf-flicker-on { animation: none; }
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Write `theme/snippets/lf-fonts.liquid`**

```liquid
{%- comment -%} Google Fonts: Graduate (varsity display), Kaushan Script (culture lines), Archivo (body). {%- endcomment -%}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Graduate&family=Kaushan+Script&family=Archivo:wght@300;400;600&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Theme check**

Run: `shopify theme check --path theme`
Expected: no NEW offenses vs the Task 2 baseline.

- [ ] **Step 4: Commit**

```bash
git add theme/assets/lf-tokens.css theme/snippets/lf-fonts.liquid
git commit -m "Add design tokens, neon glow utilities, and font loader"
```

### Task 5: Teaser section

**Files:**
- Create: `theme/sections/lf-teaser.liquid`

- [ ] **Step 1: Write `theme/sections/lf-teaser.liquid` (complete file)**

```liquid
<div class="lf-teaser">
  <div
    class="lf-teaser__sign"
    role="img"
    aria-label="Laissez-Faire"
    style="--lf-wordmark: url('{{ 'lf-wordmark.png' | asset_url }}');"
  ></div>

  <p class="lf-teaser__manifesto lf-script">{{ section.settings.manifesto_line }}</p>

  <div class="lf-teaser__fleur" aria-hidden="true">
    <img src="{{ 'lf-fleur.png' | asset_url }}" width="44" height="26" loading="lazy" alt="">
  </div>

  {% if section.settings.show_signup %}
    <div class="lf-teaser__signup">
      {% form 'customer', class: 'lf-teaser__form' %}
        <input type="hidden" name="contact[tags]" value="teaser-list">
        {% if form.posted_successfully? %}
          <p class="lf-teaser__success lf-glow-text">You're on the list. Lights on soon.</p>
        {% else %}
          <label for="lf-email" class="lf-teaser__label">{{ section.settings.signup_prompt }}</label>
          <div class="lf-teaser__row">
            <input
              id="lf-email"
              type="email"
              name="contact[email]"
              required
              autocomplete="email"
              placeholder="you@example.com"
            >
            <button type="submit" class="lf-display">Notify&nbsp;Me</button>
          </div>
          {% if form.errors %}
            <p class="lf-teaser__error" role="alert">{{ form.errors | default_errors }}</p>
          {% endif %}
        {% endif %}
      {% endform %}
    </div>
  {% endif %}

  {% if section.settings.instagram_url != blank %}
    <a class="lf-teaser__ig" href="{{ section.settings.instagram_url }}" rel="me noopener" target="_blank">Instagram</a>
  {% endif %}
</div>

{% stylesheet %}
.lf-teaser {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.75rem;
  padding: 2rem 1.25rem;
  text-align: center;
}
.lf-teaser__sign {
  width: min(82vw, 620px);
  aspect-ratio: 3000 / 1800;
  background-color: var(--lf-neon-core);
  -webkit-mask: var(--lf-wordmark) center / contain no-repeat;
  mask: var(--lf-wordmark) center / contain no-repeat;
  filter: drop-shadow(0 0 6px var(--lf-neon-halo)) drop-shadow(0 0 26px var(--lf-neon-halo));
}
.lf-teaser__manifesto {
  font-size: clamp(1.05rem, 2.6vw, 1.4rem);
  color: var(--lf-body-text);
  max-width: 34ch;
  margin: 0;
}
.lf-teaser__fleur img { opacity: .55; }
.lf-teaser__label {
  display: block;
  font-size: .72rem;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--lf-muted);
  margin-bottom: .7rem;
}
.lf-teaser__row { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; }
.lf-teaser__row input {
  background: var(--lf-panel);
  border: 1px solid #26262e;
  color: var(--lf-body-text);
  padding: .8rem 1rem;
  min-width: min(60vw, 280px);
  font-family: var(--lf-font-body);
}
.lf-teaser__row input:focus-visible {
  outline: 2px solid var(--lf-neon-halo);
  outline-offset: 2px;
}
.lf-teaser__row button {
  background: transparent;
  border: 1px solid var(--lf-neon-halo);
  color: var(--lf-neon-core);
  text-shadow: 0 0 10px var(--lf-neon-halo);
  padding: .8rem 1.4rem;
  font-size: .8rem;
  cursor: pointer;
  transition: box-shadow .3s var(--lf-ease);
}
.lf-teaser__row button:hover { box-shadow: 0 0 18px var(--lf-neon-halo); }
.lf-teaser__error { color: #ff8896; font-size: .85rem; }
.lf-teaser__ig {
  color: var(--lf-muted);
  font-size: .72rem;
  letter-spacing: .28em;
  text-transform: uppercase;
  text-decoration: none;
  border-bottom: 1px solid #26262e;
  padding-bottom: 2px;
}
.lf-teaser__ig:hover { color: var(--lf-neon-core); border-color: var(--lf-neon-halo); }
{% endstylesheet %}

{% javascript %}
  // Flicker the sign on once per browser session; respect reduced motion.
  var sign = document.querySelector('.lf-teaser__sign');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sign && !reduced && !sessionStorage.getItem('lfFlickered')) {
    sign.classList.add('lf-flicker-on');
    sessionStorage.setItem('lfFlickered', '1');
  }
{% endjavascript %}

{% schema %}
{
  "name": "LF Teaser",
  "settings": [
    {
      "type": "text",
      "id": "manifesto_line",
      "label": "Manifesto line",
      "default": "Effortless excellence through uncompromising craftsmanship."
    },
    {
      "type": "text",
      "id": "signup_prompt",
      "label": "Signup prompt",
      "default": "Be there when the lights come on"
    },
    {
      "type": "checkbox",
      "id": "show_signup",
      "label": "Show email signup",
      "default": true
    },
    {
      "type": "url",
      "id": "instagram_url",
      "label": "Instagram URL"
    }
  ],
  "presets": [{ "name": "LF Teaser" }]
}
{% endschema %}
```

- [ ] **Step 2: Theme check**

Run: `shopify theme check --path theme`
Expected: no new offenses. (If `{% stylesheet %}`/`{% javascript %}` tags are flagged as unknown by an old CLI, upgrade CLI: `brew upgrade shopify-cli` — do not inline `<style>`/`<script>` instead.)

- [ ] **Step 3: Commit**

```bash
git add theme/sections/lf-teaser.liquid
git commit -m "Add neon teaser section with masked wordmark, signup form, and flicker"
```

### Task 6: Password layout + template

> **Amendment (added during execution, after Task 2's code-quality review):** the Shopify Skeleton starter cloned in Task 2 already ships `theme/layout/password.liquid`, `theme/sections/password.liquid`, and `theme/templates/password.json`. Steps 1–2 below are therefore **overwrites** of existing files, not new-file creation. Additionally, once `templates/password.json` is rewired to render `lf-teaser` instead of Skeleton's stock `password` section, `theme/sections/password.liquid` becomes dead code — **Step 2.5 (added)** deletes it in the same commit, after confirming nothing else references it.

**Files:**
- Modify (overwrite): `theme/layout/password.liquid`
- Modify (overwrite): `theme/templates/password.json`
- Delete: `theme/sections/password.liquid`

- [ ] **Step 1: Write `theme/layout/password.liquid` (complete file)**

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ shop.name }} — Lights on soon</title>
    <meta name="description" content="Laissez-Faire. New Orleans luxury workwear. Be there when the lights come on.">
    {% render 'lf-fonts' %}
    {{ 'lf-tokens.css' | asset_url | stylesheet_tag }}
    {{ content_for_header }}
  </head>
  <body>
    {{ content_for_layout }}
  </body>
</html>
```

- [ ] **Step 2: Write `theme/templates/password.json` (complete file)**

```json
{
  "layout": "password",
  "sections": {
    "main": {
      "type": "lf-teaser",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

- [ ] **Step 2.5 (added): Delete the now-orphaned stock section**

First confirm nothing else references it: `grep -r "sections/password\|'password'" theme/`. Expect only unrelated hits (Shopify's built-in `request.page_type == 'password'` check, and locale strings for the password *field* label) — if you find a real reference to the section file itself, stop and investigate before deleting.

```bash
git rm theme/sections/password.liquid
```

- [ ] **Step 3: Theme check**

Run: `shopify theme check --path theme`
Expected: no new offenses; the `OrphanedSnippet` warning on `lf-fonts.liquid` (present since Task 4) should disappear now that `password.liquid` renders it via `{% render 'lf-fonts' %}`.

- [ ] **Step 4: Commit**

```bash
git add theme/layout/password.liquid theme/templates/password.json
git commit -m "Wire teaser section onto themed password page"
```

(Include the Step 2.5 deletion in this same commit.)

### Task 7: Local verification against dev store

**Files:** none (verification only) — requires Task 1 Step 3 (store exists)

- [ ] **Step 1: Start dev server**

Run: `shopify theme dev --path theme --store <store>.myshopify.com` (first run opens browser auth)
Expected: `Preview your theme (http://127.0.0.1:9292)` line prints.

- [ ] **Step 2: Verify teaser page renders**

Open `http://127.0.0.1:9292/password` in the browser and confirm ALL of:
1. Night ground `#0d0d11`; ice-blue script wordmark glows, flickers ONCE, then is steady.
2. Reload → no flicker (sessionStorage guard works).
3. macOS System Settings → Accessibility → Display → Reduce Motion ON → hard reload in a fresh tab → sign appears with NO flicker.
4. At 375px viewport width: no horizontal scroll, form stacks cleanly.
5. Submit a real email → success line "You're on the list. Lights on soon." appears; the address shows under **Customers** in Shopify admin tagged `teaser-list`.

- [ ] **Step 3: Fix anything that failed, re-verify, then commit fixes**

```bash
git add -A && git commit -m "Teaser verification fixes"
```

(Skip the commit if nothing changed.)

### Task 8: Push, protect, go live

**Files:** none (deployment) — OPERATOR steps marked

- [ ] **Step 1: Push theme**

Run: `shopify theme push --path theme --unpublished --theme "laissez-faire-v0.1"`
Expected: upload completes; theme listed in admin → Online Store → Themes.

- [ ] **Step 2 (OPERATOR ACTION):** Admin → Online Store → Themes → publish `laissez-faire-v0.1`. Then Online Store → Preferences → Password protection → ON (trial stores are password-protected by default until a plan is chosen).

- [ ] **Step 3: Verify live**

Open `https://<store>.myshopify.com` in a private window.
Expected: the neon teaser (not Shopify's default password page); email capture works end-to-end.

- [ ] **Step 4 (OPERATOR ACTION, non-blocking):** Install the Klaviyo app from the Shopify App Store and enable customer sync so `teaser-list` customers flow into Klaviyo. Domain purchase/connection is also an operator item (spec §8.1).

- [ ] **Step 5: Merge and tag**

```bash
git checkout master && git merge --no-ff feat/teaser -m "Ship Phase A neon teaser" && git tag v0.1.0-teaser
```

---

## Not in this plan (Phase B, separate plan after teaser ships)

Home page, shop grid, PDP with metafields (`story`, `edition_size`, `drop_accent`), cart drawer, GSAP/Lenis/Barba motion layer, shrine sections, Lighthouse gates. The tokens file, fonts snippet, and masked-asset technique built here are the foundation Phase B extends.

## Self-review notes

- **Spec coverage (Phase A):** teaser page ✓, flicker-once ✓, manifesto line ✓, email capture ✓ (native form + Klaviyo sync, per spec §5), IG link ✓, reduced-motion hard requirement ✓ (tokens CSS + JS guard), night tokens ✓, wordmark-as-supplied-asset ✓ (mask preserves the drawn letterforms; color comes from tokens).
- **Placeholders:** none — every file is complete as written.
- **Consistency:** class names `lf-teaser__*` consistent across section CSS/JS/markup; token names in `lf-tokens.css` match usages in `lf-teaser.liquid` (`--lf-neon-core`, `--lf-neon-halo`, `--lf-panel`, `--lf-muted`, `--lf-ease`); `lf-fonts` snippet name matches `{% render 'lf-fonts' %}`; asset filenames `lf-wordmark.png`/`lf-fleur.png` match `asset_url` references.
