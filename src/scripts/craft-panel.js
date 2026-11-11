// Staging-only style checklist: every craft idea toggles live, choices persist in this browser.
import craft from '../data/craft.json';

const KEY = 'wrw-craft-v1';
const html = document.documentElement;
const boxes = [...document.querySelectorAll('[data-craft-toggle]')];
const status = document.querySelector('[data-craft-status]');

const isOn = (id) => html.classList.contains(`craft-${id}`);
function save() {
  const state = Object.fromEntries(craft.items.map((i) => [i.id, isOn(i.id)]));
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: lasts for this page */ }
}
function set(id, on) {
  html.classList.toggle(`craft-${id}`, on);
  document.dispatchEvent(new CustomEvent('craft-change', { detail: { id, on } }));
}
const sync = () => boxes.forEach((b) => (b.checked = isOn(b.value)));
sync();

boxes.forEach((b) => b.addEventListener('change', () => { set(b.value, b.checked); save(); status.textContent = ''; }));
document.querySelectorAll('[data-craft-all]').forEach((btn) => btn.addEventListener('click', () => {
  const on = btn.dataset.craftAll === '1';
  craft.items.forEach((i) => set(i.id, on));
  sync(); save();
  status.textContent = on ? 'All ideas are on.' : 'All ideas are off.';
}));

function picksText() {
  const lines = ['Wolf River Wood – style checklist picks', ''];
  for (const g of craft.groups) {
    lines.push(g.label.toUpperCase());
    for (const i of craft.items.filter((x) => x.group === g.id)) lines.push(`[${isOn(i.id) ? 'x' : ' '}] ${isOn(i.id) ? 'KEEP' : 'DROP'}  ${i.name}`);
    lines.push('');
  }
  const keep = craft.items.filter((i) => isOn(i.id)).map((i) => i.id);
  lines.push(`Release setting: PUBLIC_CRAFT=${keep.join(',')}`);
  return lines.join('\n');
}
document.querySelector('[data-craft-copy]')?.addEventListener('click', async () => {
  const text = picksText();
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Copied. Paste it into Discord or a message to HospCreative.';
  } catch {
    // Clipboard blocked (http, permissions): show the text so it can be copied by hand.
    status.textContent = '';
    const pre = document.createElement('textarea');
    pre.className = 'craft-panel__out'; pre.readOnly = true; pre.value = text; pre.rows = 10;
    pre.setAttribute('aria-label', 'Your picks');
    status.replaceChildren(pre); pre.select();
  }
});
