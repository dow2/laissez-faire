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
