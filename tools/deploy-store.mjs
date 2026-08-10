// Fills a real Shopify store with everything this theme reads.
//
// The season is the whole product: a variety is a thing, a week is a thing, and
// a bouquet is a recipe applied to a week. Shopify has no vocabulary for any of
// that, so this script builds one out of metaobjects — `variety`, `week`,
// `delivery_day`, `delivery_method` — and hangs the products off it.
//
//   node tools/deploy-store.mjs <store>.myshopify.com [step]
//
// Steps run in order and are each safe to re-run: definitions, varieties,
// weeks, delivery, products, collections, pages, journal, publish. Pass one to
// run it alone. Everything goes through `shopify store execute`, so it uses
// whatever session the Shopify CLI already holds — no token is stored here.
//
// Re-run `products` and `collections` when the week turns: a bouquet's
// composition is the cut list of the current week, and that is the one fact
// this store cannot compute for itself.

import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

import {
  VARIETIES, SEASON, week, allWeeks, bouquetsFor, RECIPE_KEYS,
  METHODS, TZ,
} from '../preview/season.mjs';
import { PAGES, ARTICLES } from '../preview/content.mjs';

const run = promisify(execFile);
const STORE = process.argv[2];
const ONLY = process.argv[3];

if (!STORE) {
  console.error('usage: node tools/deploy-store.mjs <store>.myshopify.com [step]');
  process.exit(1);
}

const tmp = await mkdtemp(path.join(os.tmpdir(), 'lammas-deploy-'));
let calls = 0;

async function gql(query, variables = {}) {
  calls += 1;
  const queryFile = path.join(tmp, `q${calls}.graphql`);
  const varFile = path.join(tmp, `v${calls}.json`);
  await writeFile(queryFile, query);
  await writeFile(varFile, JSON.stringify(variables));

  const { stdout } = await run('shopify', [
    'store', 'execute',
    '--store', STORE,
    '--query-file', queryFile,
    '--variable-file', varFile,
    '--allow-mutations',
    '--json',
  ], { maxBuffer: 40 * 1024 * 1024 });

  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error(`Not JSON back from the API:\n${stdout.slice(0, 800)}`);
  }
  if (data.errors) throw new Error(JSON.stringify(data.errors, null, 2));

  const complaints = [];
  const walk = (node, trail) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.userErrors) && node.userErrors.length) {
      complaints.push(`${trail}: ${node.userErrors.map((e) => `${(e.field ?? []).join('.')} ${e.message}`).join('; ')}`);
    }
    for (const [key, value] of Object.entries(node)) walk(value, trail ? `${trail}.${key}` : key);
  };
  walk(data.data ?? data, '');
  if (complaints.length) console.warn('  ! ' + complaints.join('\n  ! '));

  return data.data ?? data;
}

const alias = (i) => `m${i}`;
const money = (cents) => (cents / 100).toFixed(2);
const html = (paragraphs) => paragraphs.map((p) => `<p>${p}</p>`).join('\n');

// --------------------------------------------------------------------------
// 1. definitions
// --------------------------------------------------------------------------

