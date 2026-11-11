import { cart, editHref, money } from './cart.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- drawers: native modal <dialog> (inert background, Esc), plus slide motion and focus restore ---------- */
const openers = new Map();
export function openDrawer(id, opener) {
  const d = $(`[data-drawer="${id}"]`);
  if (!d || d.open) return;
  openers.set(d, opener || document.activeElement);
  d.showModal();
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
  const first = d.querySelector('[data-autofocus]') || d.querySelector('[data-drawer-close]');
  first?.focus();
}
function closeDrawer(d) {
  if (!d.open || d.dataset.closing) return;
  d.dataset.closing = '1';
  d.classList.remove('is-open');
  const done = () => {
    d.close(); delete d.dataset.closing;
    document.documentElement.style.overflow = '';
    const o = openers.get(d);
    if (o && document.contains(o)) o.focus();
  };
  const ms = reduce.matches ? 0 : parseFloat(getComputedStyle(d).transitionDuration) * 1000;
  setTimeout(done, ms || 0);
}
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-drawer-open]');
  if (open) { e.preventDefault(); openDrawer(open.dataset.drawerOpen, open); return; }
  const close = e.target.closest('[data-drawer-close]');
  if (close) { closeDrawer(close.closest('dialog')); return; }
  if (e.target.matches('dialog.drawer')) closeDrawer(e.target); // backdrop click
});
$$('dialog.drawer').forEach((d) => d.addEventListener('cancel', (e) => { e.preventDefault(); closeDrawer(d); }));
// Following a link inside a drawer closes it so Back returns to a clean page.
$$('dialog.drawer').forEach((d) => d.addEventListener('click', (e) => { if (e.target.closest('a[href]')) closeDrawer(d); }));
addEventListener('resize', () => { if (innerWidth >= 1024) { const m = $('[data-drawer="menu"]'); if (m?.open) closeDrawer(m); } });

/* ---------- desktop category menus: click/Enter toggles, hover opens, Esc closes ---------- */
const toggles = $$('[data-menu-toggle]');
function setMenu(btn, open) {
  btn.setAttribute('aria-expanded', String(open));
  btn.nextElementSibling.classList.toggle('is-open', open);
}
const closeAll = (except) => toggles.forEach((b) => b !== except && setMenu(b, false));
toggles.forEach((btn) => {
  const item = btn.parentElement;
  let t;
  btn.addEventListener('click', () => { const o = btn.getAttribute('aria-expanded') !== 'true'; closeAll(btn); setMenu(btn, o); });
  item.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(t); closeAll(btn); setMenu(btn, true); });
  item.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; t = setTimeout(() => setMenu(btn, false), 160); });
  item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) setMenu(btn, false); });
  item.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(btn, false); btn.focus(); } });
});
document.addEventListener('click', (e) => { if (!e.target.closest('.nav__item')) closeAll(); });

/* ---------- the seam: sections are planed into view ---------- */
function initSeam() {
  if (!document.documentElement.classList.contains('plane-ready')) return;
  const sections = $$('[data-plane]');
  const plane = (el) => {
    if (el.classList.contains('is-planed')) return;
    el.classList.add('is-planed');
    const face = el.querySelector(':scope > .plane-face');
    face?.addEventListener('transitionend', () => el.classList.add('is-done'), { once: true });
  };
  sections.forEach((el) => {
    const face = document.createElement('span');
    face.className = 'plane-face';
    face.setAttribute('aria-hidden', 'true');
    el.prepend(face);
  });
  // Opening: anything already on screen plays on load (never waits for a scroll it can’t get).
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { plane(en.target); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  sections.forEach((el) => io.observe(el));
  // Deep links / reloads mid-page: reveal everything above the viewport immediately.
  requestAnimationFrame(() => sections.forEach((el) => { if (el.getBoundingClientRect().bottom < 0) { plane(el); el.classList.add('is-done'); } }));
  // Safety net: nothing may stay covered (e.g. a tall section in a short viewport).
  setTimeout(() => sections.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) plane(el); }), 2500);
  // Reduced motion switched on mid-visit: drop the seam entirely.
  reduce.addEventListener('change', (e) => { if (e.matches) { sections.forEach(plane); document.documentElement.classList.remove('plane-ready'); } });
}
initSeam();

