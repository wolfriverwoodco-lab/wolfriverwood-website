// Shop-drawing helpers shared by the product page (build time) and the configurator (browser).
// Sizes come only from the catalog's own size labels ("about 12 x 9 in"); nothing is invented.

const SIZE_RE = /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*in/i;

/** Returns { w, l } in inches (l >= w) for a size choice, or null when it has no stated size. */
export function sizeOf(choice) {
  if (!choice) return null;
  const m = SIZE_RE.exec(`${choice.detail || ''} ${choice.label || ''}`);
  if (!m) return null;
  const a = Number(m[1]); const b = Number(m[2]);
  return { l: Math.max(a, b), w: Math.min(a, b) };
}

const fmt = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)} in`;

/** Plan-view drawing of a board with dimension lines. Scale is shared across sizes so a bigger board looks bigger. */
export function drawingSVG(size, { maxL = 24 } = {}) {
  const W = 340; const H = 230; const pad = 46;
  const scale = (W - pad * 2) / maxL;
  if (!size) {
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Size to be measured on your consultation call"><rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${H - pad * 2 - 20}" rx="4" class="sd-part sd-part--tbd"/><text x="${W / 2}" y="${H / 2}" class="sd-label" text-anchor="middle">Measured on your call</text></svg>`;
  }
  const lw = size.l * scale; const ww = size.w * scale;
  const x = (W - lw) / 2; const y = pad + ((H - pad * 2 - 10) - ww) / 2 + 6;
  const dy = y - 18; const dx = x + lw + 18;
  const t = 5;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Plan view, about ${fmt(size.l)} by ${fmt(size.w)}">`
    + `<rect x="${x}" y="${y}" width="${lw}" height="${ww}" rx="3" class="sd-part"/>`
    // length dimension (top)
    + `<path class="sd-ext" d="M${x} ${y - 4}V${dy - 6}M${x + lw} ${y - 4}V${dy - 6}"/>`
    + `<path class="sd-dim" d="M${x} ${dy}H${x + lw}M${x} ${dy - t}l0 ${t * 2}M${x + lw} ${dy - t}l0 ${t * 2}M${x} ${dy}l${t * 1.6} -${t * .8}M${x} ${dy}l${t * 1.6} ${t * .8}M${x + lw} ${dy}l-${t * 1.6} -${t * .8}M${x + lw} ${dy}l-${t * 1.6} ${t * .8}"/>`
    + `<text x="${x + lw / 2}" y="${dy - 7}" text-anchor="middle" class="sd-label">${fmt(size.l)}</text>`
    // width dimension (right)
    + `<path class="sd-ext" d="M${x + lw + 4} ${y}H${dx + 6}M${x + lw + 4} ${y + ww}H${dx + 6}"/>`
    + `<path class="sd-dim" d="M${dx} ${y}V${y + ww}M${dx - t} ${y}h${t * 2}M${dx - t} ${y + ww}h${t * 2}M${dx} ${y}l-${t * .8} ${t * 1.6}M${dx} ${y}l${t * .8} ${t * 1.6}M${dx} ${y + ww}l-${t * .8} -${t * 1.6}M${dx} ${y + ww}l${t * .8} -${t * 1.6}"/>`
    + `<text x="${dx + 10}" y="${y + ww / 2 + 4}" class="sd-label">${fmt(size.w)}</text>`
    + `</svg>`;
}

/** Cut-list rows from the current selections: [{ part, spec }]. */
export function cutRows(p, selections = {}, upsells = []) {
  const rows = [];
  for (const o of p.options) {
    const c = o.choices.find((x) => x.id === selections[o.id]);
    if (c) rows.push({ part: o.label, spec: c.detail && !/photo coming/i.test(c.detail) ? `${c.label}, ${c.detail}` : c.label });
  }
  for (const u of p.upsells || []) if (upsells.includes(u.id)) rows.push({ part: 'Extra', spec: u.label });
  return rows;
}

/** The wood or pattern choice, for the passport's first line. */
export function woodOf(p, selections = {}) {
  const o = p.options.find((x) => ['wood', 'pattern', 'stripe'].includes(x.id));
  const c = o && o.choices.find((x) => x.id === selections[o.id]);
  return c ? (c.detail && !/photo coming/i.test(c.detail) ? `${c.label} (${c.detail})` : c.label) : null;
}
