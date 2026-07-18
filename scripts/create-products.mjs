#!/usr/bin/env node
/* Creates the six Drop 001 products on 1xiwxi-yy.myshopify.com via Admin GraphQL.
   Idempotent-ish: skips any product whose handle already exists.
   Auth: OAuth client credentials grant (Dev Dashboard app `lf-catalog-loader`,
   installed on the store, same org). Client ID is public; the Secret lives in
   macOS Keychain item `lf-shopify-client-secret` (never hardcoded). The grant
   returns a ~24h access token at startup. */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SHOP = '1xiwxi-yy.myshopify.com';
const API = `https://${SHOP}/admin/api/2025-10/graphql.json`;
const CLIENT_ID = '1c05c65814060a190372cffaa20ba146';
const CLIENT_SECRET = execSync('security find-generic-password -a lf -s lf-shopify-client-secret -w', { encoding: 'utf8' }).trim();

async function getAccessToken() {
  const res = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`client credentials grant failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}
const TOKEN = await getAccessToken();
const IMG_DIR = path.join(import.meta.dirname, 'product-images');

const GARMENTS = [
  { value: 'Tee — Black', price: '75.00', file: g => `${g}-black-mockup.jpg` },
  { value: 'Tee — White', price: '75.00', file: g => (g === 'maria' ? `${g}-white-mockup.jpg` : `${g}-whitemockup.jpg`) },
  { value: 'Hoodie — Grey', price: '150.00', file: g => `${g}-greyhood.jpg` },
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const PRODUCTS = [
  { slug: 'casamigo',   title: 'Casamigo',     story: 'Friends of the house — good company, kept forever.' },
  { slug: 'fluerdelis', title: 'Fleur-de-Lis', story: "The city's oldest mark, drawn in tube light." },
  { slug: 'magnolia',   title: 'Magnolia',     story: 'The state flower, blooming after dark.' },
  { slug: 'maria',      title: 'Maria',        story: 'Our Lady in blue neon — protection for the ones who move at night.' },
  { slug: 'sig',        title: 'Signature',    story: 'The name, signed in light. Effortless excellence.' },
  { slug: 'skull',      title: 'Skull',        story: "Kill 'em dead, needle & thread." },
];

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
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
  const up = await fetch(t.url, { method: 'POST', body: form });
  if (!up.ok) throw new Error(`upload failed for ${filename}: ${up.status}`);
  return t.resourceUrl;
}

async function exists(handle) {
  const d = await gql(`query($h: String!) { productByHandle(handle: $h) { id } }`, { h: handle });
  return Boolean(d.productByHandle);
}

async function createProduct(p) {
  if (await exists(p.slug)) { console.log(`SKIP ${p.title} (handle exists)`); return; }

  const media = [];
  for (const g of GARMENTS) {
    const url = await stagedUpload(g.file(p.slug));
    media.push({ originalSource: url, alt: `${g.value} — ${p.title}`, mediaContentType: 'IMAGE' });
  }

  const variants = [];
  for (const g of GARMENTS) for (const s of SIZES) {
    variants.push({ price: g.price, optionValues: [{ optionName: 'Garment', name: g.value }, { optionName: 'Size', name: s }] });
  }

  const d = await gql(`
    mutation($input: ProductSetInput!) {
      productSet(input: $input, synchronous: true) {
        product { id handle variants(first: 20) { nodes { id title } } }
        userErrors { field message }
      }
    }`, {
    input: {
      title: p.title,
      handle: p.slug,
      status: 'ACTIVE',
      tags: ['drop-001'],
      descriptionHtml: `<p>Heavyweight construction, puff-print front graphic, chain-stitched crest. Cut roomy through the chest — New Orleans proportions.</p>`,
      productOptions: [
        { name: 'Garment', values: GARMENTS.map(g => ({ name: g.value })) },
        { name: 'Size', values: SIZES.map(s => ({ name: s })) },
      ],
      variants,
      files: media,
      metafields: [
        { namespace: 'lf', key: 'story', type: 'multi_line_text_field', value: p.story },
        { namespace: 'lf', key: 'edition_size', type: 'number_integer', value: '150' },
        { namespace: 'lf', key: 'drop_accent', type: 'color', value: '#9fd8ff' },
      ],
    },
  });
  const errs = d.productSet.userErrors;
  if (errs.length) throw new Error(`${p.title}: ${JSON.stringify(errs)}`);
  console.log(`CREATED ${p.title} — ${d.productSet.product.variants.nodes.length} variants`);
}

for (const p of PRODUCTS) await createProduct(p);
console.log('Done.');
