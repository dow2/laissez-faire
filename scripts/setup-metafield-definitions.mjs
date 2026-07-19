#!/usr/bin/env node
/* Creates admin-facing metafield definitions for the lfc.* product metafields
   the theme already reads (theme/sections/lf-product.liquid,
   theme/snippets/lf-code.liquid). Without a definition, these fields are only
   editable via raw JSON in the product's "Metafields" panel; with one, they
   get a proper labeled form field on every product's edit page.
   Idempotent: skips any definition that already exists.
   Auth: same client-credentials grant as create-products.mjs. */
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

// Every field the theme actually reads. `lfc.drop_accent` is deliberately
// EXCLUDED: create-products.mjs sets it, but grep confirms nothing in
// theme/ ever reads it — it's dead data left over from an earlier design
// intent (see the "per-drop accents" comment in lf-tokens.css, which
// hardcodes its palette in :root instead). Defining it would present the
// merchant an editable field that silently does nothing.
const DEFINITIONS = [
  {
    name: 'Story', key: 'story', namespace: 'lfc', type: 'multi_line_text_field',
    description: 'Short script-styled story line shown on the PDP under the price (e.g. "Our Lady in blue neon — protection for the ones who move at night."). Blank = nothing renders.',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Edition Size', key: 'edition_size', namespace: 'lfc', type: 'number_integer',
    description: 'Shown on the PDP as "Edition of N" beneath the price. Blank = nothing renders.',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Garment Details', key: 'details', namespace: 'lfc', type: 'multi_line_text_field',
    description: 'PDP "Garment Details" accordion body. One idea per line. Blank = the section\'s fallback text is used (edit in the theme editor).',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Wash Care', key: 'care', namespace: 'lfc', type: 'multi_line_text_field',
    description: 'PDP "Wash Care" accordion body. One idea per line. Blank = the section\'s fallback text is used (edit in the theme editor).',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Product Code', key: 'code', namespace: 'lfc', type: 'single_line_text_field',
    description: 'Shown in parentheses on the shop grid and PDP, e.g. "(LF_SKULL)". Blank = auto-derived from the product handle (LF_<HANDLE>).',
    ownerType: 'PRODUCT',
  },
];

async function definitionExists(namespace, key, ownerType) {
  const d = await gql(`
    query($namespace: String!, $key: String!, $ownerType: MetafieldOwnerType!) {
      metafieldDefinitions(namespace: $namespace, key: $key, ownerType: $ownerType, first: 1) {
        nodes { id }
      }
    }`, { namespace, key, ownerType });
  return d.metafieldDefinitions.nodes.length > 0;
}

async function createDefinition(def) {
  if (await definitionExists(def.namespace, def.key, def.ownerType)) {
    console.log(`SKIP ${def.namespace}.${def.key} (definition already exists)`);
    return;
  }
  const d = await gql(`
    mutation($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id name }
        userErrors { field message }
      }
    }`, {
    definition: {
      name: def.name,
      namespace: def.namespace,
      key: def.key,
      description: def.description,
      type: def.type,
      ownerType: def.ownerType,
    },
  });
  const errs = d.metafieldDefinitionCreate.userErrors;
  if (errs.length) throw new Error(`${def.namespace}.${def.key}: ${JSON.stringify(errs)}`);
  console.log(`CREATED ${def.namespace}.${def.key} — "${d.metafieldDefinitionCreate.createdDefinition.name}"`);
}

for (const def of DEFINITIONS) await createDefinition(def);
console.log('Done.');
