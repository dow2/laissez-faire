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
