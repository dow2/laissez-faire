# Laissez-Faire — E-Commerce Site Design

**Date:** 2026-07-16
**Status:** Approved (brainstorm session with visual companion, 2026-07-16)
**Repo:** `/Users/dow/laissez-faire`

## 1. Brand context

Laissez-Faire is a luxury streetwear/workwear label rooted in New Orleans culture, seen through French, Spanish, African American, and Japanese lenses. Interpretation of the name: "effortless excellence through uncompromising craftsmanship." Philosophy: craftsmanship over hype, heritage over trends, culture over logos. Peer set: Kapital, Visvim, Aimé Leon Dore, Fear of God, Denim Tears, Bode — without being derivative.

The existing identity (canonical assets in `/Users/dow/Documents/LF/`, 148 files) is **neon**: a retro script "Laissez Faire" wordmark with a fleur-de-lis tail rendered as glowing sign variants (ice blue, purple/cyan, red/cream with stars), a blue/green neon Virgin of Guadalupe, a multicolor neon sugar skull with crosses and a gold fleur-de-lis, an interlocking varsity LF monogram (green/yellow neon), a royal-blue varsity jacket design ("93", "PAY TO PLAY"), and one quiet terracotta-on-cream LF crest. Supporting lifestyle imagery (Midjourney: second lines, Black Masking Indians) lives in `~/Documents/Desktop - Operation's MacBook Pro (2) - 2/Useable Filler Images/`.

**Chosen design direction: "Neon Nights"** — the whole site is the sign: near-black ground, neon identity as the interface. Chosen over a cream "day" storefront with neon reserved for drops (Day & Night) and a cream-only "Daylight Chapel."

Structural reference: teardown of oddritualgolf.com (2026-07-16) — Shopify + Webflow-via-Udesly theme with a GSAP/Lenis/Barba motion layer. We reproduce the *outcome* (bespoke editorial storefront on Shopify checkout) without the jank (no Webflow export, no jQuery, no CDN/CodeSandbox-hosted critical assets).

## 2. Visual system

### Ground and color

| Token | Value | Role |
|---|---|---|
| `--ground` | `#0d0d11` | Page background (night) |
| `--panel` | `#14141a` | Raised cards/panels |
| `--body-text` | `#c9c9d4` | Body copy — **never glowed** |
| `--neon-ice` | `#9fd8ff` core / `#4aa8ff` halo | House neon: wordmark, primary display |
| Drop accents | red/cream `#c8102e`/`#fff3dd`; green/yellow `#2fbf71`/`#f5f0a0`; purple/cyan `#8b3df0`/`#9fd8ff` | Per-collection sign color, set by product metafield |
| `--seal` | terracotta `#b06a5a` on cream `#f5edd8` | Crest use only: footer seal, packing slips, e-mail footer |

Rules: glow effects are reserved for display type and iconography. Body/UI text renders flat for legibility. Product imagery sits inside defined panels; photography direction is moody-on-dark or neutral-ground inside framed "shrine" panels so garments stay readable on the night ground.

### Typography ("Varsity & Script")

- **Display / product names:** collegiate varsity block (launch: Graduate via Google Fonts; swappable for a licensed premium block later — typography loads through one token layer so the swap is config-level).
- **Culture lines / flourishes:** sign-painter script (launch candidate: Kaushan Script-class; the actual brand wordmark is always the supplied asset, never re-typeset).
- **Body / specs / UI:** clean grotesque (Archivo), weights 300–600.

### Iconography

- Vector fleur-de-lis (`fluerdelis-updated.ai` exports) as UI punctuation: list bullets, section dividers, cart badge.
- Guadalupe and sugar skull are **shrine moments**: full-bleed section artwork, max one each per page.
- Signature phrases ("Won't Bow Down, Don't Know How"; "Kill 'Em Dead, Needle & Thread"; "Big Chief with the Golden Crown"; "Effortless Excellence") appear as script accents, not headlines.

## 3. Pages and information architecture

