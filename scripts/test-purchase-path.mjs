#!/usr/bin/env node
/* Automated smoke test for the purchase path: browse -> PDP -> add to cart -> cart
   reflects the item. Zero dependencies, matching create-products.mjs's convention
   (Node 18+ built-in fetch only). Does NOT exercise real checkout/payment - that
   step still needs a human with a test card, per RUNBOOK.md's drop-day checklist.

   Usage:
     node scripts/test-purchase-path.mjs                     # targets local dev server
     STORE_URL=https://laissezfaireleisureclub.com \
       STOREFRONT_PASSWORD=<pw> node scripts/test-purchase-path.mjs   # targets live (password-gated) */

const STORE_URL = process.env.STORE_URL || 'http://127.0.0.1:9292';
const STOREFRONT_PASSWORD = process.env.STOREFRONT_PASSWORD || '';

let cookieJar = '';
function captureCookies(res) {
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of set) {
    const pair = c.split(';')[0];
    const name = pair.split('=')[0];
    cookieJar = cookieJar.split('; ').filter(kv => !kv.startsWith(`${name}=`)).concat(pair).filter(Boolean).join('; ');
  }
}

async function req(path, options = {}) {
  const res = await fetch(`${STORE_URL}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Cookie: cookieJar },
    redirect: 'manual',
  });
  captureCookies(res);
  return res;
}

function assert(cond, message) {
  if (!cond) throw new Error(`FAIL: ${message}`);
  console.log(`  ok: ${message}`);
}

async function unlockPasswordGateIfNeeded() {
  if (!STOREFRONT_PASSWORD) return;
  const res = await req('/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `form_type=storefront_password&password=${encodeURIComponent(STOREFRONT_PASSWORD)}`,
  });
  assert(res.status === 302 || res.status === 303, 'storefront password accepted (redirect)');
}

async function run() {
  console.log(`Purchase-path smoke test against ${STORE_URL}`);

  await unlockPasswordGateIfNeeded();

  console.log('1. Browse: fetch product catalog');
  const catalogRes = await req('/products.json?limit=1');
  assert(catalogRes.ok, `/products.json responded ${catalogRes.status}`);
  const catalog = await catalogRes.json();
  const product = catalog.products?.[0];
  assert(!!product, 'at least one product exists in the catalog');
  const variant = product.variants.find(v => v.available) || product.variants[0];
  assert(!!variant, `product "${product.title}" has at least one variant`);
  console.log(`   using product "${product.title}" (${product.handle}), variant ${variant.id}`);

  console.log('2. PDP: fetch the product page');
  const pdpRes = await req(`/products/${product.handle}`);
  assert(pdpRes.ok, `PDP responded ${pdpRes.status}`);
  const pdpHtml = await pdpRes.text();
  assert(pdpHtml.includes('data-lf-pdp'), 'PDP renders the lf-pdp section (not a generic fallback)');

  console.log('3. Add to cart: POST /cart/add.js');
  const addRes = await req('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: variant.id, quantity: 1 }),
  });
  assert(addRes.ok, `/cart/add.js responded ${addRes.status}`);
  const added = await addRes.json();
  assert(added.variant_id === variant.id, 'cart/add.js echoed back the correct variant_id');

  console.log('4. Cart: GET /cart.js and verify the item is present');
  const cartRes = await req('/cart.js');
  assert(cartRes.ok, `/cart.js responded ${cartRes.status}`);
  const cart = await cartRes.json();
  const line = cart.items.find(i => i.variant_id === variant.id);
  assert(!!line, 'cart contains the added variant');
  assert(line.quantity === 1, `cart line quantity is 1 (got ${line.quantity})`);
  assert(cart.item_count >= 1, `cart.item_count reflects the addition (got ${cart.item_count})`);

  console.log('5. Cleanup: POST /cart/clear.js');
  const clearRes = await req('/cart/clear.js', { method: 'POST' });
  assert(clearRes.ok, `/cart/clear.js responded ${clearRes.status}`);

  console.log('\nAll checks passed. Real checkout/payment still needs a manual pass (RUNBOOK.md drop-day step 5).');
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
