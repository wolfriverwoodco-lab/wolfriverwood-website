import catalog from '../data/catalog.json';
import photos from '../data/photos.json';
import { findProduct, priceConfig, disallowedChoices, money } from '../lib/pricing.js';
import { cart } from './cart.js';
import { openDrawer } from './site.js';

const root = document.querySelector('[data-pdp]');
const product = root && findProduct(catalog, root.dataset.pdp);
if (product) init(product);

function init(p) {
  const form = root.querySelector('[data-config]');
  const $ = (s) => form.querySelector(s);
  const isBuy = p.mode === 'buy';
  const params = new URLSearchParams(location.search);
  const editKey = params.get('edit');
  let qty = 1;

  // ---- restore a configuration (cart "Edit" link). Unknown values are ignored, not trusted.
  try {
    const cfg = params.get('config') && JSON.parse(params.get('config'));
    if (cfg) {
      for (const [k, v] of Object.entries(cfg.s || {})) {
        const el = form.querySelector(`input[name="${CSS.escape(k)}"][value="${CSS.escape(String(v))}"]`);
        if (el) el.checked = true;
      }
      for (const u of cfg.u || []) { const el = form.querySelector(`input[data-upsell][value="${CSS.escape(u)}"]`); if (el) el.checked = true; }
      if (Number.isInteger(cfg.q) && cfg.q >= 1 && cfg.q <= 10) qty = cfg.q;
    }
  } catch { /* malformed link: start from defaults */ }

  const state = () => {
    const selections = {};
    for (const o of p.options) { const c = form.querySelector(`input[name="${o.id}"]:checked`); if (c) selections[o.id] = c.value; }
    const upsells = [...form.querySelectorAll('input[data-upsell]:checked')].map((i) => i.value);
    return { selections, upsells, qty };
  };

  const consultHref = () => {
    const s = state();
    return `/custom/?product=${encodeURIComponent(p.slug)}&config=${encodeURIComponent(JSON.stringify({ s: s.selections, u: s.upsells }))}#consult`;
  };

  // ---- photos
  const main = root.querySelector('[data-main-photo] img');
  const thumbs = [...root.querySelectorAll('[data-thumb]')];
  function showPhoto(slug) {
    const ph = photos[slug];
    if (!ph || main.dataset.slug === slug) return;
    main.dataset.slug = slug;
    main.classList.add('is-swapping');
    const source = main.parentElement.querySelector('source[type="image/avif"]');
    const avifset = ph.variants.map((v) => `${v.avif} ${v.w}w`).join(', ');
    const webpset = ph.variants.map((v) => `${v.src} ${v.w}w`).join(', ');
    // Pre-decode through a detached <picture> so the browser picks the same format it will display.
    const pic = document.createElement('picture');
    pic.innerHTML = `<source type="image/avif" srcset="${avifset}" sizes="${main.sizes}"><img srcset="${webpset}" sizes="${main.sizes}" alt="">`;
    const pre = pic.querySelector('img');
    const swap = () => {
      if (source) source.srcset = avifset;
      main.srcset = webpset; main.src = ph.variants[Math.min(1, ph.variants.length - 1)].src;
      main.alt = ph.alt; main.classList.remove('is-swapping');
    };
    pre.decode().then(swap, swap);
    thumbs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.thumb === slug)));
  }
  main.dataset.slug = p.photos[0];
  thumbs.forEach((t) => t.addEventListener('click', () => showPhoto(t.dataset.thumb)));

  // ---- render
  const why = (id, msg) => { const el = form.querySelector(`[data-why="${id}"]`); if (el) el.textContent = msg || ''; };
  function render(changedName) {
    // Disable choices the current selections rule out; if the selected one got ruled out, revert it and say why.
    let s = state();
    const blocked = disallowedChoices(p, s.selections);
    for (const o of p.options) {
      why(o.id, '');
      let said = false;
      for (const input of form.querySelectorAll(`input[name="${o.id}"]`)) {
        const reason = blocked[o.id]?.[input.value];
        input.disabled = Boolean(reason);
        input.title = reason || '';
        if (reason && input.checked) {
          input.checked = false;
          const fallback = [...form.querySelectorAll(`input[name="${o.id}"]`)].find((i) => !blocked[o.id]?.[i.value]);
          if (fallback) fallback.checked = true;
          const label = o.choices.find((c) => c.id === input.value)?.label;
          why(o.id, `${label} was switched off. ${reason}`);
          said = true;
        } else if (reason && changedName !== o.id && !said) {
          why(o.id, reason);
          said = true;
        }
      }
    }
    s = state();
    for (const o of p.options) {
      const c = o.choices.find((x) => x.id === s.selections[o.id]);
      const out = form.querySelector(`[data-chosen="${o.id}"]`);
      if (out) out.textContent = c ? c.label : '';
      if (changedName === o.id && c?.photo) showPhoto(c.photo);
    }
    form.querySelectorAll('[data-consult-link]').forEach((a) => (a.href = consultHref()));
    if (!isBuy) return;

    const r = priceConfig(catalog, p.slug, s);
    const route = $('[data-consult-route]');
    const actions = $('[data-buy-actions]');
    const err = $('[data-error]');
    err.hidden = true;
    route.hidden = !r.consult;
    actions.hidden = r.consult;
    $('[data-custom-note]').hidden = r.consult;
    sticky?.classList.toggle('is-hidden', r.consult);
    if (r.consult) {
      $('[data-consult-reason]').textContent = r.consultReason;
      $('[data-price]').textContent = 'Quoted';
      if (stickyPrice) stickyPrice.textContent = 'Quoted';
      return;
    }
    const total = r.ok ? money(r.total) : '-';
    $('[data-price]').textContent = r.ok ? money(r.unit) : money(p.basePrice);
    $('[data-qty]').textContent = String(qty);
    form.querySelector('[data-step="-1"]').disabled = qty <= 1;
    form.querySelector('[data-step="1"]').disabled = qty >= 10;
    $('[data-add-label]').textContent = `${editKey ? 'Update cart' : 'Add to cart'} · ${total}`;
    if (stickyPrice) stickyPrice.textContent = total;
  }

  form.addEventListener('change', (e) => render(e.target.name));
  form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(10, qty + Number(b.dataset.step)));
    render();
  }));

  // ---- add to cart (display price only; server re-prices at checkout)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isBuy) return;
    const s = state();
    const r = priceConfig(catalog, p.slug, s);
    const err = $('[data-error]');
    if (!r.ok || r.consult) {
      err.textContent = r.ok ? r.consultReason : r.errors.map((x) => x.message).join(' ');
      err.hidden = false;
      return;
    }
    cart.add({ slug: p.slug, ...s }, editKey || undefined);
    if (editKey) history.replaceState(null, '', location.pathname);
    openDrawer('cart', $('[data-add]'));
  });

  // ---- mobile sticky buy bar: appears once the real button scrolls out of view
  const sticky = document.querySelector('[data-sticky-buy]');
  const stickyPrice = sticky?.querySelector('[data-sticky-price]');
  if (sticky && isBuy) {
    const addBtn = $('[data-add]');
    sticky.querySelector('[data-sticky-add]').addEventListener('click', () => form.requestSubmit());
    new IntersectionObserver(([en]) => {
      const show = !en.isIntersecting && en.boundingClientRect.top > 0 && !sticky.classList.contains('is-hidden');
      sticky.classList.toggle('is-shown', show);
      sticky.setAttribute('aria-hidden', String(!show));
      sticky.querySelector('[data-sticky-add]').tabIndex = show ? 0 : -1;
    }).observe(addBtn);
  }

  render();
}
