// The cart, and the rules that decide whether it can be checked out.
//
// Two of those rules are the reason this theme is not a normal storefront:
//
//   * A delivery date can lapse while the cart sits open. Monday 18:00 passes
//     and Tuesday is no longer orderable, whether or not the tab was refreshed.
//   * Some varieties cannot travel by courier, so a cart that is fine by van
//     becomes invalid the moment the method changes.
//
// Both are evaluated here, server-side, every time the cart is read. The
// product page shows the same information first, but showing is not enforcing.
//
// One order is delivered once, so the date and the method belong to the cart
// rather than to each line. That is also what makes "delivery charged once"
// true rather than a rounding convention.

import { bouquet, deliveryDates, dateIsOrderable, firstSelectableDate, METHODS, NOW } from './season.mjs';

const LISTENING_ROOM = {
  handle: 'listening-room',
  kind: 'booking',
  title: 'Listening Room',
  meta: '90 minutes · up to 3 people',
  price: 0,
  note: 'Free with any order',
};

const state = {
  lines: [],                       // { key, kind, handle, week, quantity }
  date: firstSelectableDate(),
  method: 'van',
};

const methodOf = (value) => METHODS.find((m) => m.value === value) ?? METHODS[0];

export function add({ id, week, delivery_date, delivery_method, quantity = 1 }) {
  if (id === LISTENING_ROOM.handle) {
    if (!state.lines.some((l) => l.handle === LISTENING_ROOM.handle)) {
      state.lines.push({ key: LISTENING_ROOM.handle, kind: 'booking', handle: LISTENING_ROOM.handle, quantity: 1 });
    }
    return { ok: true };
  }

  const weekNumber = Number(week) || 32;
  let b;
  try {
    b = bouquet(id, weekNumber);
  } catch {
    return { ok: false, error: 'No such bouquet.' };
  }
  if (!b || !b.available) return { ok: false, error: 'That week has not been cut.' };

  // The date arrives from a form that could have been open for hours, so it is
  // checked here rather than trusted.
  if (delivery_date && !dateIsOrderable(delivery_date)) {
    return { ok: false, error: 'That delivery date has closed. Pick another.' };
  }

  if (delivery_date) state.date = delivery_date;
  if (delivery_method) state.method = methodOf(delivery_method).value;

  const key = `${id}:${weekNumber}`;
  const existing = state.lines.find((l) => l.key === key);
  if (existing) existing.quantity += Math.max(1, Number(quantity) || 1);
  else state.lines.push({ key, kind: 'bouquet', handle: id, week: weekNumber, quantity: Math.max(1, Number(quantity) || 1) });

  return { ok: true };
}

export function change({ key, quantity, date, method }) {
  if (date !== undefined && date !== null && date !== '') state.date = date;
  if (method) state.method = methodOf(method).value;

  if (key) {
    const q = Math.max(0, Number(quantity) || 0);
    if (q === 0) state.lines = state.lines.filter((l) => l.key !== key);
    else {
      const line = state.lines.find((l) => l.key === key);
      if (line) line.quantity = Math.min(20, q);
    }
  }
  return { ok: true };
}

export function build(now = NOW) {
  const method = methodOf(state.method);

  const items = state.lines.map((l) => {
    if (l.kind === 'booking') {
      return { ...LISTENING_ROOM, key: l.key, kind: 'booking', quantity: 1, line_price: 0 };
    }
    const b = bouquet(l.handle, l.week);
    return {
      key: l.key, kind: 'bouquet', handle: b.handle, title: b.title,
      meta: `${b.stems} · ${b.week.label}`,
      week: b.week, composition: b.composition,
      courier_blocked_by: b.courier_blocked_by, courier_safe: b.courier_safe,
      price: b.price, quantity: l.quantity, line_price: b.price * l.quantity,
    };
  });

  const bouquets = items.filter((i) => i.kind === 'bouquet');
  const subtotal = items.reduce((n, i) => n + i.line_price, 0);
  // Charged once for the order, not once per line.
  const delivery = bouquets.length ? method.price : 0;

  // --- the two blocking rules ------------------------------------------------

  const problems = [];

  if (bouquets.length && !dateIsOrderable(state.date, now)) {
    const chosen = deliveryDates(now).find((d) => d.value === state.date);
    problems.push({
      kind: 'date',
      message: chosen && chosen.state === 'closed'
        ? `Orders for ${chosen.weekday} ${chosen.day} closed at ${chosen.order_by_label}. Choose another delivery date.`
        : 'That delivery date is no longer available. Choose another.',
    });
  }

  if (method.courier) {
    const blocked = [...new Map(
      bouquets.flatMap((i) => i.courier_blocked_by).map((v) => [v.slug, v]),
    ).values()];

    if (blocked.length) {
      const names = blocked.map((v) => `${v.name} ‘${v.cultivar}’`);
      const list = names.length > 1
        ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
        : names[0];
      problems.push({
        kind: 'courier',
        message: `${list} cannot travel by courier. Switch to the Fife & Edinburgh van or farm pickup, or remove that bouquet.`,
      });
    }
  }

  return {
    items,
    item_count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal,
    delivery,
    total: subtotal + delivery,
    date: state.date,
    dates: deliveryDates(now).map((d) => ({ ...d, checked: d.value === state.date })),
    method: method.value,
    method_label: method.label,
    methods: METHODS.map((m) => ({ ...m, checked: m.value === method.value })),
    problems,
    can_checkout: items.length > 0 && problems.length === 0,
    booking_handle: LISTENING_ROOM.handle,
  };
}

// Used by the /checkout route: the same rules again, because a cart page that
// merely hides the button is not enforcement.
//
// An empty cart is also a blocker. The button already knew that — can_checkout
// requires at least one item — but the gate did not, so a hand-typed /checkout
// on an empty cart sailed through.
export function checkoutBlocked(now = NOW) {
  const cart = build(now);
  if (cart.items.length === 0) {
    return [{ kind: 'empty', message: 'There is nothing in the cart yet.' }];
  }
  return cart.problems;
}

export function reset() {
  state.lines = [];
  state.date = firstSelectableDate();
  state.method = 'van';
}
