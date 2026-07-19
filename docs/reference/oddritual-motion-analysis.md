# Odd Ritual Golf — Motion & Structure Analysis

*Analyzed 2026-07-18 from live source: full HTML of home / about / contact / shop,
the complete unminified custom motion script (`scripts-2026.js`, 39KB), its
companion stylesheet (`styles-2026.css`, 15KB), and the exported Webflow CSS.
Reference material for Laissez-Faire motion work — this is a direct aesthetic
peer (premium lifestyle apparel, same GSAP/Lenis/Barba stack).*

Site: https://oddritualgolf.com/

---

## 1. Architecture

- **Webflow design → Shopify via the Udesly exporter.** jQuery 3.5.1 +
  `webflow.js` runtime ship with the theme.
- **Zero Webflow-native interactions** (`data-w-id` count is 0 across all
  pages). Every animation is hand-written GSAP.
- **The entire custom motion layer is served from CodeSandbox** in production:
  `https://cty38f.csb.app/scripts-2026.js` + `styles-2026.css`. Versioning is
  by filename year. No SRI, no self-hosting.
- Libraries (all CDN): GSAP 3.12.7 (core, CustomEase, Flip, Observer,
  ScrollTrigger) via jsdelivr, Lenis 1.2.3 via unpkg, `@barba/core` via
  jsdelivr, Lottie 5.12.2, Hammer.js (swipe), SplitType (loaded + initialized
  but **vestigial** — no `[split-it]` elements exist in current markup).
- Type: PP Neue Montreal (variable) + PP Editorial New (italic serif accents).

## 2. The design language

**Unifying motif: the clip-path curtain wipe.** Nearly every reveal is a
`polygon()` clip wipe (in: top-down; out: bottom-up) with a small
counter-parallax (`yPercent` ±10–50) on the content inside the mask. Used for:
preloader, hero slide changes, menu panels, image hover reveals, and the page
transition itself.

**Ease vocabulary** (4 custom eases + one CSS bezier):

| Name | Curve | Used for |
|---|---|---|
| `ease-1` | `M0,0 C0.15,0 0.15,1 1,1` (fast-out soft-land) | **GSAP default** (`gsap.defaults({ease:"ease-1", duration:1})`) |
| `ease-2` | heavily damped decel | Hero slide wipes |
| `ease-3` | `0.65, 0.01, 0.05, 0.99` (strong in-out) | Page transitions, preloader |
| `loaderEase` | bumpy multi-inflection custom curve | Loader accents |
| CSS hovers | `cubic-bezier(0.32, 0.72, 0, 1)` @ 400ms | All CSS-only hover motion |

## 3. Page transitions (Barba)

`sync: true` — both containers animate **simultaneously**, 1s, ease-3:

- **Outgoing:** opacity 1 → 0.4 while sinking (`marginTop 0 → 20vh`).
- **Incoming:** pinned `position: fixed; top: 0` in `barba.hooks.enter`, then
  curtain-wipes open downward (`clip-path` height `0vh → 100vh`) while sliding
  down into place (`marginTop -20vh → 0`), with `clearProps: "all"`.
- **After:** restore `position: relative`, `scrollTop(0)`, then re-run the
  whole script layer — they re-inject `udesly-shopify.min.js` fresh each nav,
  re-init Shopify sections/cart, and re-bind everything via one big
  `globalScripts()` call.

Effect: old page falls away into dimness while the new one unrolls over it
like a window shade. Constant 1s on every nav (no repeat-visit trim — LF's
`pendingTrim` speedup is a differentiator).

**Note for LF:** their `position: fixed` pin of the incoming container is the
mirror-image solution to the two-containers-in-flow geometry bug we fixed in
`lf-motion.js` (we `display:none` the outgoing container). Their approach
enables the sync/overlap look; ours is simpler and safer for measurement code
that runs in `afterEnter`.

## 4. Global chrome behaviors (all pages)