/* ---------- cart drawer rendering ---------- */
const body = $('[data-cart-body]');
const foot = $('[data-cart-foot]');
const count = $('[data-cart-count]');
const cartBtn = $('[data-cart-button]');
let lastCount = cart.count();
let lastRemoved = null; // { line, name } for one-step undo

function renderCart() {
  const lines = cart.priced();
  const n = cart.count();
  count.textContent = String(n);
  count.hidden = n === 0;
  cartBtn.setAttribute('aria-label', `Open cart, ${n} item${n === 1 ? '' : 's'}`);
  if (n > lastCount && !reduce.matches) { count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); }
  lastCount = n;
  const undo = lastRemoved ? `<p class="undo" role="status">Removed ${esc(lastRemoved.name)}. <button class="text-btn" type="button" data-undo>Undo</button></p>` : '';
  if (!lines.length) {
    body.innerHTML = undo + `<div class="cart-empty"><p>Your cart is empty. Every piece is made to order, so start with a board, a set of coasters or a holiday tray.</p><a class="btn" href="/shop/">Shop the workshop</a></div>`;
    foot.hidden = true;
    return;
  }
  foot.hidden = false;
  $('[data-cart-subtotal]').textContent = money(lines.filter((l) => l.ok).reduce((s, l) => s + l.total, 0));
  body.innerHTML = undo + lines.map((l) => `
    <article class="cart-line" data-key="${esc(l.key)}">
      <img src="${esc(l.thumb)}" alt="" width="76" height="76" loading="lazy" />
      <div>
        <h3>${esc(l.product?.name || 'Unavailable item')}</h3>
        <dl>${l.parts.map((p) => `<dt>${esc(p.label)}</dt><dd>${esc(p.value)}</dd>`).join('')}</dl>
        ${l.problem ? `<p class="form-error" role="alert">${esc(l.problem)}</p>` : ''}
        <div class="cart-line__tools">
          <div class="qty" role="group" aria-label="Quantity for ${esc(l.product?.name || 'item')}">
            <button type="button" data-qty="-1" aria-label="Decrease quantity"><svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"/></svg></button>
            <output aria-live="polite">${l.qty}</output>
            <button type="button" data-qty="1" aria-label="Increase quantity" ${l.qty >= 10 ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg></button>
          </div>
          ${l.product ? `<a class="text-btn" href="${esc(editHref(l))}">Edit</a>` : ''}
          <button class="text-btn" type="button" data-remove>Remove</button>
        </div>
      </div>
      <div class="cart-line__price">${l.ok ? money(l.total) : '-'}</div>
    </article>`).join('');
}
body?.addEventListener('click', (e) => {
  if (e.target.closest('[data-undo]') && lastRemoved) {
    const { line: l } = lastRemoved;
    lastRemoved = null;
    cart.add({ slug: l.slug, selections: l.selections, upsells: l.upsells, qty: l.qty });
    $(`.cart-line[data-key="${CSS.escape(l.key)}"] [data-remove]`)?.focus();
    return;
  }
  const line = e.target.closest('.cart-line');
  if (!line) return;
  const key = line.dataset.key;
  const l = cart.lines().find((x) => x.key === key);
  if (e.target.closest('[data-remove]')) {
    lastRemoved = { line: { ...l }, name: line.querySelector('h3')?.textContent || 'item' };
    cart.remove(key);
    $('[data-undo]')?.focus();
  }
  const q = e.target.closest('[data-qty]');
  if (q && l) {
    lastRemoved = null;
    cart.setQty(key, l.qty + Number(q.dataset.qty));
    const again = $(`.cart-line[data-key="${CSS.escape(key)}"] [data-qty="${q.dataset.qty}"]`);
    (again && !again.disabled ? again : $(`.cart-line[data-key="${CSS.escape(key)}"] [data-qty="-1"]`) || $('[data-drawer="cart"] [data-drawer-close]'))?.focus();
  }
});
cart.subscribe(renderCart);
renderCart();