const METAOBJECTS = [
  {
    type: 'variety',
    name: 'Variety',
    displayNameKey: 'name',
    fields: [
      ['name', 'single_line_text_field', 'Name'],
      ['cultivar', 'single_line_text_field', 'Cultivar'],
      ['slug', 'single_line_text_field', 'Slug'],
      ['hex', 'single_line_text_field', 'Colour'],
      ['accent', 'single_line_text_field', 'Accent colour'],
      ['form', 'single_line_text_field', 'Form'],
      ['scent', 'number_integer', 'Scent, 1–5'],
      ['stems_per_bunch', 'number_integer', 'Stems per bunch'],
      ['courier_safe', 'boolean', 'Survives a courier'],
      ['note', 'multi_line_text_field', 'Note'],
    ],
  },
  {
    type: 'week',
    name: 'Week',
    displayNameKey: 'label',
    fields: [
      ['number', 'number_integer', 'ISO week number'],
      ['label', 'single_line_text_field', 'Label'],
      ['dates', 'single_line_text_field', 'Dates'],
      ['note', 'multi_line_text_field', 'What the week is like'],
      ['published', 'boolean', 'Cut list published'],
      ['varieties', 'list.metaobject_reference', 'The cut list'],
    ],
  },
  {
    type: 'delivery_day',
    name: 'Delivery day',
    displayNameKey: 'date',
    fields: [
      ['date', 'single_line_text_field', 'Date (YYYY-MM-DD)'],
      ['weekday', 'single_line_text_field', 'Weekday'],
      ['day', 'single_line_text_field', 'Day of month'],
      ['order_by', 'number_integer', 'Cut-off, unix seconds'],
      ['order_by_label', 'single_line_text_field', 'Cut-off in words'],
      ['next_week', 'boolean', 'Belongs to next week'],
    ],
  },
  {
    type: 'delivery_method',
    name: 'Delivery method',
    displayNameKey: 'label',
    fields: [
      ['value', 'single_line_text_field', 'Value'],
      ['label', 'single_line_text_field', 'Label'],
      ['price', 'number_integer', 'Price in pence'],
      ['courier', 'boolean', 'Goes by courier'],
      ['position', 'number_integer', 'Order'],
    ],
  },
];

const PRODUCT_DEFS = [
  ['stems', 'single_line_text_field', 'Stem count'],
  ['note', 'single_line_text_field', 'What it arrives as'],
  ['stems_drawn', 'number_integer', 'Stems in the drawing'],
  ['courier_only', 'boolean', 'Built from courier-safe flowers only'],
  ['courier_safe', 'boolean', 'Can go by courier this week'],
  ['kind', 'single_line_text_field', 'bouquet or booking'],
  ['composition', 'list.metaobject_reference', "This week's composition"],
  ['courier_blocked_by', 'list.metaobject_reference', 'Why it cannot travel'],
  ['week', 'metaobject_reference', 'Week it was composed for'],
];

async function definitionIds() {
  const found = await gql(`query { metaobjectDefinitions(first: 25) { nodes { id type } } }`);
  return new Map(found.metaobjectDefinitions.nodes.map((d) => [d.type, d.id]));
}

async function stepDefinitions() {
  console.log('definitions');

  // Metaobject definitions first: the reference fields below point at them.
  for (const def of METAOBJECTS) {
    const fields = def.fields
      .filter(([key]) => key !== 'varieties')
      .map(([key, type, name]) => `{ key: "${key}", name: ${JSON.stringify(name)}, type: "${type}" }`);
    await gql(`mutation {
      metaobjectDefinitionCreate(definition: {
        type: "${def.type}", name: ${JSON.stringify(def.name)},
        displayNameKey: "${def.displayNameKey}",
        access: { storefront: PUBLIC_READ },
        fieldDefinitions: [${fields.join(', ')}]
      }) { metaobjectDefinition { id type } userErrors { field message code } }
    }`);
    console.log(`  metaobject ${def.type}`);
  }

  const ids = await definitionIds();

  // The cut list is a list of varieties, so it can only be added once the
  // variety definition exists to point at.
  if (ids.get('week') && ids.get('variety')) {
    await gql(`mutation {
      metaobjectDefinitionUpdate(id: "${ids.get('week')}", definition: {
        fieldDefinitions: [{ create: {
          key: "varieties", name: "The cut list", type: "list.metaobject_reference",
          validations: [{ name: "metaobject_definition_id", value: "${ids.get('variety')}" }]
        } }]
      }) { metaobjectDefinition { id } userErrors { field message code } }
    }`);
    console.log('  week.varieties');
  }

  const parts = PRODUCT_DEFS.map(([key, type, name], i) => {
    let validations = '';
    if (type.includes('metaobject_reference')) {
      const target = key === 'week' ? ids.get('week') : ids.get('variety');
      if (!target) return null;
      validations = `, validations: [{ name: "metaobject_definition_id", value: "${target}" }]`;
    }
    return `
      ${alias(i)}: metafieldDefinitionCreate(definition: {
        namespace: "lammas", key: "${key}", name: ${JSON.stringify(name)},
        type: "${type}", ownerType: PRODUCT, access: { storefront: PUBLIC_READ }${validations}
      }) { createdDefinition { id } userErrors { field message code } }`;
  }).filter(Boolean);

  for (let i = 0; i < parts.length; i += 5) {
    await gql(`mutation {${parts.slice(i, i + 5).join('\n')}\n}`);
  }
  console.log(`  ${parts.length} product metafields`);

  // What the whole storefront turns on: which week is being shopped.
  await gql(`mutation {
    a: metafieldDefinitionCreate(definition: {
      namespace: "lammas", key: "current_week", name: "Current week",
      type: "metaobject_reference", ownerType: SHOP, access: { storefront: PUBLIC_READ },
      validations: [{ name: "metaobject_definition_id", value: "${ids.get('week')}" }]
    }) { createdDefinition { id } userErrors { field message code } }
    b: metafieldDefinitionCreate(definition: {
      namespace: "lammas", key: "lede", name: "Standfirst",
      type: "single_line_text_field", ownerType: PAGE, access: { storefront: PUBLIC_READ }
    }) { createdDefinition { id } userErrors { field message code } }
  }`);
  console.log('  shop.current_week, page.lede');
}

