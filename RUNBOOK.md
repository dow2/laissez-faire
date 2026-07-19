# Runbook — Laissez-Faire Leisure Club

## Drop day (opening the store)

1. Shopify admin → Settings → Payments → activate Shopify Payments.
2. Verify products/prices/inventory in admin (edition sizes: metafield `lfc.edition_size`).
3. Online Store → Preferences → Password protection → OFF.
4. Klaviyo → send the "lights on" campaign to the `teaser-list` segment.
5. Run `node scripts/test-purchase-path.mjs` (browse → PDP → add-to-cart → cart
   verification, automated) against the live domain: `STORE_URL=https://laissezfaireleisureclub.com
   STOREFRONT_PASSWORD=<pw> node scripts/test-purchase-path.mjs` — then finish with a
   manual real checkout (test card) since the script can't exercise payment.
6. **Fast-follow, not a blocker:** re-run Lighthouse mobile perf against the now-public
   home + PDP once traffic is real. As of Phase B2 ship (`v0.3.0-motion`), live-CDN
   samples (via password-bypass cookie) came in below the ≥85 gate — home 53,
   PDP 68, TBT 1.2–2.2s — after the Observer/gesture-drop fallback rung already
   applied. If it's still low post-launch, next rungs to try: defer GSAP/Barba
   off the critical path further (e.g. only load SplitText/ScrollTrigger on
   pages that actually use `data-lf-ignite`), or re-examine whether the full
   vendor set is warranted on every template.

## Content sync (Theme Editor ↔ git)

The merchant edits content (text, images, blocks like lookbook slides or
community partners) in the live theme via **Online Store → Themes →
Customize** — see `docs/CONTENT-GUIDE.md`. Those edits land directly in the
live theme's `templates/*.json` and `config/settings_data.json` — the same
files git owns. **A code push overwrites the live theme with whatever's in
git, silently discarding any Theme Editor edits made since the last push**
unless they're pulled into git first.

**Before every code push to the live theme, pull first:**

```bash
shopify theme pull --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com \
  --only 'templates/*.json' --only 'config/settings_data.json'
git status --short   # review what changed - this is merchant content, not your code
```

- If the diff is empty, nothing was edited since the last push — proceed as normal.
- If there's a diff, commit it **on its own**, separate from any code change,
  so the history stays honest about what's a content edit vs. a code change:

```bash
git add theme/templates theme/config/settings_data.json
git commit -m "content: pull merchant edits from live theme"
```

Then do your code work and push as normal. Scoping the pull to
`templates/*.json` + `config/settings_data.json` only (not `--only` the
whole theme) is deliberate — it pulls exactly what the Theme Editor can
touch and leaves `sections/*.liquid`/`assets/*` alone, so it can never
silently overwrite in-progress code changes with the live theme's
(older) copy of the code.

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
