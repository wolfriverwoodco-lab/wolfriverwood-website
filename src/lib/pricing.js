// Pure configuration validation + pricing. Shared by the browser (display only) and the
// Cloudflare Functions (authoritative). Never trust a price sent by a browser.
// All money is integer cents.

export function findProduct(catalog, slug) {
  return catalog.products.find((p) => p.slug === slug) || null;
}

/** Choices that the current selections disallow, as { optionId: { choiceId: reason } }. */
export function disallowedChoices(product, selections) {
  const out = {};
  for (const rule of product.rules || []) {
    const hit = Object.entries(rule.if).every(([opt, val]) => selections[opt] === val);
    if (!hit) continue;
    for (const [opt, ids] of Object.entries(rule.disallow)) {
      out[opt] ||= {};
      for (const id of ids) out[opt][id] = rule.reason;
    }
  }
  return out;
}

/** Normalise and validate. Returns { ok, errors[], selections, upsells, qty, consult, consultReason }. */
export function validateConfig(product, input = {}) {
  const errors = [];
  const selIn = input.selections && typeof input.selections === 'object' ? input.selections : {};
  const selections = {};
  for (const opt of product.options || []) {
    const v = selIn[opt.id];
    if (v === undefined || v === null || v === '') {
      if (opt.required) errors.push({ field: opt.id, message: `Choose a ${opt.label.toLowerCase()}.` });
      continue;
    }
    const choice = opt.choices.find((c) => c.id === String(v));
    if (!choice) { errors.push({ field: opt.id, message: `"${v}" is not an option for ${opt.label.toLowerCase()}.` }); continue; }
    selections[opt.id] = choice.id;
  }
  for (const k of Object.keys(selIn)) {
    if (!(product.options || []).some((o) => o.id === k)) errors.push({ field: k, message: `Unknown option "${k}".` });
  }
  const blocked = disallowedChoices(product, selections);
  for (const [opt, map] of Object.entries(blocked)) {
    if (selections[opt] && map[selections[opt]]) errors.push({ field: opt, message: map[selections[opt]] });
  }
  const upIn = Array.isArray(input.upsells) ? input.upsells.map(String) : [];
  const upsells = [];
  for (const id of upIn) {
    if (!(product.upsells || []).some((u) => u.id === id)) errors.push({ field: 'upsells', message: `"${id}" is not available for this piece.` });
    else if (!upsells.includes(id)) upsells.push(id);
  }
  const qty = input.qty === undefined ? 1 : Number(input.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) errors.push({ field: 'qty', message: 'Quantity must be between 1 and 10.' });

  let consult = product.mode === 'consult';
  let consultReason = consult ? 'This piece is quoted after a free consultation.' : null;
  for (const opt of product.options || []) {
    const c = opt.choices.find((x) => x.id === selections[opt.id]);
    if (c && c.consult) { consult = true; consultReason = `${c.label} is quoted after a free consultation.`; }
  }
  return { ok: errors.length === 0, errors, selections, upsells, qty: Number.isInteger(qty) ? qty : 1, consult, consultReason };
}

/** Price a configuration. Returns validation result plus { unit, total, breakdown[] }. */
export function priceConfig(catalog, slug, input) {
  const product = findProduct(catalog, slug);
  if (!product) return { ok: false, errors: [{ field: 'slug', message: 'That product does not exist.' }] };
  const v = validateConfig(product, input);
  const res = { ...v, slug, name: product.name, unit: null, total: null, breakdown: [] };
  if (!v.ok || v.consult) return res;

  const breakdown = [{ label: 'Base', amount: product.basePrice }];
  let unit = product.basePrice;
  for (const opt of product.options) {
    const c = opt.choices.find((x) => x.id === v.selections[opt.id]);
    if (c && c.price) { unit += c.price; breakdown.push({ label: `${opt.label}: ${c.label}`, amount: c.price }); }
  }
  for (const id of v.upsells) {
    const u = product.upsells.find((x) => x.id === id);
    unit += u.price; breakdown.push({ label: u.label, amount: u.price });
  }
  const threshold = catalog.consultThresholdCents;
  if (Number.isInteger(threshold) && unit * v.qty > threshold) {
    return { ...res, consult: true, consultReason: 'Orders at this size are confirmed on a free consultation call.' };
  }
  return { ...res, unit, total: unit * v.qty, breakdown };
}

/** Stable key so two different configurations of one product are separate cart lines. */
export function lineKey(slug, selections, upsells) {
  const s = Object.keys(selections || {}).sort().map((k) => `${k}=${selections[k]}`).join('&');
  const u = [...(upsells || [])].sort().join(',');
  return `${slug}?${s}|${u}`;
}

/** Human summary of selections for cart lines and consult context. */
export function describeSelections(product, selections, upsells = []) {
  const parts = [];
  for (const opt of product.options || []) {
    const c = opt.choices.find((x) => x.id === selections[opt.id]);
    if (c) parts.push({ label: opt.label, value: c.label });
  }
  for (const id of upsells) {
    const u = (product.upsells || []).find((x) => x.id === id);
    if (u) parts.push({ label: 'Extra', value: u.label });
  }
  return parts;
}

export const money = (cents) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0 });
