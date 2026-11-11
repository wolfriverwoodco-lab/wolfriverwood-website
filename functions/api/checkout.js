// POST /api/checkout  { lines: [{ slug, selections, upsells, qty, unit? }], contact: { name, email } }
// PREVIEW: re-prices every line on the server and returns a test-mode order summary.
// No payment provider is connected, so nothing is charged and nothing is sent.
import { priceConfig } from '../../src/lib/pricing.js';
import { catalog, json, readJson } from './_shared.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request }) {
  let body;
  try { body = await readJson(request); } catch { return json({ ok: false, errors: [{ message: 'Bad request.' }] }, 400); }
  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
  if (!lines.length) return json({ ok: false, errors: [{ field: 'lines', message: 'Your cart is empty.' }] }, 422);

  const errors = [];
  const contact = body.contact || {};
  if (!String(contact.name || '').trim()) errors.push({ field: 'name', message: 'Enter your name.' });
  if (!EMAIL.test(String(contact.email || ''))) errors.push({ field: 'email', message: 'Enter a valid email address.' });

  const priced = lines.map((l, i) => {
    const r = priceConfig(catalog, String(l.slug || ''), l);
    if (!r.ok) errors.push({ line: i, message: `${r.name || 'An item'}: ${r.errors.map((e) => e.message).join(' ')}` });
    else if (r.consult) errors.push({ line: i, message: `${r.name}: ${r.consultReason}` });
    const changed = r.ok && !r.consult && Number.isInteger(l.unit) && l.unit !== r.unit;
    return { slug: r.slug, name: r.name, qty: r.qty, unit: r.unit, total: r.total, priceChanged: changed };
  });
  if (errors.length) return json({ ok: false, errors, lines: priced }, 422);

  const subtotal = priced.reduce((s, l) => s + l.total, 0);
  return json({
    ok: true,
    testMode: true,
    message: 'Test order validated. No payment was taken and no email was sent.',
    reference: `TEST-${Date.now().toString(36).toUpperCase()}`,
    lines: priced,
    subtotal,
    shipping: null,
    tax: null,
    note: 'Shipping and tax rules are waiting on the owner.',
  });
}