// --------------------------------------------------------------------------
// 2. varieties, weeks, delivery
// --------------------------------------------------------------------------

const field = (key, value) => ({ key, value: String(value) });

async function upsertMetaobject(type, handle, fields) {
  const made = await gql(`
    mutation Up($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle }
        userErrors { field message }
      }
    }`, {
    handle: { type, handle },
    metaobject: { fields },
  });
  return made.metaobjectUpsert?.metaobject?.id ?? null;
}

async function metaobjectIds(type) {
  const map = new Map();
  let after = null;
  for (;;) {
    const page = await gql(`query($type: String!, $after: String) {
      metaobjects(type: $type, first: 100, after: $after) {
        nodes { id handle }
        pageInfo { hasNextPage endCursor }
      }
    }`, { type, after });
    for (const node of page.metaobjects.nodes) map.set(node.handle, node.id);
    if (!page.metaobjects.pageInfo.hasNextPage) break;
    after = page.metaobjects.pageInfo.endCursor;
  }
  return map;
}

async function stepVarieties() {
  console.log('varieties');
  for (const [, v] of Object.entries(VARIETIES)) {
    await upsertMetaobject('variety', v.slug, [
      field('name', v.name),
      field('cultivar', v.cultivar),
      field('slug', v.slug),
      field('hex', v.hex),
      field('accent', v.accent),
      field('form', v.form),
      field('scent', v.scent),
      field('stems_per_bunch', v.stems_per_bunch),
      field('courier_safe', v.courier_safe),
      field('note', v.note ?? ''),
    ]);
    console.log(`  ${v.slug}`);
  }
}

async function stepWeeks() {
  console.log('weeks');
  const varieties = await metaobjectIds('variety');

  for (const w of allWeeks()) {
    const list = w.flowering.map((v) => varieties.get(v.slug)).filter(Boolean);
    await upsertMetaobject('week', w.handle, [
      field('number', w.number),
      field('label', w.label),
      field('dates', w.dates),
      field('note', w.note),
      field('published', w.published),
      field('varieties', JSON.stringify(list)),
    ]);
  }
  console.log(`  ${SEASON.last - SEASON.first + 1} weeks, current is ${SEASON.current}`);

  // Point the shop at the week being shopped.
  const weeks = await metaobjectIds('week');
  const current = weeks.get(`week-${SEASON.current}`);
  const shop = await gql(`query { shop { id } }`);
  if (current) {
    await gql(`
      mutation Set($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { metafields { key } userErrors { field message } }
      }`, {
      metafields: [{
        ownerId: shop.shop.id,
        namespace: 'lammas',
        key: 'current_week',
        type: 'metaobject_reference',
        value: current,
      }],
    });
    console.log(`  shop.current_week → week-${SEASON.current}`);
  }
}

