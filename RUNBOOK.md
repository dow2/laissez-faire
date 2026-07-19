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
