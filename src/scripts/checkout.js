import { cart, money } from './cart.js';

const form = document.querySelector('[data-checkout-form]');
const linesEl = document.querySelector('[data-sum-lines]');
const totalEl = document.querySelector('[data-sum-total]');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderSummary() {
  const lines = cart.priced();
  if (!lines.length) {
    linesEl.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p><a class="btn" href="/shop/">Shop the workshop</a></div>';
    totalEl.textContent = money(0);
    form.querySelector('[data-submit]').disabled = true;
    return;
  }
  form.querySelector('[data-submit]').disabled = false;
  linesEl.innerHTML = lines.map((l) => `
    <div class="cart-line">
      <img src="${esc(l.thumb)}" alt="" width="56" height="56" />
      <div><h3>${esc(l.product?.name || 'Unavailable item')} × ${l.qty}</h3>
        <dl>${l.parts.map((p) => `<dt>${esc(p.label)}</dt><dd>${esc(p.value)}</dd>`).join('')}</dl>
        ${l.problem ? `<p class="form-error">${esc(l.problem)}</p>` : ''}</div>
      <div class="cart-line__price">${l.ok ? money(l.total) : '-'}</div>
    </div>`).join('');
  totalEl.textContent = money(lines.filter((l) => l.ok).reduce((s, l) => s + l.total, 0));
}
cart.subscribe(renderSummary);
renderSummary();

const setErr = (name, msg) => {
  const input = form.elements[name]; const out = form.querySelector(`#e-${name}`);
  out.textContent = msg || ''; input.setAttribute('aria-invalid', msg ? 'true' : 'false');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const contact = { name: form.elements.name.value, email: form.elements.email.value };
  const errs = {};
  if (!contact.name.trim()) errs.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email)) errs.email = 'Enter a valid email address.';
  ['name', 'email'].forEach((n) => setErr(n, errs[n]));
  if (Object.keys(errs).length) { form.elements[Object.keys(errs)[0]].focus(); return; }

  const priced = cart.priced();
  // `unit` is sent only so the server can say whether the price changed. It is never used as the price.
  const lines = priced.map((l) => ({ slug: l.slug, selections: l.selections, upsells: l.upsells, qty: l.qty, unit: l.unit ?? undefined }));
  const btn = form.querySelector('[data-submit]');
  const err = form.querySelector('[data-error]');
  const label = btn.textContent; btn.textContent = 'Checking…';
  btn.disabled = true; btn.setAttribute('aria-busy', 'true'); err.hidden = true;
  try {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lines, contact }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      (data.errors || []).forEach((x) => x.field && form.elements[x.field] && setErr(x.field, x.message));
      err.textContent = (data.errors || []).filter((x) => !x.field || !form.elements[x.field]).map((x) => x.message).join(' ') || 'Something in the cart needs attention.';
      err.hidden = false;
      return;
    }
    const changed = data.lines.some((l) => l.priceChanged);
    form.hidden = true;
    const ok = document.querySelector('[data-success]');
    ok.querySelector('[data-success-msg]').textContent = `${data.message} Server total: ${money(data.subtotal)}.${changed ? ' Some prices changed since you added them, and the server price was used.' : ''}`;
    ok.querySelector('[data-ref]').textContent = data.reference;
    ok.hidden = false; ok.focus();
    cart.clear();
  } catch {
    err.textContent = "We couldn’t reach the server. Nothing was submitted. Please try again.";
    err.hidden = false;
  } finally {
    btn.textContent = label; btn.disabled = false; btn.removeAttribute('aria-busy');
  }
});
