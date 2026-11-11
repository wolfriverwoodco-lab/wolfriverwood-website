// POST /api/price  { slug, selections, upsells, qty } -> authoritative price for one configuration.
import { priceConfig } from '../../src/lib/pricing.js';
import { catalog, json, readJson } from './_shared.js';

export async function onRequestPost({ request }) {
  let body;
  try { body = await readJson(request); } catch { return json({ ok: false, errors: [{ message: 'Bad request.' }] }, 400); }
  const r = priceConfig(catalog, String(body.slug || ''), body);
  return json({ ok: r.ok, errors: r.errors, consult: r.consult, consultReason: r.consultReason, unit: r.unit, total: r.total, breakdown: r.breakdown, demo: true }, r.ok ? 200 : 422);
}
