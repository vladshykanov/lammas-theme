// The cut list — the single source this whole store is generated from.
//
// The brief is explicit that "What's flowering this week" on the home page and
// "What's in this week's Armful" on the product page must come from ONE place,
// so both are derived here. A bouquet does not store its own ingredients; it
// stores a recipe key, and the ingredients come from whichever week is being
// shopped.
//
// Everything about availability is a function of the clock, so the clock is a
// parameter rather than a global. Europe/London throughout, per the brief.

export const TZ = 'Europe/London';

// The preview runs against a fixed moment so the three date-tile states in the
// design are reproducible. Monday 4 August 2025, 14:00 London: Monday's own
// delivery has closed, Tue/Wed/Fri are open, next week is not yet orderable.
export const NOW = new Date('2025-08-04T13:00:00Z'); // 14:00 BST

// --- varieties ---------------------------------------------------------------
// courier_safe drives the whole delivery-restriction engine in section 3.2 of
// the brief. It lives here and nowhere else.

export const VARIETIES = {
  dahlia_cafe_au_lait: {
    slug: 'dahlia-cafe-au-lait', name: 'Dahlia', cultivar: "Café au Lait",
    hex: '#e8d5c4', accent: '#c9a68a', form: 'dinnerplate',
    scent: 1, stems_per_bunch: 5, courier_safe: false,
    note: 'Heads bruise in transit. Van and pickup only.',
  },
  sweet_pea_matucana: {
    slug: 'sweet-pea-matucana', name: 'Sweet Pea', cultivar: 'Matucana',
    hex: '#8e5fa8', accent: '#5c3570', form: 'spire',
    scent: 5, stems_per_bunch: 10, courier_safe: false,
    note: 'Two days in a vase. Never survives a courier.',
  },
  scabiosa_black_knight: {
    slug: 'scabiosa-black-knight', name: 'Scabiosa', cultivar: 'Black Knight',
    hex: '#5c2333', accent: '#3a1220', form: 'pincushion',
    scent: 2, stems_per_bunch: 10, courier_safe: true,
  },
  amaranth_hot_biscuits: {
    slug: 'amaranth-hot-biscuits', name: 'Amaranth', cultivar: 'Hot Biscuits',
    hex: '#a8804a', accent: '#6f5027', form: 'plume',
    scent: 1, stems_per_bunch: 5, courier_safe: true,
  },
  cosmos_purity: {
    slug: 'cosmos-purity', name: 'Cosmos', cultivar: 'Purity',
    hex: '#f5f1e8', accent: '#d8d2c2', form: 'daisy',
    scent: 1, stems_per_bunch: 10, courier_safe: true,
  },
  physalis: {
    slug: 'physalis', name: 'Physalis', cultivar: 'For drying',
    hex: '#d9a441', accent: '#a8741f', form: 'lantern',
    scent: 1, stems_per_bunch: 10, courier_safe: true,
  },
  rudbeckia_sahara: {
    slug: 'rudbeckia-sahara', name: 'Rudbeckia', cultivar: 'Sahara',
    hex: '#c47a3d', accent: '#8a4f22', form: 'daisy',
    scent: 1, stems_per_bunch: 10, courier_safe: true,
  },
  larkspur_misty: {
    slug: 'larkspur-misty', name: 'Larkspur', cultivar: 'Misty Lavender',
    hex: '#9aa0c8', accent: '#5f668f', form: 'spire',
    scent: 2, stems_per_bunch: 10, courier_safe: true,
  },
  nigella_albion: {
    slug: 'nigella-albion', name: 'Nigella', cultivar: 'Albion Green Pod',
    hex: '#b7c4a8', accent: '#7d8c6c', form: 'pod',
    scent: 1, stems_per_bunch: 10, courier_safe: true,
  },
  zinnia_queen_lime: {
    slug: 'zinnia-queen-lime', name: 'Zinnia', cultivar: 'Queen Lime',
    hex: '#c8bd7a', accent: '#8f8443', form: 'pincushion',
    scent: 1, stems_per_bunch: 10, courier_safe: true,
  },
};

export const variety = (key) => VARIETIES[key];

// --- the season --------------------------------------------------------------
// Weeks 12 to 44. Only the weeks with a published cut list are orderable; the
// rest exist so the week strip can render the whole season.

// `courier_only` is a product decision, not a technicality: the Jar is the
// bouquet the farm deliberately builds out of flowers that survive a parcel,
// which is why it is the one they can post anywhere in the UK. The others take
// the best of the week and therefore travel by van or not at all.
const RECIPES = {
  jar:    { title: 'The Jar',    stems: '12–15 stems', note: 'Jar not included',
            price: 2800, count: 4, stems_drawn: 5,  courier_only: true },
  armful: { title: 'The Armful', stems: '25–30 stems', note: 'Wrapped in paper',
            price: 4500, count: 6, stems_drawn: 8,  courier_only: false },
  table:  { title: 'The Table',  stems: '45–55 stems', note: 'For a long table',
            price: 7000, count: 8, stems_drawn: 10, courier_only: false },
  bucket: { title: 'Bucket of the Week', stems: '40–50 stems', note: 'Straight from the field',
            price: 8500, count: 6, stems_drawn: 9,  courier_only: false },
};

