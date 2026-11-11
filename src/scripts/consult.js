import catalog from '../data/catalog.json';
import { findProduct, validateConfig, describeSelections } from '../lib/pricing.js';

const form = document.querySelector('[data-consult-form]');
if (form) init();

function init() {
  const params = new URLSearchParams(location.search);
  const product = findProduct(catalog, params.get('product') || '');
  let context = null;
  if (product) {
    let cfg = {};
    try { cfg = JSON.parse(params.get('config') || '{}'); } catch { cfg = {}; }
    const v = validateConfig(product, { selections: cfg.s || {}, upsells: cfg.u || [] });
    context = { slug: product.slug, selections: v.selections, upsells: v.upsells };
    const parts = [{ label: 'Piece', value: product.name }, ...describeSelections(product, v.selections, v.upsells)];
    const dl = form.querySelector('[data-context-list]');
    dl.innerHTML = '';
    for (const p of parts) {
      const dt = document.createElement('dt'); dt.textContent = p.label;
      const dd = document.createElement('dd'); dd.textContent = p.value;
      dl.append(dt, dd);
    }
    form.querySelector('[data-context]').hidden = false;
    const sel = form.querySelector('#c-project');
    const match = [...sel.options].find((o) => o.value === product.name);
    sel.value = match ? match.value : 'Custom board or gift';
  }
  form.querySelector('[data-context-clear]').addEventListener('click', () => {
    context = null;
    form.querySelector('[data-context]').hidden = true;
    history.replaceState(null, '', location.pathname + '#consult');
    form.querySelector('#c-name').focus();
  });

  const setErr = (name, msg) => {
    const input = form.elements[name];
    const out = form.querySelector(`#e-${name}`);
    if (!input || !out) return;
    out.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  ['name', 'email', 'project'].forEach((n) => form.elements[n].addEventListener('input', () => setErr(n, '')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    body.context = context;
    // Client checks for fast feedback; the server repeats every one.
    const errs = {};
    if (!String(body.name).trim()) errs.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(body.email))) errs.email = 'Enter a valid email address.';
    if (!body.project) errs.project = 'Choose what you would like built.';
    ['name', 'email', 'project'].forEach((n) => setErr(n, errs[n]));
    const first = Object.keys(errs)[0];
    if (first) { form.elements[first].focus(); return; }

    const btn = form.querySelector('[data-submit]');
    const err = form.querySelector('[data-error]');
    const label = btn.innerHTML; btn.textContent = 'Sending…';
    btn.disabled = true; btn.setAttribute('aria-busy', 'true');
    err.hidden = true;
    try {
      const res = await fetch('/api/consult', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        (data.errors || []).forEach((x) => x.field && setErr(x.field, x.message));
        err.textContent = (data.errors || []).filter((x) => !x.field).map((x) => x.message).join(' ') || 'Please fix the highlighted fields.';
        err.hidden = false;
        return;
      }
      form.hidden = true;
      const ok = document.querySelector('[data-success]');
      ok.querySelector('[data-success-msg]').textContent = data.message;
      ok.hidden = false;
      ok.focus();
    } catch {
      err.textContent = "We couldn’t reach the server. Your details are still here, so please try again in a moment.";
      err.hidden = false;
    } finally {
      btn.innerHTML = label; btn.disabled = false; btn.removeAttribute('aria-busy');
    }
  });
}
