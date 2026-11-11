import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { priceConfig, lineKey, disallowedChoices, findProduct } from '../../src/lib/pricing.js';

const catalog = JSON.parse(readFileSync(new URL('../../src/data/catalog.json', import.meta.url)));
const board = { selections: { size: 'm', pattern: 'diamond', feet: 'brass', groove: 'yes' }, upsells: ['engrave'], qty: 2 };

test('valid configuration is priced from catalog values only', () => {
  const r = priceConfig(catalog, 'end-grain-cutting-board', board);
  assert.equal(r.ok, true);
  assert.equal(r.unit, 16500 + 6000 + 2500 + 2400 + 1500 + 2000);
  assert.equal(r.total, r.unit * 2);
});

test('browser-supplied prices are ignored', () => {
  const r = priceConfig(catalog, 'end-grain-cutting-board', { ...board, unit: 1, total: 1, price: 1 });
  assert.equal(r.unit, 30900);
});

test('disallowed combination is rejected with its reason', () => {
  const r = priceConfig(catalog, 'end-grain-cutting-board', { ...board, selections: { ...board.selections, size: 's' } });
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /too narrow for a juice groove/);
});

test('unknown choice, unknown option, foreign upsell and bad qty are rejected', () => {
  const r = priceConfig(catalog, 'end-grain-cutting-board', {
    selections: { ...board.selections, pattern: 'gold', bogus: 'x' }, upsells: ['mount'], qty: 0,
  });
  assert.equal(r.ok, false);
  const fields = r.errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ['bogus', 'pattern', 'qty', 'upsells']);
});

test('missing required option is rejected', () => {
  const r = priceConfig(catalog, 'coaster-set', { selections: { shape: 'square' } });
  assert.equal(r.ok, false);
});

test('custom size routes to consultation, no price', () => {
  const r = priceConfig(catalog, 'end-grain-cutting-board', { ...board, selections: { ...board.selections, size: 'custom' } });
  assert.equal(r.consult, true);
  assert.equal(r.unit, null);
});

test('consult-mode products never return a price', () => {
  const r = priceConfig(catalog, 'dining-tables', { selections: { piece: 'dining' } });
  assert.equal(r.consult, true);
  assert.equal(r.total, null);
});

test('threshold routes large orders to consultation only when configured', () => {
  const c = { ...catalog, consultThresholdCents: 50000 };
  assert.equal(priceConfig(c, 'end-grain-cutting-board', board).consult, true);
  assert.equal(priceConfig(catalog, 'end-grain-cutting-board', board).consult, false);
});

test('line keys separate configurations and ignore key order', () => {
  const a = lineKey('x', { a: '1', b: '2' }, ['u2', 'u1']);
  const b = lineKey('x', { b: '2', a: '1' }, ['u1', 'u2']);
  const c = lineKey('x', { a: '1', b: '3' }, []);
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('octagon coasters disallow striped woods', () => {
  const p = findProduct(catalog, 'coaster-set');
  assert.ok(disallowedChoices(p, { shape: 'octagon' }).wood['red-stripe']);
});

test('every catalog photo reference exists in the photo manifest', () => {
  const photos = JSON.parse(readFileSync(new URL('../../src/data/photos.json', import.meta.url)));
  for (const p of catalog.products) {
    for (const s of p.photos) assert.ok(photos[s], `${p.slug} -> ${s}`);
    for (const o of p.options) for (const ch of o.choices) if (ch.photo) assert.ok(photos[ch.photo], `${p.slug}.${o.id}.${ch.id}`);
  }
});