// Weeks that have been cut and published. Keys are ISO week numbers.
const CUT_LIST = {
  30: {
    note: 'Larkspur at its best and the first zinnias. Everything this week travels well.',
    keys: ['larkspur_misty', 'nigella_albion', 'cosmos_purity', 'scabiosa_black_knight', 'zinnia_queen_lime', 'rudbeckia_sahara'],
  },
  31: {
    note: 'The sweet peas came in. Scent for a week, and then they are gone.',
    keys: ['sweet_pea_matucana', 'cosmos_purity', 'scabiosa_black_knight', 'amaranth_hot_biscuits', 'nigella_albion', 'rudbeckia_sahara'],
  },
  32: {
    note: 'Peak of summer. Dahlias are here, amaranth is tall, and the sweet peas carry the field.',
    keys: ['dahlia_cafe_au_lait', 'sweet_pea_matucana', 'amaranth_hot_biscuits', 'scabiosa_black_knight', 'cosmos_purity', 'physalis'],
  },
};

export const SEASON = { first: 12, last: 44, current: 32 };

export const weekRange = (n) => {
  // Week 32 of 2025 runs Mon 4 – Sun 10 August. Derive the rest from it.
  const monday = new Date(Date.UTC(2025, 7, 4));
  monday.setUTCDate(monday.getUTCDate() + (n - 32) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { start: monday, end: sunday };
};

const fmt = (d, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(d);

export function week(n) {
  const { start, end } = weekRange(n);
  const entry = CUT_LIST[n];
  const keys = entry?.keys ?? [];
  const sameMonth = fmt(start, { month: 'long' }) === fmt(end, { month: 'long' });

  return {
    number: n,
    published: keys.length > 0,
    handle: `week-${n}`,
    label: `Week ${n}`,
    // "3 – 9 August", collapsing the month when both ends share one
    dates: sameMonth
      ? `${fmt(start, { day: 'numeric' })} – ${fmt(end, { day: 'numeric', month: 'long' })}`
      : `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short' })}`,
    start, end,
    note: entry?.note ?? '',
    flowering: keys.map((k) => VARIETIES[k]),
  };
}

export const allWeeks = () =>
  Array.from({ length: SEASON.last - SEASON.first + 1 }, (_, i) => week(SEASON.first + i));

// --- bouquets ----------------------------------------------------------------
// A bouquet is a recipe plus a week. Its composition is read from the cut list,
// which is why the product page and the home page can never disagree.

export function bouquet(recipeKey, weekNumber) {
  const r = RECIPES[recipeKey];
  const w = week(weekNumber);
  const pool = r.courier_only ? w.flowering.filter((v) => v.courier_safe) : w.flowering;
  const composition = pool.slice(0, r.count);
  const blocked = composition.filter((v) => !v.courier_safe);

  return {
    handle: recipeKey,
    week: w,
    title: r.title,
    stems: r.stems,
    stems_drawn: r.stems_drawn,
    note: r.note,
    price: r.price,
    composition,
    // Everything the courier rule needs, computed once.
    courier_safe: blocked.length === 0,
    courier_blocked_by: blocked,
    available: w.published,
  };
}

export const RECIPE_KEYS = Object.keys(RECIPES);
export const bouquetsFor = (n) => RECIPE_KEYS.map((k) => bouquet(k, n));

// --- delivery ----------------------------------------------------------------

export const METHODS = [
  { value: 'van',     label: 'Fife & Edinburgh Van',      price: 600,  courier: false },
  { value: 'courier', label: 'UK Courier (selected flowers)', price: 1200, courier: true },
  { value: 'pickup',  label: 'Farm Pickup (Wed/Sat 9–13)', price: 0,    courier: false },
];

// Flowers are cut Tuesday and Friday. A delivery date closes at 18:00 on the
// last working day before its cut. The design shows exactly this: Monday's own
// delivery has closed while Tuesday's is still open.
const DELIVERY_DAYS = [
  { date: '2025-08-04', order_by: '2025-08-01T17:00:00Z' }, // Mon 4  — closed Fri 18:00
  { date: '2025-08-05', order_by: '2025-08-04T17:00:00Z' }, // Tue 5  — closes Mon 18:00
  { date: '2025-08-06', order_by: '2025-08-04T17:00:00Z' }, // Wed 6  — closes Mon 18:00
  { date: '2025-08-08', order_by: '2025-08-06T17:00:00Z' }, // Fri 8  — closes Wed 18:00
  { date: '2025-08-12', order_by: '2025-08-11T17:00:00Z' }, // Tue 12 — next week
];

export function deliveryDates(now = NOW) {
  const thisWeekEnd = weekRange(SEASON.current).end;

  return DELIVERY_DAYS.map((d) => {
    const when = new Date(`${d.date}T12:00:00Z`);
    const orderBy = new Date(d.order_by);

    let state = 'available';
    let reason = 'Available';
    if (orderBy <= now) { state = 'closed'; reason = 'Cut-off passed'; }
    else if (when > thisWeekEnd) { state = 'next'; reason = 'Next week'; }

    return {
      value: d.date,
      weekday: fmt(when, { weekday: 'short' }),
      day: fmt(when, { day: 'numeric' }),
      state, reason,
      selectable: state === 'available',
      order_by_label: fmt(orderBy, { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }),
    };
  });
}

export const firstSelectableDate = (now = NOW) =>
  (deliveryDates(now).find((d) => d.selectable) ?? {}).value ?? null;

// Server-side gate. The brief requires this to be checked on add-to-cart and
// again at checkout, not merely greyed out in CSS.
export function dateIsOrderable(value, now = NOW) {
  const d = deliveryDates(now).find((x) => x.value === value);
  return Boolean(d && d.selectable);
}