async function stepDelivery() {
  console.log('delivery');

  for (const m of METHODS) {
    await upsertMetaobject('delivery_method', m.value, [
      field('value', m.value),
      field('label', m.label),
      field('price', m.price),
      field('courier', m.courier),
      field('position', METHODS.indexOf(m)),
    ]);
    console.log(`  method ${m.value}`);
  }

  // The cut-off is stored as unix seconds so the theme can decide, at render
  // time, whether a day is still open — rather than trusting a flag that went
  // stale the moment this script finished.
  //
  // The days themselves are generated from today rather than copied from the
  // preview's frozen clock: a storefront that always says "cut-off passed" is
  // worse than no date picker at all. Cut days are Tuesday and Friday; Tuesday
  // and Wednesday close on Monday at 18:00, Friday closes on Wednesday.
  for (const d of upcomingDeliveryDays()) {
    await upsertMetaobject('delivery_day', d.date, [
      field('date', d.date),
      field('weekday', d.weekday),
      field('day', d.day),
      field('order_by', d.order_by),
      field('order_by_label', d.order_by_label),
      field('next_week', d.next_week),
    ]);
    console.log(`  day ${d.date} — closes ${d.order_by_label}`);
  }
}

// Monday of the week `now` falls in, in London terms.
function mondayOf(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d;
}

function upcomingDeliveryDays(now = new Date()) {
  const monday = mondayOf(now);
  const at = (offsetDays, hour) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  };
  const iso = (d) => d.toISOString().slice(0, 10);
  const fmt = (d, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(d);

  // Monday, Tuesday, Wednesday and Friday of this week, then next Tuesday.
  const plan = [
    { day: 0, close: at(-3, 17), next: false },  // Mon — closed last Friday
    { day: 1, close: at(0, 17), next: false },   // Tue — closes Monday 18:00
    { day: 2, close: at(0, 17), next: false },   // Wed — closes Monday 18:00
    { day: 4, close: at(2, 17), next: false },   // Fri — closes Wednesday 18:00
    { day: 8, close: at(7, 17), next: true },    // next Tue
  ];

  return plan.map(({ day, close, next }) => {
    const when = at(day, 12);
    return {
      date: iso(when),
      weekday: fmt(when, { weekday: 'short' }),
      day: fmt(when, { day: 'numeric' }),
      order_by: Math.floor(close.getTime() / 1000),
      order_by_label: fmt(close, { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }),
      next_week: next,
    };
  });
}

// --------------------------------------------------------------------------
// 3. products
// --------------------------------------------------------------------------

const LISTENING_ROOM = {
  handle: 'listening-room',
  title: 'Listening Room',
  description: '<p>Ninety minutes in the old grading shed, up to three people. Bring records or use ours. Free with any order.</p>',
  price: 300,
};

