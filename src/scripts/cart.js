// Cart store (localStorage). Lines hold configuration only. Prices are recomputed for display
// from the catalog and re-priced by the server at checkout. A stored price is never trusted.
import catalog from '../data/catalog.json';
import photos from '../data/photos.json';
import { priceConfig, lineKey, findProduct, describeSelections, money } from '../lib/pricing.js';

const KEY = 'wrw-cart-v1';
const listeners = new Set();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function write(lines) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode: cart lives for this page only */ }
  memory = lines;
  listeners.forEach((fn) => fn(lines));
}
let memory = read();

export const cart = {
  lines: () => memory,
  lastAdded: null,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  /** Add or merge. If replaceKey is given (edit flow), that line is replaced. */
  add({ slug, selections, upsells = [], qty = 1 }, replaceKey) {
    const key = lineKey(slug, selections, upsells);
    let lines = memory.filter((l) => l.key !== replaceKey || replaceKey === key);
    const hit = lines.find((l) => l.key === key);
    if (hit && replaceKey !== key) hit.qty = Math.min(10, hit.qty + qty);
    else if (hit) hit.qty = qty;
    else lines = [...lines, { key, slug, selections, upsells, qty }];
    cart.lastAdded = { key, at: Date.now() };
    write([...lines]);
    return key;
  },
  setQty(key, qty) {
    if (qty < 1) return cart.remove(key);
    write(memory.map((l) => (l.key === key ? { ...l, qty: Math.min(10, qty) } : l)));
  },
  remove(key) { write(memory.filter((l) => l.key !== key)); },
  clear() { write([]); },
  /** Display pricing (non-authoritative). Invalid lines are flagged, never silently priced. */
  priced() {
    return memory.map((l) => {
      const product = findProduct(catalog, l.slug);
      const r = product ? priceConfig(catalog, l.slug, l) : { ok: false, errors: [{ message: 'No longer available.' }] };
      return {
        ...l, product, ok: r.ok && !r.consult, unit: r.unit, total: r.total,
        problem: !r.ok ? r.errors.map((e) => e.message).join(' ') : r.consult ? r.consultReason : null,
        parts: product ? describeSelections(product, l.selections, l.upsells) : [],
        thumb: product ? photos[product.photos[0]].thumb : '',
      };
    });
  },
  count: () => memory.reduce((s, l) => s + l.qty, 0),
};

window.addEventListener('storage', (e) => { if (e.key === KEY) { memory = read(); listeners.forEach((fn) => fn(memory)); } });

export const editHref = (l) =>
  `/shop/${l.slug}/?edit=${encodeURIComponent(l.key)}&config=${encodeURIComponent(JSON.stringify({ s: l.selections, u: l.upsells, q: l.qty }))}`;

export { money };