### Phase A — Teaser (ships first)

Shopify password page, fully custom-themed:
- Black room; neon wordmark flicker-on animation (tube-by-tube).
- One manifesto line in script.
- Klaviyo email capture ("Be there when the lights come on").
- Instagram link. Nothing else.

### Phase B — Full store (behind the teaser until launch)

- **Home:** sign hero → current-drop story → featured pieces → shrine/manifesto section → culture strip (second-line imagery) → email block → oversized footer wordmark.
- **Shop:** single collection grid at launch (`/collections/all`), drop-tagged.
- **Product page:** varsity-block title, price, story paragraph (metafield), details/materials accordion, edition count, size selector, add-to-cart (or "Notify me" while gated).
- **Story/manifesto page:** the refined manifesto, pillars, imagery.
- **Cart:** drawer, not a page.
- **Nav:** Shop, Story, cart. Deliberately minimal.

## 4. Motion system

- **Preloader:** neon flicker-on of the wordmark, once per session (sessionStorage), skipped thereafter.
- **Scroll:** Lenis smooth scroll; GSAP ScrollTrigger reveals where glow intensity ramps as sections enter the viewport.
- **Page transitions:** Barba.js "lights out / lights on" wipe; Shopify cart/section state re-initialized on each transition.
- **Micro:** electrical buzz-flicker on link/button hover; single shared easing curve site-wide (Odd Ritual lesson: one easing family is why it feels expensive).
- **Accessibility:** full `prefers-reduced-motion` support — static glow, no flicker (also protects photosensitive visitors); this is a hard requirement, not polish.

## 5. Commerce architecture

- **Platform:** Shopify Basic (~$39/mo).
- **Theme:** custom Online Store 2.0 theme from Shopify's Skeleton starter — Liquid + vanilla CSS/JS, JSON templates, sections with schema settings.
- **Product model:** tags per drop; metafields: `story` (rich text), `edition_size` (integer), `drop_accent` (color) — a new collection re-skins the neon without code changes.
- **Email:** Klaviyo free tier — teaser capture list + later "notify me"/back-in-stock flows.
- **Checkout:** stock Shopify checkout + Shop Pay; not customized.
- **Vendored libs in theme assets (self-hosted, pinned):** GSAP + ScrollTrigger (free since Webflow acquisition), Lenis, Barba.js. No jQuery. No external runtime dependencies for critical CSS/JS.

## 6. Build and quality

- **Dev loop:** Shopify CLI `shopify theme dev` hot-reload against a development store.
- **Quality gates:** `theme-check` clean; Lighthouse (mobile) performance ≥ 85 and accessibility ≥ 90 on home/PDP before launch; manual flows — teaser email capture, browse → PDP → cart → checkout, reduced-motion pass, 375px viewport pass.
- **Repo:** git from day one; `.superpowers/` gitignored; brand-asset exports copied into `assets/` as optimized web formats (SVG where vector exists, otherwise compressed PNG/WebP with transparent or night backgrounds).

## 7. Non-goals (launch)

- No journal/blog, no multi-collection nav, no lookbook page (culture strip on Home covers it), no headless stack, no custom checkout, no i18n/multi-currency beyond Shopify defaults, no customer accounts.

## 8. Open items (not blockers for the teaser)

1. **Domain** — purchase/transfer status unknown; needed before teaser goes public.
2. **Font licensing** — Graduate/Kaushan ship free at launch; decide later whether to license premium block/script faces.
3. **Product photography** — direction defined (moody-on-dark / neutral in shrine panels); shoot happens when samples land.
4. **Asset conversion** — neon artwork needs clean-edge exports (current PNGs have baked backgrounds; PSD/AI sources exist for re-export).

## 9. Success criteria

- Teaser live on the Shopify password page collecting Klaviyo emails.
- Full theme passes quality gates and launches by flipping the password off — no migration, same domain, same repo.
- A new drop is stageable via tags + metafields with zero theme-code changes.