async function stepProducts() {
  console.log('products');
  const varieties = await metaobjectIds('variety');
  const weeks = await metaobjectIds('week');
  const currentWeek = weeks.get(`week-${SEASON.current}`);

  for (const b of bouquetsFor(SEASON.current)) {
    const composition = b.composition.map((v) => varieties.get(v.slug)).filter(Boolean);
    const blocked = b.courier_blocked_by.map((v) => varieties.get(v.slug)).filter(Boolean);

    await gql(`
      mutation Set($input: ProductSetInput!) {
        productSet(synchronous: true, identifier: { handle: "${b.handle}" }, input: $input) {
          product { id handle } userErrors { field message }
        }
      }`, {
      input: {
        handle: b.handle,
        title: b.title,
        descriptionHtml: `<p>${b.stems}. ${b.note}.</p>`,
        vendor: 'Lammas',
        productType: 'Bouquet',
        status: 'ACTIVE',
        tags: ['lammas', 'bouquet', b.courier_safe ? 'courier-safe' : 'van-or-pickup'],
        productOptions: [{ name: 'Size', values: [{ name: 'One bunch' }] }],
        variants: [{
          optionValues: [{ optionName: 'Size', name: 'One bunch' }],
          price: money(b.price),
          inventoryItem: { sku: b.handle.toUpperCase(), tracked: false },
        }],
        metafields: [
          { namespace: 'lammas', key: 'stems', type: 'single_line_text_field', value: b.stems },
          { namespace: 'lammas', key: 'note', type: 'single_line_text_field', value: b.note },
          { namespace: 'lammas', key: 'stems_drawn', type: 'number_integer', value: String(b.stems_drawn) },
          { namespace: 'lammas', key: 'courier_only', type: 'boolean', value: String(Boolean(b.courier_safe && composition.length === b.composition.length && b.handle === 'jar')) },
          { namespace: 'lammas', key: 'courier_safe', type: 'boolean', value: String(b.courier_safe) },
          { namespace: 'lammas', key: 'kind', type: 'single_line_text_field', value: 'bouquet' },
          { namespace: 'lammas', key: 'composition', type: 'list.metaobject_reference', value: JSON.stringify(composition) },
          { namespace: 'lammas', key: 'courier_blocked_by', type: 'list.metaobject_reference', value: JSON.stringify(blocked) },
          ...(currentWeek ? [{ namespace: 'lammas', key: 'week', type: 'metaobject_reference', value: currentWeek }] : []),
        ],
      },
    });
    console.log(`  ${b.handle} — ${b.composition.length} varieties, courier ${b.courier_safe ? 'yes' : 'no'}`);
  }

  await gql(`
    mutation Set($input: ProductSetInput!) {
      productSet(synchronous: true, identifier: { handle: "${LISTENING_ROOM.handle}" }, input: $input) {
        product { id handle } userErrors { field message }
      }
    }`, {
    input: {
      handle: LISTENING_ROOM.handle,
      title: LISTENING_ROOM.title,
      descriptionHtml: LISTENING_ROOM.description,
      vendor: 'Lammas',
      productType: 'Booking',
      status: 'ACTIVE',
      tags: ['lammas', 'booking'],
      productOptions: [{ name: 'Session', values: [{ name: '90 minutes' }] }],
      variants: [{
        optionValues: [{ optionName: 'Session', name: '90 minutes' }],
        price: money(LISTENING_ROOM.price),
        inventoryItem: { sku: 'LISTENING', tracked: false },
      }],
      metafields: [
        { namespace: 'lammas', key: 'kind', type: 'single_line_text_field', value: 'booking' },
      ],
    },
  });
  console.log(`  ${LISTENING_ROOM.handle}`);
}

// --------------------------------------------------------------------------
// 4. collections — one per published week
// --------------------------------------------------------------------------

async function stepCollections() {
  console.log('collections');

  const found = await gql(`query { products(first: 50) { nodes { id handle } } }`);
  const byHandle = new Map(found.products.nodes.map((p) => [p.handle, p.id]));
  const bouquetIds = RECIPE_KEYS.map((k) => byHandle.get(k)).filter(Boolean);

  const existing = await gql(`query { collections(first: 60) { nodes { id handle } } }`);
  const collections = new Map(existing.collections.nodes.map((c) => [c.handle, c.id]));

  for (const w of allWeeks()) {
    if (!w.published) continue;

    let id = collections.get(w.handle);
    if (!id) {
      const made = await gql(`
        mutation Make($input: CollectionInput!) {
          collectionCreate(input: $input) { collection { id handle } userErrors { field message } }
        }`, {
        input: {
          handle: w.handle,
          title: `${w.label} — ${w.dates}`,
          descriptionHtml: `<p>${w.note}</p>`,
          sortOrder: 'MANUAL',
        },
      });
      id = made.collectionCreate?.collection?.id;
    }
    if (!id) continue;

    await gql(`
      mutation Add($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection { id } userErrors { field message }
        }
      }`, { id, productIds: bouquetIds });

    console.log(`  ${w.handle} — ${bouquetIds.length} bouquets`);
  }
}

// --------------------------------------------------------------------------
// 5. pages and journal
// --------------------------------------------------------------------------

