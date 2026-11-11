// Screenshots of every craft idea, plus console-error check. Usage: node tests/craft-shots.mjs <outDir>
import { chromium } from '@playwright/test';
const BASE = process.env.BASE || 'http://127.0.0.1:8797';
const out = process.argv[2] || 'test-results/craft';
const browser = await chromium.launch();
const errors = [];
async function page(vp, mobile = false) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errors.push(`${p.url()}: ${m.text()}`));
  p.on('pageerror', (e) => errors.push(`${p.url()}: ${e.message}`));
  return p;
}
const shot = async (p, name, opts = {}) => p.screenshot({ path: `${out}/${name}.png`, ...opts });

const d = await page({ width: 1440, height: 900 });
await d.goto(`${BASE}/`); await d.waitForTimeout(400);
await shot(d, 'home-top');
for (const sel of ['#rail-h', '#flow-h', '#banner-h', '#work-h', '#maker-h']) {
  await d.locator(sel).scrollIntoViewIfNeeded(); await d.evaluate(() => scrollBy(0, -140)); await d.waitForTimeout(200);
  await shot(d, `home-${sel.slice(1)}`);
}
await d.goto(`${BASE}/shop/`); await d.waitForTimeout(300); await d.evaluate(() => scrollTo(0, 260)); await shot(d, 'shop');
await d.goto(`${BASE}/shop/end-grain-cutting-board/`); await d.waitForTimeout(300);
await shot(d, 'pdp-top');
await d.locator('label[for="size-l"]').click(); await d.locator('[data-step="1"]').click(); await d.locator('[data-step="1"]').click();
for (let i = 0; i < 4; i++) await d.locator('[data-step="1"]').click();
await d.locator('.drawing').scrollIntoViewIfNeeded(); await d.evaluate(() => scrollBy(0, -200));
await shot(d, 'pdp-drawing');
await d.locator('.passport').scrollIntoViewIfNeeded(); await shot(d, 'pdp-passport');
await d.locator('[data-add]').click(); await d.waitForTimeout(500); await shot(d, 'cart');
await d.goto(`${BASE}/custom/`); await d.waitForTimeout(300); await d.evaluate(() => scrollTo(0, 150)); await shot(d, 'custom-sequence');
// checklist panel
await d.goto(`${BASE}/`); await d.locator('.staging__btn').click(); await d.waitForTimeout(300); await shot(d, 'panel');
// all off
await d.locator('[data-craft-all="0"]').click(); await d.keyboard.press('Escape'); await d.waitForTimeout(300);
const offClasses = await d.evaluate(() => document.documentElement.className);
await d.reload(); await d.waitForTimeout(300);
const afterReload = await d.evaluate(() => document.documentElement.className);
const visibleCraft = await d.evaluate(() => [...document.querySelectorAll('[data-craft]')].filter((e) => e.getClientRects().length).length);
await d.evaluate(() => localStorage.removeItem('wrw-craft-v1'));

const m = await page({ width: 412, height: 860 }, true);
await m.goto(`${BASE}/`); await m.waitForTimeout(300); await shot(m, 'm-home');
await m.locator('#maker-h').scrollIntoViewIfNeeded(); await m.evaluate(() => scrollBy(0, -300)); await shot(m, 'm-maker');
await m.goto(`${BASE}/shop/end-grain-cutting-board/`); await m.waitForTimeout(300);
await m.locator('.drawing').scrollIntoViewIfNeeded(); await m.evaluate(() => scrollBy(0, -120)); await shot(m, 'm-pdp-drawing');
await m.goto(`${BASE}/custom/`); await m.waitForTimeout(300); await m.evaluate(() => scrollTo(0, 200)); await shot(m, 'm-custom');
const overflow = await m.evaluate(() => document.documentElement.scrollWidth > innerWidth);

console.log(JSON.stringify({ offClasses, afterReload, visibleCraftWhenOff: visibleCraft, mobileOverflow: overflow, errors }, null, 1));
await browser.close();