- **First-visit preloader** (sessionStorage-gated, 2s): logo fades in (sine),
  bg panel wipes down, image stack wipes down with a −30% → 0 parallax settle,
  then the whole inner wipes up and away (images drifting +10). 10s after
  first-ever load, the newsletter popup auto-opens.
- **Section-aware nav color:** invisible `[nav-dark]` / `[nav-light]` marker
  sections with `ScrollTrigger.create({start:"top top", end:"bottom top"})`
  toggling a `.dark` class on the nav — the nav recolors to match whatever is
  behind it.
- **Nav hides at footer:** ScrollTrigger at `clamp(top 20%)` adds `.pull-up`
  (`transform: translateY(-100%)`, 300ms CSS).
- **Custom cursor** (gated `(min-width: 992px) and (pointer: fine)`): fixed
  element, `gsap.quickTo` x/y follow; edge detection flips it to the other
  side of the pointer near the right/bottom 10% of the viewport. `[data-cursor]`
  supplies label text; `[data-easteregg]` swaps to a secret alternate label
  *only when the cursor is near the right edge*.
- **Full-screen menu:** staggered bg panels drop from top (`yPercent −101 → 0`,
  stagger 0.1, 0.575s), links drop `yPercent −140 → 0` stagger 0.05, image
  panel clip-wipes with parallax, metadata fades at `<70%`. Close retracts
  upward `expo.out`. Esc support; Lenis stop/start around open state.
- **Hover vocabulary:** rolling text via `text-shadow: 0 -1em currentColor`
  duplicate glyph + `translateY(1em)` on hover (`[h-flip]`, pure CSS);
  left-origin underline `scaleX` sweeps; arrow icons that exit and re-enter.
- **Lenis wiring:** `lenis.on("scroll", ScrollTrigger.update)` +
  `gsap.ticker.add((t) => lenis.raf(t * 1000))` (the canonical GSAP
  integration). Cart list gets `data-lenis-prevent`.

## 5. Per-page breakdown

### Home
1. **Hero slider** — full-bleed, 3 slides ("Explore our First Collection" /
   "A modern expression of heritage" / "Follow us on Instagram").
   Directional clip wipes (forward: new wipes down from top, old clips away at
   bottom; reverse mirrored), each visual counter-parallaxing ±10%. Numbered
   dot nav (01/02/03; active enlarges, siblings dim on hover), arrows, Hammer
   swipe. After each Barba nav the first dot is programmatically clicked.
2. **Dark brand-statement section** (`[nav-dark]`) — "Born from a shared love
   of the game…". Contains **Giving Back**: hovering charity names (Fairways
   to Africa, StartWell Foundation) clip-wipes in a floating photo
   (`.is-giving`). Easter-egg triggers: "242", "running late club".
3. **Split-grid editorial sections** with `data-scroll-overlap` ×4 — pinned
   section slides `yPercent: 50` over 500px of scroll so the next section
   scrolls *up over* it. This is the section-stitching device.
4. **Draggable product marquee** — infinite auto-scroll
   (`gsap.ticker` decrements x, `gsap.utils.wrap(-half, 0)` modifier loops),
   Observer drag with press-scale 0.95, Lenis paused during drag.
5. **Second full-screen slider** (`is-large` lookbook), **community section**,
   **light-theme footer** with the image-follow product list (§ About footer).

### About
1. **About-hero** with modern-CSS hover: hovering the intro copy fades the big
   headline and dims every `[h-fadeout]` on the page via
   `body:has(.about-head_wrap:hover)` — the page "makes room" for reading.
2. Image band + eyebrow; offset editorial images (4.35:2.8 / 4.35:6) with
   `[img-scroll]` parallax ×3 (img 120% height, scrub `yPercent 0 → 20`,
   `clamp()` start/end).
3. **Flickthrough** — hover flip-book: stacked photos cycle `.show` every
   300ms while hovered (500ms auto-cycle on mobile).