async function stepPages() {
  console.log('pages');
  const found = await gql(`query { pages(first: 50) { nodes { id handle } } }`);
  const byHandle = new Map(found.pages.nodes.map((p) => [p.handle, p.id]));

  for (const [handle, page] of Object.entries(PAGES)) {
    const body = (page.blocks ?? [])
      .map((b) => `${b.heading ? `<h2>${b.heading}</h2>` : ''}\n${html(b.body ?? [])}`)
      .join('\n');

    const metafields = [{
      namespace: 'lammas', key: 'lede', type: 'single_line_text_field', value: page.lede ?? '',
    }];

    const id = byHandle.get(handle);
    if (id) {
      await gql(`
        mutation Up($id: ID!, $page: PageUpdateInput!) {
          pageUpdate(id: $id, page: $page) { page { handle } userErrors { field message } }
        }`, { id, page: { title: page.title, body, isPublished: true, metafields } });
    } else {
      await gql(`
        mutation Make($page: PageCreateInput!) {
          pageCreate(page: $page) { page { handle } userErrors { field message } }
        }`, { page: { handle, title: page.title, body, isPublished: true, metafields } });
    }
    console.log(`  ${handle}`);
  }
}

async function stepJournal() {
  console.log('journal');
  const made = await gql(`
    mutation { blogCreate(blog: { handle: "journal", title: "From the field" })
      { blog { id handle } userErrors { field message } } }`);

  let blogId = made.blogCreate?.blog?.id;
  if (!blogId) {
    const found = await gql(`query { blogs(first: 20) { nodes { id handle } } }`);
    blogId = found.blogs.nodes.find((b) => b.handle === 'journal')?.id;
  }
  if (!blogId) throw new Error('no journal blog and none could be made');

  const existing = await gql(`query($id: ID!) {
    blog(id: $id) { articles(first: 50) { nodes { handle } } }
  }`, { id: blogId });
  const have = new Set(existing.blog.articles.nodes.map((a) => a.handle));

  for (const article of ARTICLES) {
    if (have.has(article.handle)) {
      console.log(`  – ${article.handle} already there`);
      continue;
    }
    await gql(`
      mutation Article($article: ArticleCreateInput!) {
        articleCreate(article: $article) { article { handle } userErrors { field message } }
      }`, {
      article: {
        blogId,
        handle: article.handle,
        title: article.title,
        body: html(article.body ?? [article.excerpt ?? '']),
        summary: article.excerpt ?? '',
        author: { name: article.author ?? 'Lammas' },
        isPublished: true,
      },
    });
    console.log(`  ${article.handle}`);
  }
}

// --------------------------------------------------------------------------
// 6. publish
// --------------------------------------------------------------------------

async function stepPublish() {
  console.log('publishing to the online store');
  const pubs = await gql(`query { publications(first: 10, catalogType: APP) { nodes { id name } } }`);
  const online = pubs.publications.nodes.find((p) => /online store/i.test(p.name));
  if (!online) {
    console.warn('  ! no Online Store publication found, skipped');
    return;
  }

  const products = await gql(`query { products(first: 50) { nodes { id } } }`);
  const collections = await gql(`query { collections(first: 60) { nodes { id } } }`);
  const targets = [...products.products.nodes, ...collections.collections.nodes].map((n) => n.id);

  for (let i = 0; i < targets.length; i += 20) {
    const parts = targets.slice(i, i + 20).map((id, k) => `
      ${alias(k)}: publishablePublish(id: ${JSON.stringify(id)},
        input: { publicationId: ${JSON.stringify(online.id)} }) {
        userErrors { field message }
      }`);
    await gql(`mutation {${parts.join('\n')}\n}`);
  }
  console.log(`  ${targets.length} products and collections`);
}

// --------------------------------------------------------------------------

const STEPS = {
  definitions: stepDefinitions,
  varieties: stepVarieties,
  weeks: stepWeeks,
  delivery: stepDelivery,
  products: stepProducts,
  collections: stepCollections,
  pages: stepPages,
  journal: stepJournal,
  publish: stepPublish,
};

if (ONLY && !STEPS[ONLY]) {
  console.error(`unknown step "${ONLY}". One of: ${Object.keys(STEPS).join(', ')}`);
  process.exit(1);
}

const plan = ONLY ? [ONLY] : Object.keys(STEPS);
console.log(`${STORE} — ${plan.join(', ')}\n`);
for (const name of plan) {
  await STEPS[name]();
  console.log('');
}
console.log(`done, ${calls} API calls`);
