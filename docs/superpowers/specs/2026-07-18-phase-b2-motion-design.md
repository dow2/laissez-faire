# Laissez-Faire Leisure Club — Phase B2: Signature Motion Layer

**Date:** 2026-07-18
**Status:** Approved (brainstorm with live motion prototypes, 2026-07-18)
**Repo:** `github.com/dow2/laissez-faire` · **Store:** `1xiwxi-yy.myshopify.com` · live theme `#161862975716`
**Builds on:** Phase A spec (2026-07-16), Phase B spec (2026-07-17, B1 shipped as `v0.2.0-store`). Tokens, typography, and the one-easing rule carry forward.

## 1. Scope

The motion polish deferred from B1, with choices locked from live prototypes, plus the remaining vibe-review backlog (all four groups — user opted docs in). Ships as `v0.3.0-motion`. The public teaser page is out of scope and must remain byte-identical in behavior (no Barba on the password page).

## 2. Locked motion decisions (from prototypes)

| Decision | Choice | Key parameters |
|---|---|---|
| Page transition | **C — Electrical Surge** | Leave: stepped flicker-out ~550ms → true-black beat ~150ms → enter: stepped flicker-in ~900ms. Repeat navigations in-session trimmed ~30%. Checkout/external links bypass (full page load). |
| Hover micro | **2 — Single Stutter** | One stepped opacity catch (~450ms) on hover-land, then steady brighter glow. Pure CSS. Buttons + nav links. |
| Scroll arrival | **B — Letter Ignite** | Display headings split to characters; each stutters lit, 55ms stagger, on crossing 55% viewport, once per page view. Total stagger capped ~900ms. Script-font accents get plain opacity ramp (no splitting — ligatures). |
| Cursor follow | **Crest** | Glowing fleur-de-lis trails cursor over footer wordmark. `pointer: fine` only. |
| Slider gestures | **Horizontal only** | Observer adds horizontal swipe/drag (and horizontal wheel) advance to the hero. Vertical scroll is never hijacked. Buttons + autoplay unchanged. |

## 3. Architecture

**The core problem Barba introduces:** Shopify compiles section `{% javascript %}` into a per-page bundle, and DOM swaps orphan element-bound listeners. **Resolution:** LF section behavior migrates out of `{% javascript %}` blocks into one shared asset, `lf-sections.js`, structured as an init registry — `window.LF.init.<name>(root)` — invoked on first load and on every Barba `afterEnter` for the sections present in the new container. Section files keep their markup, `{% stylesheet %}`, and `{% schema %}`; only JS moves. The cart drawer stays document-delegated (already swap-proof) and lives outside the Barba container along with header and footer.

**Files:**
- `lf-motion.js` — Lenis, Barba init + surge transition timelines, reduced-motion switchboard, scroll-to-top + focus-to-main + `document.title` sync on swap, session nav counter for repeat-trim, init-registry dispatch.
- `lf-sections.js` — `LF.init.header/hero/pdp/footerFollow` (registry), migrated from section JS blocks.
- `lf-tokens.css` — hover-buzz and ignite/dim CSS, blackout overlay styles.
- `theme.liquid` — Barba wrapper/container attributes (`<main>` is the container; header-group, footer-group, drawer, blackout overlay outside it), re-added vendored script tags.
- Vendors (pinned, self-hosted): GSAP + ScrollTrigger (already vendored, tags return), **SplitText**, **Observer**, **@barba/core**. All deferred.

## 4. Guardrails

- **Perf gate:** Lighthouse mobile ≥85 perf / ≥90 a11y on home + PDP, re-run at closure. Fallback ladder if vendors break the gate: (1) load the vendor scripts after first paint (injected post-`load` instead of `defer`), (2) drop Observer (buttons/autoplay remain).
- **Reduced motion:** instant page swaps (no surge), headings statically lit (no ignite), no cursor-follow, no buzz (plain glow swell), Lenis off. Fully usable with zero animation.
- **Purchase-path safety:** Barba `prevent` for checkout URLs, `/cart` permalinks to checkout, and any `[data-no-barba]` element; cart drawer state and header count survive swaps by construction.
- **Teaser isolation:** password template keeps its own layout; no Barba, no new scripts.

## 5. Backlog items (riding along)

| ID | Fix |
|---|---|
| P2-001 | Cart fetches check `r.ok` + `.catch`; failures render a muted retry line in the drawer instead of silently breaking |
| P2-002 | Product/variant titles escaped before `innerHTML` interpolation in the drawer |
| P3-001 | Drawer `money()` → `Intl.NumberFormat` driven by `cart.currency` from `/cart.js` |
| P3-003 | PDP variants island emitted via the `json` filter (cents + `Intl` client-side) instead of hand-assembled Liquid strings |
| P3-004 | Header/footer nav links become schema settings (url + label pairs, defaulting to current values) |
| P2-004 | Root `README.md`: project map, dev loop, deploy commands, architecture notes |
| P2-005 | `RUNBOOK.md`: drop-day steps (payments, password flip, Klaviyo), token rotation, rollback (`shopify theme push` from a tag) |

## 6. Ignite coverage

`data-lf-ignite` goes on: featured-story `h2`, collection `h1`, PDP `h1`, story `h1`. Hero headings are excluded (slider-managed, avoids ignite/slide-change interplay). Everything else keeps the existing `data-lf-reveal` fade system.

## 7. Quality gates (closure)

1. `theme check` clean (3-warning baseline).
2. Behind-the-gate checklist: surge on home↔shop↔PDP↔story in both directions; repeat-trim felt; ignite on all four templates; hover stutter on buttons/nav; crest follow in footer; horizontal swipe on hero while vertical scroll stays native; cart add + quantity +/− regression; 375px pass; reduced-motion pass (everything instant, nothing broken); teaser regression (flicker once, Members entry works).
3. Lighthouse gates (§4).
4. Merge to master, tag `v0.3.0-motion`, push live + GitHub (CI green).
