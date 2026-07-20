# Shop Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the shop 8 browsable categories (Hats, Shirts, Hoodies, Jackets, Jeans, Pants, Shorts, Accessories) surfaced as a pill nav on the shop grid, backed by 8 Shopify automated collections and a restructured catalog (6 bundled products → 6 Tee products + 6 new Hoodie products), per `docs/superpowers/specs/2026-07-19-shop-categories-design.md`.

**Architecture:** Three independent layers, built in a safe order so each can be verified before the next depends on it: (1) the theme-side pill nav, written first so it can be verified in its all-"Coming Soon" state before any catalog data changes; (2) 8 automated collections created and published via a one-off Admin API script; (3) the catalog split (rename Tee's variant option, delete its Hoodie variant/image, create 6 new Hoodie products) via a second one-off Admin API script. No PDP or product-template changes are needed — `theme/templates/product.json` and `theme/sections/lf-product.liquid` are already generic and metafield-driven.

**Tech Stack:** Shopify Online Store 2.0 theme (Liquid), Shopify Admin GraphQL API 2025-10 (Node.js one-off scripts, same OAuth client-credentials pattern as `scripts/create-products.mjs`), Shopify CLI.

---

## File structure

- Modify: `theme/sections/lf-shop-grid-v2.liquid` — add the category pill nav (markup + CSS), no schema changes.
- Create: `scripts/create-category-collections.mjs` — one-off script, creates + publishes the 8 automated collections.
- Create: `scripts/split-tee-hoodie-products.mjs` — one-off script, restructures the 6 existing products and creates the 6 new Hoodie products.
- Modify: `docs/CONTENT-GUIDE.md` — note the new category nav and how to add a 9th category later.

---

### Task 1: Category pill nav on the shop grid

**Files:**
- Modify: `theme/sections/lf-shop-grid-v2.liquid`

- [ ] **Step 1: Create the branch**

```bash
cd /Users/dow/laissez-faire
git checkout master
git pull --ff-only
git checkout -b feat/shop-categories
```

- [ ] **Step 2: Add the pill nav markup**

In `theme/sections/lf-shop-grid-v2.liquid`, insert this block right after the closing `</header>` tag (currently line 6) and before `{% paginate collection.products by 24 %}` (currently line 7):

```liquid
  <nav class="lf-shopv2__catnav" aria-label="Shop categories">
    <a class="lf-shopv2__catlink{% if collection.handle == 'all' %} is-active{% endif %}" href="{{ routes.all_products_collection_url }}">All</a>
    {% liquid
      assign lf_categories = "Hats|hats,Shirts|shirts,Hoodies|hoodies,Jackets|jackets,Jeans|jeans,Pants|pants,Shorts|shorts,Accessories|accessories" | split: ','
    %}
    {% for lf_cat in lf_categories %}
      {% liquid
        assign lf_cat_parts = lf_cat | split: '|'
        assign lf_cat_label = lf_cat_parts[0]
        assign lf_cat_handle = lf_cat_parts[1]
        assign lf_cat_collection = collections[lf_cat_handle]
        assign lf_cat_live = false
        if lf_cat_collection and lf_cat_collection.products_count > 0
          assign lf_cat_live = true
        endif
      %}
      {% if lf_cat_live %}
        <a class="lf-shopv2__catlink{% if collection.handle == lf_cat_handle %} is-active{% endif %}" href="{{ lf_cat_collection.url }}">{{ lf_cat_label }}</a>
      {% else %}
        <span class="lf-shopv2__catlink is-disabled">{{ lf_cat_label }} — Coming Soon</span>
      {% endif %}
    {% endfor %}
  </nav>
```

The category list is deliberately a hardcoded Liquid pseudo-array (`"Label|handle,Label|handle,..."` split on `,` then `|`), not a schema setting — these 8 categories are a fixed taxonomy, not merchant-editable content (see the spec's §3d). `lf_cat_live` is computed from `collections[handle].products_count`, so a category with no matching collection yet (before Task 2 runs) or no products yet (before Task 3 runs) correctly falls into the disabled "Coming Soon" branch — nonexistent collections resolve to `nil` in Liquid, which fails the `> 0` check safely rather than erroring.

- [ ] **Step 3: Add the pill nav styles**

In the same file's `{% stylesheet %}` block, add these rules directly after the existing `.lf-shopv2__stamp` rule (currently line 57):

```css
.lf-shopv2__catnav { display: flex; flex-wrap: wrap; gap: .5rem 1.1rem; margin: -1rem 0 2.4rem; }
.lf-shopv2__catlink { color: var(--lf-muted); font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; text-decoration: none; padding-bottom: .2rem; border-bottom: 1px solid transparent; }
.lf-shopv2__catlink.is-active { color: var(--lf-body-text); border-bottom-color: var(--lf-neon-core); }
.lf-shopv2__catlink.is-disabled { color: #3a3a42; cursor: default; }
```

- [ ] **Step 4: Validate the Liquid**

```bash
cd /Users/dow/laissez-faire/theme && shopify theme check
```

Expected: same baseline as before this change — 0 errors, only the 3 pre-existing `RemoteAsset` warnings in `snippets/lf-fonts.liquid`. No new offenses in `sections/lf-shop-grid-v2.liquid`.

- [ ] **Step 5: Preview on the local dev-theme proxy**

```bash
cd /Users/dow/laissez-faire
shopify theme dev --path theme --store 1xiwxi-yy.myshopify.com --theme "161862975716"
```

Open `http://127.0.0.1:9292/collections/all`. Verify by eye:
- A pill row renders below the "All Pieces" header: All, Hats, Shirts, Hoodies, Jackets, Jeans, Pants, Shorts, Accessories.
- "All" is visually active (underlined). All 8 categories render as disabled grey text reading "`<Name>` — Coming Soon" (none are links yet — Task 2/3 haven't run, so none of the 8 collections exist).
- No console errors.

Stop the dev server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add theme/sections/lf-shop-grid-v2.liquid
git commit -m "feat: add category pill nav to shop grid"
```

---

### Task 2: Create and publish the 8 category collections

**Files:**
- Create: `scripts/create-category-collections.mjs`

- [ ] **Step 1: Write the script**

Create `scripts/create-category-collections.mjs`:

```javascript
#!/usr/bin/env node
/* Creates the 8 Shop Categories as automated collections on 1xiwxi-yy.myshopify.com
   via Admin GraphQL (rule: Product type equals <Category>), then publishes each to
   the Online Store sales channel — collections are unpublished by default.
   Idempotent-ish: skips any collection whose handle already exists.
   Auth: OAuth client credentials grant (Dev Dashboard app `lf-catalog-loader`),
   same pattern as scripts/create-products.mjs. */
import { execSync } from 'node:child_process';

const SHOP = '1xiwxi-yy.myshopify.com';
const API = `https://${SHOP}/admin/api/2025-10/graphql.json`;
const CLIENT_ID = '1c05c65814060a190372cffaa20ba146';
const CLIENT_SECRET = execSync('security find-generic-password -a lf -s lf-shopify-client-secret -w', { encoding: 'utf8' }).trim();

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const watchdog = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout after ${timeoutMs}ms: ${url}`);
    throw err;
  } finally {
    clearTimeout(watchdog);
  }
}

async function getAccessToken() {
  const res = await fetchWithTimeout(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  }, 15000);
  if (!res.ok) throw new Error(`client credentials grant failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}
const TOKEN = await getAccessToken();

async function gql(query, variables) {
  const res = await fetchWithTimeout(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  }, 15000);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const CATEGORIES = [
  { title: 'Hats', handle: 'hats' },
  { title: 'Shirts', handle: 'shirts' },
  { title: 'Hoodies', handle: 'hoodies' },
  { title: 'Jackets', handle: 'jackets' },
  { title: 'Jeans', handle: 'jeans' },
  { title: 'Pants', handle: 'pants' },
  { title: 'Shorts', handle: 'shorts' },
  { title: 'Accessories', handle: 'accessories' },
];

async function exists(handle) {
  const d = await gql(`query($h: String!) { collectionByHandle(handle: $h) { id } }`, { h: handle });
  return Boolean(d.collectionByHandle);
}

async function getOnlineStorePublicationId() {
  const d = await gql(`query { publications(first: 10) { nodes { id name } } }`, {});
  const nodes = d.publications.nodes;
  const onlineStore = nodes.find(n => n.name === 'Online Store');
  if (!onlineStore) throw new Error(`Online Store publication not found among: ${JSON.stringify(nodes)}`);
  return onlineStore.id;
}

async function createCollection(cat, publicationId) {
  if (await exists(cat.handle)) { console.log(`SKIP ${cat.title} (handle exists)`); return; }

  const d = await gql(`
    mutation($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle }
        userErrors { field message }
      }
    }`, {
    input: {
      title: cat.title,
      handle: cat.handle,
      ruleSet: {
        appliedDisjunctively: false,
        rules: [{ column: 'TYPE', relation: 'EQUALS', condition: cat.title }],
      },
    },
  });
  const errs = d.collectionCreate.userErrors;
  if (errs.length) throw new Error(`${cat.title}: ${JSON.stringify(errs)}`);
  const collectionId = d.collectionCreate.collection.id;

  const pub = await gql(`
    mutation($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`, { id: collectionId, input: [{ publicationId }] });
  const pubErrs = pub.publishablePublish.userErrors;
  if (pubErrs.length) throw new Error(`${cat.title} publish: ${JSON.stringify(pubErrs)}`);

  console.log(`CREATED + PUBLISHED ${cat.title} (${cat.handle})`);
}

const publicationId = await getOnlineStorePublicationId();
for (const cat of CATEGORIES) await createCollection(cat, publicationId);
console.log('Done.');
```

- [ ] **Step 2: Run the script**

```bash
cd /Users/dow/laissez-faire
node scripts/create-category-collections.mjs
```

Expected output: 8 lines reading `CREATED + PUBLISHED <Category> (<handle>)`, then `Done.`. If it prints `Online Store publication not found among: [...]`, inspect the printed list and adjust the `name === 'Online Store'` match in `getOnlineStorePublicationId` to whatever name is actually listed, then re-run (the script is idempotent — already-created collections are skipped).

- [ ] **Step 3: Verify via the Admin API**

```bash
cd /Users/dow/laissez-faire
node -e '
import("child_process").then(async ({execSync}) => {
  const CLIENT_ID = "1c05c65814060a190372cffaa20ba146";
  const CLIENT_SECRET = execSync("security find-generic-password -a lf -s lf-shopify-client-secret -w", { encoding: "utf8" }).trim();
  const SHOP = "1xiwxi-yy.myshopify.com";
  const tokenRes = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" })
  });
  const { access_token } = await tokenRes.json();
  const q = `{ collections(first: 20) { nodes { title handle productsCount { count } } } }`;
  const res = await fetch(`https://${SHOP}/admin/api/2025-10/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": access_token },
    body: JSON.stringify({ query: q })
  });
  console.log(JSON.stringify(await res.json(), null, 2));
});
'
```

Expected: 8 new collections listed (`hats`, `shirts`, `hoodies`, `jackets`, `jeans`, `pants`, `shorts`, `accessories`), each with `productsCount.count: 0` (correct — Task 3 hasn't run yet), plus the pre-existing `frontpage` collection.

- [ ] **Step 4: Commit**

```bash
git add scripts/create-category-collections.mjs
git commit -m "feat: script to create and publish the 8 shop category collections"
```

---

### Task 3: Split the catalog into Tee + Hoodie products

**Files:**
- Create: `scripts/split-tee-hoodie-products.mjs`

- [ ] **Step 1: Write the script**

Create `scripts/split-tee-hoodie-products.mjs`:

```javascript
#!/usr/bin/env node
/* Splits each of the 6 Drop 001 products (which today bundle Tee — Black /
   Tee — White / Hoodie — Grey as variants of one product) into two products:
   the existing product restructured to Tee-only (option renamed Garment->Color,
   Hoodie — Grey variant + image removed, productType set to "Shirts"), and a
   brand-new Hoodie product (productType "Hoodies"). Run scripts/create-category-
   collections.mjs first so productType assignment actually populates a collection.
   Auth: OAuth client credentials grant (Dev Dashboard app `lf-catalog-loader`),
   same pattern as scripts/create-products.mjs. Not safely re-runnable mid-failure:
   if this errors partway through a product, inspect that product in the Shopify
   admin before re-running (the per-product Hoodie-creation step is skipped if the
   handle already exists, but the Tee-restructuring steps are not separately guarded). */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SHOP = '1xiwxi-yy.myshopify.com';
const API = `https://${SHOP}/admin/api/2025-10/graphql.json`;
const CLIENT_ID = '1c05c65814060a190372cffaa20ba146';
const CLIENT_SECRET = execSync('security find-generic-password -a lf -s lf-shopify-client-secret -w', { encoding: 'utf8' }).trim();

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const watchdog = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout after ${timeoutMs}ms: ${url}`);
    throw err;
  } finally {
    clearTimeout(watchdog);
  }
}

async function getAccessToken() {
  const res = await fetchWithTimeout(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  }, 15000);
  if (!res.ok) throw new Error(`client credentials grant failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}
const TOKEN = await getAccessToken();
const IMG_DIR = path.join(import.meta.dirname, 'product-images');

async function gql(query, variables) {
  const res = await fetchWithTimeout(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  }, 15000);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function stagedUpload(filename) {
  const data = await gql(`
    mutation($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`, { input: [{ filename, mimeType: 'image/jpeg', httpMethod: 'POST', resource: 'IMAGE' }] });
  const t = data.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  t.parameters.forEach(p => form.append(p.name, p.value));
  form.append('file', new Blob([readFileSync(path.join(IMG_DIR, filename))], { type: 'image/jpeg' }), filename);
  const up = await fetchWithTimeout(t.url, { method: 'POST', body: form }, 30000);
  if (!up.ok) throw new Error(`upload failed for ${filename}: ${up.status}`);
  return t.resourceUrl;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRODUCTS = [
  { slug: 'casamigo',   title: 'Casamigo',     story: 'Friends of the house — good company, kept forever.' },
  { slug: 'fluerdelis', title: 'Fleur-de-Lis', story: "The city's oldest mark, drawn in tube light." },
  { slug: 'magnolia',   title: 'Magnolia',     story: 'The state flower, blooming after dark.' },
  { slug: 'maria',      title: 'Maria',        story: 'Our Lady in blue neon — protection for the ones who move at night.' },
  { slug: 'sig',        title: 'Signature',    story: 'The name, signed in light. Effortless excellence.' },
  { slug: 'skull',      title: 'Skull',        story: "Kill 'em dead, needle & thread." },
];

async function findHoodie(slug) {
  const d = await gql(`query($h: String!) { productByHandle(handle: $h) { id } }`, { h: `${slug}-hoodie` });
  return d.productByHandle ? d.productByHandle.id : null;
}

// productSet does not publish newly-created products to any sales channel —
// same gap already found and fixed for collections in create-category-
// collections.mjs. Idempotent (publishing an already-published resource is a
// no-op), so it's safe to call unconditionally, including on a skip-creation
// re-run, which is why createHoodieProduct calls this even when the handle
// already existed.
async function getOnlineStorePublicationId() {
  const d = await gql(`query { publications(first: 10) { nodes { id name } } }`, {});
  const onlineStore = d.publications.nodes.find(n => n.name === 'Online Store');
  if (!onlineStore) throw new Error(`Online Store publication not found among: ${JSON.stringify(d.publications.nodes)}`);
  return onlineStore.id;
}

async function publishToOnlineStore(productId, publicationId) {
  const pub = await gql(`
    mutation($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`, { id: productId, input: [{ publicationId }] });
  const pubErrs = pub.publishablePublish.userErrors;
  if (pubErrs.length) throw new Error(`publish ${productId}: ${JSON.stringify(pubErrs)}`);
}

async function restructureTeeProduct(p) {
  const d = await gql(`
    query($h: String!) {
      productByHandle(handle: $h) {
        id
        productType
        options { id name optionValues { id name } }
        media(first: 10) { nodes { id alt } }
      }
    }`, { h: p.slug });
  const product = d.productByHandle;
  if (!product) throw new Error(`Tee product not found for handle ${p.slug} — has create-products.mjs been run?`);

  // Each of the three restructuring concerns below (option/value rename+delete,
  // productType, media cleanup) independently re-checks its own precondition
  // against the product's CURRENT state — not against each other — so a crash
  // partway through a prior run can never permanently strand any one of them.
  const garmentOption = product.options.find(o => o.name === 'Garment');
  if (garmentOption) {
    const blackValue = garmentOption.optionValues.find(v => v.name === 'Tee — Black');
    const whiteValue = garmentOption.optionValues.find(v => v.name === 'Tee — White');
    const hoodieValue = garmentOption.optionValues.find(v => v.name === 'Hoodie — Grey');
    if (!blackValue || !whiteValue || !hoodieValue) {
      throw new Error(`${p.title}: "Garment" option found but missing one of Tee — Black / Tee — White / Hoodie — Grey`);
    }

    const optUpdate = await gql(`
      mutation($productId: ID!, $option: OptionUpdateInput!, $optionValuesToUpdate: [OptionValueUpdateInput!], $optionValuesToDelete: [ID!], $variantStrategy: ProductOptionUpdateVariantStrategy) {
        productOptionUpdate(productId: $productId, option: $option, optionValuesToUpdate: $optionValuesToUpdate, optionValuesToDelete: $optionValuesToDelete, variantStrategy: $variantStrategy) {
          userErrors { field message }
        }
      }`, {
      productId: product.id,
      option: { id: garmentOption.id, name: 'Color' },
      optionValuesToUpdate: [
        { id: blackValue.id, name: 'Black' },
        { id: whiteValue.id, name: 'White' },
      ],
      optionValuesToDelete: [hoodieValue.id],
      variantStrategy: 'MANAGE',
    });
    const optErrs = optUpdate.productOptionUpdate.userErrors;
    if (optErrs.length) throw new Error(`${p.title} option update: ${JSON.stringify(optErrs)}`);

    console.log(`RESTRUCTURED ${p.title} option -> Color (Black/White), Hoodie variant removed`);
  } else {
    console.log(`SKIP option restructure for ${p.title} (no "Garment" option — already split?)`);
  }

  if (product.productType !== 'Shirts') {
    const typeUpdate = await gql(`
      mutation($product: ProductUpdateInput!) {
        productUpdate(product: $product) { userErrors { field message } }
      }`, { product: { id: product.id, productType: 'Shirts' } });
    const typeErrs = typeUpdate.productUpdate.userErrors;
    if (typeErrs.length) throw new Error(`${p.title} type update: ${JSON.stringify(typeErrs)}`);
    console.log(`  set productType Shirts for ${p.title}`);
  } else {
    console.log(`  (productType already Shirts for ${p.title})`);
  }

  const hoodieMedia = product.media.nodes.find(m => m.alt === `Hoodie — Grey — ${p.title}`);
  if (hoodieMedia) {
    const delMedia = await gql(`
      mutation($mediaIds: [ID!]!, $productId: ID!) {
        productDeleteMedia(mediaIds: $mediaIds, productId: $productId) { mediaUserErrors { field message } }
      }`, { mediaIds: [hoodieMedia.id], productId: product.id });
    const delErrs = delMedia.productDeleteMedia.mediaUserErrors;
    if (delErrs.length) throw new Error(`${p.title} media delete: ${JSON.stringify(delErrs)}`);
    console.log(`  removed "Hoodie — Grey — ${p.title}" media from ${p.title}`);
  } else {
    console.log(`  (no "Hoodie — Grey — ${p.title}" media found to remove — already cleaned up or never uploaded)`);
  }

  return product.id;
}

async function createHoodieProduct(p, publicationId) {
  const existingId = await findHoodie(p.slug);
  if (existingId) {
    console.log(`SKIP Hoodie for ${p.title} (handle exists)`);
    await publishToOnlineStore(existingId, publicationId);
    console.log(`  ensured ${p.title} Hoodie published to Online Store`);
    return;
  }

  const url = await stagedUpload(`${p.slug}-greyhood.jpg`);
  const variants = SIZES.map(s => ({ price: '150.00', optionValues: [{ optionName: 'Size', name: s }] }));

  const d = await gql(`
    mutation($input: ProductSetInput!) {
      productSet(input: $input, synchronous: true) {
        product { id handle variants(first: 20) { nodes { id title } } }
        userErrors { field message }
      }
    }`, {
    input: {
      title: `${p.title} Hoodie`,
      handle: `${p.slug}-hoodie`,
      status: 'ACTIVE',
      tags: ['drop-001'],
      descriptionHtml: `<p>Heavyweight construction, puff-print front graphic, chain-stitched crest. Cut roomy through the chest — New Orleans proportions.</p>`,
      productOptions: [{ name: 'Size', values: SIZES.map(s => ({ name: s })) }],
      variants,
      files: [{ originalSource: url, alt: `Hoodie — Grey — ${p.title} Hoodie`, contentType: 'IMAGE' }],
      metafields: [
        { namespace: 'lfc', key: 'story', type: 'multi_line_text_field', value: p.story },
        { namespace: 'lfc', key: 'edition_size', type: 'number_integer', value: '150' },
        { namespace: 'lfc', key: 'drop_accent', type: 'color', value: '#9fd8ff' },
      ],
    },
  });
  const errs = d.productSet.userErrors;
  if (errs.length) throw new Error(`${p.title} Hoodie: ${JSON.stringify(errs)}`);
  const newProductId = d.productSet.product.id;

  const typeUpdate = await gql(`
    mutation($product: ProductUpdateInput!) {
      productUpdate(product: $product) { userErrors { field message } }
    }`, { product: { id: newProductId, productType: 'Hoodies' } });
  const typeErrs = typeUpdate.productUpdate.userErrors;
  if (typeErrs.length) throw new Error(`${p.title} Hoodie type update: ${JSON.stringify(typeErrs)}`);

  await publishToOnlineStore(newProductId, publicationId);

  console.log(`CREATED ${p.title} Hoodie — ${d.productSet.product.variants.nodes.length} variants`);
}

const publicationId = await getOnlineStorePublicationId();
for (const p of PRODUCTS) {
  await restructureTeeProduct(p);
  await createHoodieProduct(p, publicationId);
}
console.log('Done.');
```

- [ ] **Step 2: Run the script**

```bash
cd /Users/dow/laissez-faire
node scripts/split-tee-hoodie-products.mjs
```

Expected output: for each of the 6 graphics, a `RESTRUCTURED <Title> option -> Color (Black/White), Hoodie variant removed` line, then a `  set productType Shirts for <Title>` line, then a media-cleanup line (`  removed "Hoodie — Grey — <Title>" media from <Title>`), then a `CREATED <Title> Hoodie — 5 variants` line (24 lines total), then `Done.`.

- [ ] **Step 3: Verify via the Admin API**

```bash
cd /Users/dow/laissez-faire
node -e '
import("child_process").then(async ({execSync}) => {
  const CLIENT_ID = "1c05c65814060a190372cffaa20ba146";
  const CLIENT_SECRET = execSync("security find-generic-password -a lf -s lf-shopify-client-secret -w", { encoding: "utf8" }).trim();
  const SHOP = "1xiwxi-yy.myshopify.com";
  const tokenRes = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" })
  });
  const { access_token } = await tokenRes.json();
  const q = `{
    products(first: 20) { nodes { title handle productType tags options { name optionValues { name } } } }
    collections(first: 20) { nodes { title handle productsCount { count } } }
  }`;
  const res = await fetch(`https://${SHOP}/admin/api/2025-10/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": access_token },
    body: JSON.stringify({ query: q })
  });
  console.log(JSON.stringify(await res.json(), null, 2));
});
'
```

Expected:
- 12 products total. 6 with `productType: "Shirts"`, options `Color` (`Black`, `White`) + `Size` (5 values). 6 with `productType: "Hoodies"` and title ending " Hoodie", options just `Size` (5 values).
- `shirts` collection `productsCount.count: 6`, `hoodies` collection `productsCount.count: 6`. The other 6 category collections still `0`.

- [ ] **Step 4: Verify product codes are distinct**

`theme/sections/lf-product.liquid` (the PDP) does not render `lf-code` — that snippet only appears in the shop grid (`lf-shopv2__code`) and the footer (`lf-footer__pcode`), not on product pages. Verify there instead:

```bash
cd /Users/dow/laissez-faire/theme && shopify theme dev --path . --store 1xiwxi-yy.myshopify.com --theme "161862975716"
```

Open `http://127.0.0.1:9292/collections/shirts` and `http://127.0.0.1:9292/collections/hoodies`. Find Casamigo's card on each page and confirm the code stamp reads `(LF_CASAMIGO)` on the Tee and `(LF_CASAMIGO_H)` on the Hoodie — different values, confirming the handle-derived fallback code produces distinct codes with no `lfc.code` metafield needed. **Known exception, not a regression to chase down:** Fleur-de-Lis's Tee and Hoodie both render `(LF_FLUERDELIS)` — identical. This is a pre-existing bug in `theme/snippets/lf-code.liquid`'s `truncate: 10, ''` logic (the 10-character base handle `fluerdelis` alone already exhausts the truncation budget, so the `-hoodie` suffix's `_H` never survives), not something this task introduced or is responsible for fixing — note it as a follow-up.

- [ ] **Step 5: Full shop nav verification**

Still on the dev-theme proxy, check:
- `http://127.0.0.1:9292/collections/all` — pill nav shows Shirts and Hoodies as live links (no longer "Coming Soon"); the other 6 still read "Coming Soon". Grid shows all 12 products.
- `http://127.0.0.1:9292/collections/shirts` — Shirts pill active/underlined, grid shows exactly the 6 Tee products.
- `http://127.0.0.1:9292/collections/hoodies` — Hoodies pill active/underlined, grid shows exactly the 6 Hoodie products.
- `http://127.0.0.1:9292/collections/hats` — page renders without error, Shopify's default empty-collection state in the grid, pill nav still shows Hats correctly greyed/disabled (a category page can render even while its own pill is disabled — this is expected, not a bug).
- No console errors on any of the above.

Stop the dev server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add scripts/split-tee-hoodie-products.mjs
git commit -m "feat: script to split catalog into Tee and Hoodie products by category"
```

---

### Task 4: Document the category system

**Files:**
- Modify: `docs/CONTENT-GUIDE.md`

- [ ] **Step 1: Add a Categories bullet to the Shop page section**

In `docs/CONTENT-GUIDE.md`, find this exact text (lines 96–98):

```markdown
- **Shop grid** — no settings here; it lists every product in your
  catalog automatically, with live price/image/title. To change what's in
  it, edit your products (Admin → Products) — not this section.
```

Using the Edit tool, replace it with:

```markdown
- **Shop grid** — no settings here; it lists every product in your
  catalog automatically, with live price/image/title. To change what's in
  it, edit your products (Admin → Products) — not this section.
- **Categories** — the pill row above the grid (Hats, Shirts, Hoodies,
  Jackets, Jeans, Pants, Shorts, Accessories) is fixed in
  `theme/sections/lf-shop-grid-v2.liquid`, not merchant-editable via the
  Theme Editor. A category shows live (as a link) once its Shopify
  collection has at least one product; otherwise it renders greyed with a
  "Coming Soon" label automatically — no theme edit needed to activate a
  category, just tag a product with that `Product type` in the admin. To
  add a 9th category: create a new automated collection in admin (rule:
  `Product type` equals `<name>`), publish it to Online Store, then add
  one `Label|handle` entry to the `lf_categories` list in
  `lf-shop-grid-v2.liquid`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/CONTENT-GUIDE.md
git commit -m "docs: document the shop category pill nav"
```

---

## Shipping

After all 4 tasks are committed and verified, merge to `master` and push to the live theme, following the established phase-ship pattern:

```bash
cd /Users/dow/laissez-faire
git checkout master
git merge --no-ff feat/shop-categories -m "merge: Shop categories (pill nav + 8 collections + Tee/Hoodie catalog split)"
cd theme && shopify theme check
cd ..
shopify theme push --path theme --theme "161862975716" --store 1xiwxi-yy.myshopify.com --allow-live
git push
git branch -d feat/shop-categories
```

No version tag is strictly required, but given this is a real structural catalog change (not a pure content edit), tagging is reasonable: `git tag v0.4.4-categories && git push --tags`.
