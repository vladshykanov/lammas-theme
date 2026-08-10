// Renders the theme the way Shopify would, for the subset of Liquid this theme
// uses. Route -> template JSON -> sections -> layout.

import { Liquid } from 'liquidjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Cart from './cart.mjs';
import { PAGES, POLICIES, FAQS, ARTICLES } from './content.mjs';
import { week, allWeeks, bouquetsFor, bouquet, deliveryDates, firstSelectableDate,
         METHODS, RECIPE_KEYS, VARIETIES, SEASON, NOW } from './season.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const engine = new Liquid({
  root: [path.join(ROOT, 'snippets'), path.join(ROOT, 'sections'), ROOT],
  extname: '.liquid',
  jekyllInclude: false,
});

engine.registerFilter('asset_url', (n) => `/assets/${n}`);
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('img_url', (s) => s);
engine.registerFilter('money', (p) => `£${(Number(p) / 100).toFixed(2)}`);

engine.registerTag('schema', {
  parse(t, rest) { while (rest.length) if (rest.shift().name === 'endschema') return; },
  render() { return ''; },
});

engine.registerTag('section', {
  parse(t) { this.name = t.args.trim().replace(/^['"]|['"]$/g, ''); },
  *render(ctx, emitter) { emitter.write(yield renderSection(this.name, {}, ctx.environments)); },
});

const SCHEMA_RE = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/;

async function loadSection(type) {
  const source = await readFile(path.join(ROOT, 'sections', `${type}.liquid`), 'utf8');
  const m = source.match(SCHEMA_RE);
  const defaults = {};
  if (m) {
    const schema = JSON.parse(m[1]);
    for (const s of schema.settings ?? []) if (s.default !== undefined) defaults[s.id] = s.default;
  }
  return { source, defaults };
}

async function renderSection(type, config, globals) {
  const { source, defaults } = await loadSection(type);
  const blocks = (config.block_order ?? []).map((id) => ({
    id, type: config.blocks[id].type, settings: config.blocks[id].settings ?? {},
  }));
  const section = { id: type, settings: { ...defaults, ...(config.settings ?? {}) }, blocks };
  return engine.parseAndRender(source, { ...globals, section });
}

export const shop = { name: 'Lammas', place: 'Fife, Scotland', currency: 'GBP' };

function seasonContext(viewing) {
  const weeks = allWeeks();
  return {
    weeks,
    current: SEASON.current,
    viewing,
    prev: Math.max(SEASON.first, viewing - 1),
    next: Math.min(SEASON.last, viewing + 1),
  };
}

function resolve(pathname) {
  if (pathname === '/' || pathname === '') {
    return { template: 'index', viewing: SEASON.current, title: 'Cut on the field. Not flown.' };
  }
  const m = pathname.match(/^\/collections\/week-(\d+)\/?$/);
  if (m) {
    const n = Number(m[1]);
    if (n < SEASON.first || n > SEASON.last) return null;
    return { template: 'collection', viewing: n, title: `Week ${n}` };
  }

  if (pathname === '/cart') return { template: 'cart', viewing: SEASON.current, title: 'Your cart' };
  if (pathname === '/404') return { template: '404', viewing: SEASON.current, title: 'Not found' };

  // Kind aliases: the footer links to /collections/bouquets, which is really
  // this week filtered. Supporting the alias beats a dead link.
  const alias = pathname.match(/^\/collections\/(bouquets|buckets|dried|seeds|workshops)\/?$/);
  if (alias) {
    return { template: 'collection', viewing: SEASON.current, kindOverride: alias[1],
             title: `${alias[1][0].toUpperCase()}${alias[1].slice(1)}` };
  }

  const p = pathname.match(/^\/products\/([\w-]+)\/?$/);
  if (p && RECIPE_KEYS.includes(p[1])) {
    return { template: 'product', viewing: SEASON.current, handle: p[1], title: null };
  }
  if (p && p[1] === 'listening-room') {
    return { template: 'booking', viewing: SEASON.current, title: 'Listening Room' };
  }

  const pg = pathname.match(/^\/pages\/([\w-]+)\/?$/);
  if (pg && PAGES[pg[1]]) {
    return { template: 'page', viewing: SEASON.current, page: { handle: pg[1], ...PAGES[pg[1]] },
             title: PAGES[pg[1]].title };
  }

  const pol = pathname.match(/^\/policies\/([\w-]+)\/?$/);
  if (pol && POLICIES[pol[1]]) {
    return { template: 'page', viewing: SEASON.current, page: { handle: pol[1], ...POLICIES[pol[1]] },
             title: POLICIES[pol[1]].title };
  }

  if (pathname === '/blogs/journal' || pathname === '/blogs/journal/') {
    return { template: 'blog', viewing: SEASON.current, title: 'Journal' };
  }

  const art = pathname.match(/^\/blogs\/journal\/([\w-]+)\/?$/);
  if (art) {
    const a = ARTICLES.find((x) => x.handle === art[1]);
    if (a) return { template: 'article', viewing: SEASON.current, article: a, title: a.title };
  }

  if (pathname === '/search') return { template: 'search', viewing: SEASON.current, title: 'Search' };

  if (pathname === '/account' || pathname.startsWith('/account/')) {
    return { template: 'account', viewing: SEASON.current, title: 'Account' };
  }

  return null;
}

const dateLabel = (iso) => new Intl.DateTimeFormat('en-GB',
  { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

function runSearch(q) {
  const needle = (q || '').trim().toLowerCase();
  if (!needle) return { query: '', total: 0, bouquets: [], varieties: [], articles: [] };

  const bouquets = bouquetsFor(SEASON.current).filter((b) =>
    `${b.title} ${b.note} ${b.stems}`.toLowerCase().includes(needle));
  const varieties = Object.values(VARIETIES).filter((v) =>
    `${v.name} ${v.cultivar}`.toLowerCase().includes(needle));
  const articles = ARTICLES.filter((a) =>
    `${a.title} ${a.excerpt}`.toLowerCase().includes(needle))
    .map((a) => ({ ...a, date_label: dateLabel(a.date) }));

  return { query: q, bouquets, varieties, articles,
           total: bouquets.length + varieties.length + articles.length };
}

export async function renderRoute(pathname, query = new URLSearchParams()) {
  const route = resolve(pathname);
  if (!route) return null;

  // Filter state lives in the query string so it survives the back button and
  // can be shared. Nothing is filtered yet — the chips are wired, the kinds
  // beyond bouquets have no products in the preview catalogue.
  const kind = route.kindOverride || query.get('kind') || 'all';

  // Between week 44 and week 12 there is nothing in the field to sell. The
  // design never covers it and it happens every year, so the theme has to have
  // an answer. ?season=closed previews it.
  const seasonOpen = query.get('season') !== 'closed';

  // Product context: the bouquet is composed from the week being shopped, and
  // the delivery choices are evaluated against the clock rather than stored.
  let productCtx = {};
  if (route.template === 'product') {
    const b = bouquet(route.handle, route.viewing);
    const dates = deliveryDates();
    const chosenDate = query.get('date') || firstSelectableDate();
    const chosenMethod = query.get('method') || 'van';

    productCtx = {
      product: b,
      delivery_dates: dates.map((d) => ({ ...d, checked: d.value === chosenDate })),
      delivery_methods: METHODS.map((m) => ({ ...m, checked: m.value === chosenMethod })),
      chosen_method: chosenMethod,
    };
    route.title = `${b.title} — ${b.week.label}`;
  }

  const globals = {
    shop,
    page: route.page,
    article: route.article ? { ...route.article, date_label: dateLabel(route.article.date) } : null,
    articles: ARTICLES.map((a) => ({ ...a, date_label: dateLabel(a.date) })),
    all_varieties: Object.values(VARIETIES),
    faqs: FAQS,
    search: runSearch(query.get('q')),
    template: route.template,
    ...productCtx,
    cart: Cart.build(),
    season: { ...seasonContext(route.viewing), open: seasonOpen },
    week: week(route.viewing),
    bouquets: bouquetsFor(route.viewing),
    kind,
    now: NOW,
    page_title: route.title,
    page_description: 'Seasonal flowers, cut on the field in Fife and never flown.',
  };

  const tpl = JSON.parse(await readFile(path.join(ROOT, 'templates', `${route.template}.json`), 'utf8'));
  const parts = [];
  for (const id of tpl.order) {
    parts.push(await renderSection(tpl.sections[id].type, tpl.sections[id], globals));
  }

  const layout = await readFile(path.join(ROOT, 'layout', 'theme.liquid'), 'utf8');
  return engine.parseAndRender(layout, { ...globals, content_for_layout: parts.join('\n') });
}
