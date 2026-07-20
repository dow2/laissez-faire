#!/usr/bin/env node
/* Splits each of the 6 Drop 001 products (which today bundle Tee — Black /
   Tee — White / Hoodie — Grey as variants of one product) into two products:
   the existing product restructured to Tee-only (option renamed Garment->Color,
   values renamed Tee — Black/Tee — White -> Black/White, Hoodie — Grey variant +
   image removed, productType set to "Shirts"), and a brand-new Hoodie product
   (productType "Hoodies"). Run scripts/create-category-collections.mjs first so
   productType assignment actually populates a collection.
   Auth: OAuth client credentials grant (Dev Dashboard app `lf-catalog-loader`),
   same pattern as scripts/create-products.mjs. Not safely re-runnable mid-failure
   for every step: the per-product Hoodie-creation step is skipped if the handle
   already exists, and within Tee-restructuring, the option/value rename+delete,
   the productType update, and the media cleanup each independently re-check
   their own precondition against the product's current state (so a crash
   between any two of them on one product doesn't strand the others or block a
   retry) — but if a mutation throws mid-product, inspect that product in the
   Shopify admin before re-running. NOTE: this guard set does not cover every
   historical state — the 6 live Drop-001 products briefly had their Color
   option renamed but not its values (a bug in an earlier version of this
   script), which was corrected out-of-band via a throwaway one-off script on
   2026-07-19, not by re-running this file. If a similar drift is ever
   suspected again, verify live option values directly rather than assuming
   a clean re-run of this script will catch it. */
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