4. **Vision section → sticky story stack** — five `sticky-item` panels, each
   `position: sticky` @ 100svh, stacking over one another.
5. **Floating scroll-flip SVGs** ×2 — stacked logo variants flipped through a
   doubled `autoAlpha` sequence scrubbed to scroll, riding a −30% → 15%
   wrapper parallax.
6. **Full-height dark footer** (100dvh) with the site's best flourish — the
   **footer image-follow**: full product list (38 rows) + a preview panel that
   clip-wipes in on list-enter, `quickTo`-tracks cursor Y clamped to list
   bounds, and swaps its image per hovered row. All images preloaded on init.

### Contact
Quietest page by design — a **split-screen sticky composition**: left column
(`contact-imgs_scroll`) is a scrolling image stack; right column
(`contact-info_layout.u-column-6`) is `sticky; top: 0; height: 100vh`, so the
info floats motionless while imagery streams past. One image-hover reveal +
easter eggs + global cursor/nav systems. No forms (contact via links). The
"scroll animation" here is entirely CSS sticky, not GSAP.

### Shop
1. **Intro + product grid** — 40 products with `count-items` auto-numbering
   (JS counts and zero-pads totals), hover overlays per card, and
   `cta-cursor_wrap` ×38: a label pill CSS-sticky at `top: 50svh` that also
   `quickTo`-follows cursor Y within each card block.
2. **Dark section → Pillars** — the site's most memorable beat: a
   ScrollTrigger on the dark section's exit **flips the whole page electric
   blue** (`#050FFF`) — body bg, text colors, nav mix-blend tween 0.2s
   `power2.inOut`, reversed `onLeaveBack`. Inside: "Community / Creativity /
   Craft" with sticky full-height title (`top:0; 100vh`), sticky icon column
   (`top:50%`), `.show` fade reveals, and tuned `data-scroll-overlap-pillar`
   ×2 (start `top 30%`, `yPercent 40`).
3. **Full image band → dark footer.**

## 6. Engineering notes (the honest read)

1. **No teardown, ever.** Each Barba nav re-runs `globalScripts()` wholesale:
   no `ScrollTrigger.kill()`, and `$(window).on("mousemove"/"scroll")`
   handlers stack with every navigation — a genuine listener leak that grows
   per nav. LF's `beforeLeave` kill + `LF.teardown` drain is strictly better.
2. **No `prefers-reduced-motion` handling anywhere** in the custom layer.
3. **Heavy payload:** jQuery + webflow.js + 5 GSAP files + Lenis + Barba +
   Lottie + Hammer + Klaviyo across four CDNs, plus a production dependency on
   CodeSandbox uptime. Would fail the Lighthouse gate LF fights, badly.
4. Desktop gating is done right: `gsap.matchMedia("(min-width: 992px) and
   (pointer: fine)")` wraps all cursor/hover systems.
5. A11y is rough: no focus management in overlays, decorative `h2`s ("01").

## 7. Steal list for Laissez-Faire (value-for-effort order)

1. **Scroll-triggered full-page theme flip** (their blue moment) — an LF
   "lights-flood/neon-surge" body flip would be the single most memorable
   steal.
2. **Section-aware nav recoloring** via invisible ScrollTrigger markers.
3. **Nav pull-up at footer.**
4. **Footer product-list image-follow** — evolve LF's crest-follow into
   per-row product-image swapping.
5. **Clip-path curtain wipes for image reveals** — complement (not replace)
   the electrical-surge language.
6. **Sticky 100svh story stack** for a Story-page expansion.
7. **`[h-flip]` rolling-text hovers** — pure CSS, near-zero cost.
8. **Session-once preloader choreography** for drop day.

Already better in LF: self-hosted pinned vendors, swap teardown,
reduced-motion switchboard, repeat-nav transition trim, leaner JS payload.
