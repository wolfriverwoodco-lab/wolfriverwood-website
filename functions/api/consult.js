// POST /api/consult  { name, email, phone?, project, message?, context?: { slug, selections, upsells } }
// PREVIEW: validates the request and intercepts it. No CRM write and no notification.
// Later this becomes: persist the request -> redirect to the GHL booking calendar -> sync the contact and opportunity (with retries).
import { validateConfig, findProduct, describeSelections } from '../../src/lib/pricing.js';
import { catalog, json, readJson } from './_shared.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (s, n) => String(s || '').trim().slice(0, n);

export async function onRequestPost({ request }) {
  let body;
  try { body = await readJson(request); } catch { return json({ ok: false, errors: [{ message: 'Bad request.' }] }, 400); }
  const errors = [];
  const name = clip(body.name, 120), email = clip(body.email, 200), phone = clip(body.phone, 40);
  const project = clip(body.project, 120), message = clip(body.message, 4000);
  if (!name) errors.push({ field: 'name', message: 'Enter your name.' });
  if (!EMAIL.test(email)) errors.push({ field: 'email', message: 'Enter a valid email address.' });
  if (!project) errors.push({ field: 'project', message: 'Tell us what you have in mind.' });

  let context = null;
  if (body.context && body.context.slug) {
    const product = findProduct(catalog, String(body.context.slug));
    if (!product) errors.push({ field: 'context', message: 'That product no longer exists.' });
    else {
      // Selections are kept even when incomplete, since a consult is where they get finished.
      const v = validateConfig(product, { ...body.context, qty: 1 });
      context = { slug: product.slug, name: product.name, choices: describeSelections(product, v.selections, v.upsells) };
    }
  }
  if (errors.length) return json({ ok: false, errors }, 422);
  return json({
    ok: true,
    intercepted: true,
    message: 'Preview mode: your request was checked but not sent. In the live site this step opens the booking calendar.',
    received: { name, project, context },
  });
}
