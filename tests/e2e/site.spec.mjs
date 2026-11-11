import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PDP = '/shop/end-grain-cutting-board/';
const pick = (page, id) => page.locator(`label[for="${id}"]`).click();
const addBtn = (page) => page.locator('[data-add]');

test.beforeEach(async ({ page }) => {
  // The logo intro plays once per visit; most tests start as a returning page view.
  await page.addInitScript(() => { if (!location.search.includes('intro')) window.__wrwNoIntro = true; });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('home identifies custom woodworking in Collierville above the fold', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveText(/Heirloom furniture, built by hand/);
  await expect(page.locator('.hero__place')).toContainText('Collierville, Tennessee');
  const box = await h1.boundingBox();
  expect(box.y + box.height).toBeLessThan(page.viewportSize().height);
  await expect(page.locator('.hero .btn')).toBeInViewport();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('.staging')).toContainText('being built by HospCreative');
});

test('seam reveals every section and nothing stays covered', async ({ page }) => {
  await page.goto('/');
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 300) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
  // The saw cut (cut, pause, fall, rise) takes about 5s, so allow up to 8s for every section to arrive.
  await page.waitForFunction(() => [...document.querySelectorAll('[data-plane]')].every((s) => s.classList.contains('is-planed')), null, { timeout: 8000 });
  const covered = await page.evaluate(() => [...document.querySelectorAll('[data-plane]')].filter((s) => !s.classList.contains('is-planed')).length);
  expect(covered).toBe(0);
  // the saw section ends fully in place, not mid-animation
  await page.waitForFunction(() => { const t = document.querySelector('[data-saw-target]'); return !t || getComputedStyle(t).clipPath !== 'inset(0px 0px 100%)'; }, null, { timeout: 8000 });
  // scroll back up: revealed content stays revealed
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('[data-plane] h2, [data-plane] h1')).opacity);
  expect(Number(op)).toBe(1);
});

test('reduced motion renders content with no seam', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8797/');
  expect(await page.evaluate(() => document.documentElement.classList.contains('plane-ready'))).toBe(false);
  expect(await page.locator('.plane-face').count()).toBe(0);
  await ctx.close();
});

test('configurator: price updates, rule blocks groove on small, consult route keeps context', async ({ page }) => {
  await page.goto(PDP);
  await expect(page.locator('[data-price]')).toHaveText('$165');
  await pick(page, 'size-l');
  await pick(page, 'groove-yes');
  await pick(page, 'feet-brass');
  await expect(page.locator('[data-price]')).toHaveText('$334');
  await expect(addBtn(page)).toContainText('$334');
  // paid extras are never preselected
  expect(await page.locator('input[name="upsell"]:checked').count()).toBe(0);
  // small board: groove is switched off and the reason is shown
  await pick(page, 'size-s');
  await expect(page.locator('#groove-yes')).toBeDisabled();
  await expect(page.locator('#groove-no')).toBeChecked();
  await expect(page.locator('[data-why="groove"]')).toContainText('too narrow');
  // custom size routes to consultation, selections preserved in the link
  await pick(page, 'size-custom');
  await expect(page.locator('[data-consult-route]')).toBeVisible();
  await expect(page.locator('[data-buy-actions]')).toBeHidden();
  await page.locator('[data-consult-route] a').click();
  await expect(page).toHaveURL(/\/custom\/\?product=end-grain-cutting-board/);
  await expect(page.locator('[data-context]')).toContainText('Custom size');
  await expect(page.locator('[data-context]')).toContainText('Brass feet');
  await expect(page.locator('#c-project')).toHaveValue('Custom board or gift');
});

test('cart: separate configurations, reload persistence, qty, edit, remove, focus', async ({ page }) => {
  await page.goto(PDP);
  await pick(page, 'size-m');
  await addBtn(page).click();
  const drawer = page.locator('#drawer-cart');
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-drawer-close]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(addBtn(page)).toBeFocused(); // focus restored to opener
  // same product, different config -> second line
  await pick(page, 'size-l');
  await addBtn(page).click();
  await expect(drawer.locator('.cart-line')).toHaveCount(2);
  // same config again -> merges
  await page.keyboard.press('Escape');
  await addBtn(page).click();
  await expect(drawer.locator('.cart-line')).toHaveCount(2);
  await expect(page.locator('[data-cart-count]')).toHaveText('3');
  // reload keeps the cart
  await page.reload();
  await expect(page.locator('[data-cart-count]')).toHaveText('3');
  await page.locator('[data-cart-button]').click();
  await expect(drawer.locator('.cart-line')).toHaveCount(2);
  // qty and remove
  const first = drawer.locator('.cart-line').first();
  await first.locator('[data-qty="1"]').click();
  await expect(page.locator('[data-cart-count]')).toHaveText('4');
  await first.locator('[data-remove]').click();
  await expect(drawer.locator('.cart-line')).toHaveCount(1);
  // edit returns to the configurator with the line's choices
  await drawer.locator('a', { hasText: 'Edit' }).click();
  await expect(page.locator('#size-l')).toBeChecked();
  await expect(addBtn(page)).toContainText('Update cart');
  await pick(page, 'pattern-diamond');
  await addBtn(page).click();
  await expect(drawer.locator('.cart-line')).toHaveCount(1);
  await expect(drawer.locator('.cart-line')).toContainText('Diamond band');
});

test('removing a cart line can be undone', async ({ page }) => {
  await page.goto(PDP);
  await addBtn(page).click();
  const drawer = page.locator('#drawer-cart');
  await drawer.locator('[data-remove]').click();
  await expect(drawer.locator('.cart-line')).toHaveCount(0);
  await expect(drawer.locator('[data-undo]')).toBeFocused();
  await drawer.locator('[data-undo]').click();
  await expect(drawer.locator('.cart-line')).toHaveCount(1);
  await expect(page.locator('[data-cart-count]')).toHaveText('1');
});

test('auto-switched choice explains itself', async ({ page }) => {
  await page.goto('/shop/coaster-set/');
  await pick(page, 'shape-octagon');
  await expect(page.locator('#wood-walnut')).toBeChecked();
  await expect(page.locator('[data-why="wood"]')).toContainText('Red stripe was switched off');
});

test('empty cart state is useful', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-cart-button]').click();
  await expect(page.locator('.cart-empty')).toContainText('Your cart is empty');
  await expect(page.locator('.cart-empty a')).toHaveAttribute('href', '/shop/');
});

test('checkout re-prices on the server; tampered price is ignored', async ({ page }) => {
  await page.goto(PDP);
  await pick(page, 'size-m');
  await addBtn(page).click();
  await page.goto('/checkout/');
  await expect(page.locator('[data-sum-total]')).toHaveText('$225');
  await page.locator('[data-submit]').click();
  await expect(page.locator('#e-name')).toHaveText('Enter your name.');
  await expect(page.locator('#k-name')).toBeFocused();
  await page.fill('#k-name', 'Test Buyer');
  await page.fill('#k-email', 'test@example.com');
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-success]')).toContainText('No payment was taken');
  await expect(page.locator('[data-success]')).toContainText('$225');
  await expect(page.locator('[data-cart-count]')).toBeHidden();
});

test('API rejects manipulated and invalid configurations', async ({ request }) => {
  const ok = await request.post('/api/checkout', { data: { contact: { name: 'a', email: 'a@b.co' }, lines: [{ slug: 'coaster-set', selections: { shape: 'square', wood: 'walnut', count: '4' }, qty: 1, unit: 1 }] } });
  const okBody = await ok.json();
  expect(okBody.ok).toBe(true);
  expect(okBody.subtotal).toBe(4800);
  expect(okBody.lines[0].priceChanged).toBe(true);
  const bad = await request.post('/api/checkout', { data: { contact: { name: 'a', email: 'a@b.co' }, lines: [{ slug: 'coaster-set', selections: { shape: 'octagon', wood: 'red-stripe', count: '4' } }] } });
  expect(bad.status()).toBe(422);
  expect((await bad.json()).errors[0].message).toMatch(/walnut only/);
  const consult = await request.post('/api/checkout', { data: { contact: { name: 'a', email: 'a@b.co' }, lines: [{ slug: 'dining-tables', selections: {} }] } });
  expect(consult.status()).toBe(422);
  const junk = await request.post('/api/price', { data: Buffer.from('not json'), headers: { 'content-type': 'application/json' } });
  expect(junk.status()).toBe(400);
  const empty = await request.post('/api/checkout', { data: { lines: [] } });
  expect(empty.status()).toBe(422);
});

test('consult form validates, then is intercepted (nothing sent)', async ({ page }) => {
  await page.goto('/custom/#consult');
  await page.locator('[data-submit]').click();
  await expect(page.locator('#e-email')).toHaveText(/valid email/);
  await page.fill('#c-name', 'Test Person');
  await page.fill('#c-email', 'test@example.com');
  await page.selectOption('#c-project', 'Dining Tables & Sets');
  await page.locator('[data-submit]').click();
  await expect(page.locator('[data-success]')).toContainText('not sent');
  await expect(page.locator('[data-success]')).toBeFocused();
});

test('mobile menu drawer opens, traps, closes and restores focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu drawer is the phone navigation');
  await page.goto('/');
  const btn = page.locator('[data-drawer-open="menu"]');
  await btn.click();
  const d = page.locator('#drawer-menu');
  await expect(d).toBeVisible();
  await d.locator('summary').first().click();
  await expect(d.locator('details').first().locator('a').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await expect(btn).toBeFocused();
});

test('desktop category menu works by keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop nav');
  await page.goto('/');
  const t = page.locator('[data-menu-toggle]').first();
  await t.focus();
  await page.keyboard.press('Enter');
  await expect(t).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#pop-dining a').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(t).toHaveAttribute('aria-expanded', 'false');
  await expect(t).toBeFocused();
});

test('staging notice stays visible while scrolling', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, 2500));
  await page.waitForTimeout(300);
  await expect(page.locator('.staging')).toBeInViewport();
});

test('staging notice never covers the add-to-cart controls', async ({ page }) => {
  await page.goto(PDP);
  await page.locator('[data-add]').scrollIntoViewIfNeeded();
  const n = await page.locator('.staging').boundingBox();
  const a = await page.locator('[data-add]').boundingBox();
  const overlap = !(n.x + n.width <= a.x || a.x + a.width <= n.x || n.y + n.height <= a.y || a.y + a.height <= n.y);
  expect(overlap).toBe(false);
});

for (const path of ['/', '/shop/', PDP, '/shop/dining-tables/', '/shop/bathroom-vanities/', '/custom/', '/work/', '/checkout/', '/about/', '/care/']) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('[data-plane]').forEach((s) => s.classList.add('is-planed', 'is-done')));
    await page.waitForTimeout(1200);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const v = r.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
    expect(v, v.join('\n')).toEqual([]);
  });
}

test('style checklist toggles each craft idea live and remembers it', async ({ page }) => {
  await page.goto('/shop/end-grain-cutting-board/');
  await page.evaluate(() => localStorage.removeItem('wrw-craft-v1'));
  await page.reload();
  // every idea starts on in the preview
  await expect(page.locator('.cutlist')).toBeVisible();
  await expect(page.locator('.passport')).toBeVisible();
  // the cut list and drawing follow the configuration
  await pick(page, 'size-l');
  await expect(page.locator('[data-cutlist]')).toContainText('Large, about 20 x 14 in');
  await expect(page.locator('[data-drawing] svg')).toHaveAttribute('aria-label', /20 in by 14 in/);
  // switch the cut list off from the checklist
  await page.locator('.staging__btn').click();
  await page.locator('label[for="craft-cutlist"]').click();
  await expect(page.locator('html')).not.toHaveClass(/craft-cutlist/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.cutlist')).toBeHidden();
  // survives a reload, others untouched
  await page.reload();
  await expect(page.locator('.cutlist')).toBeHidden();
  await expect(page.locator('.passport')).toBeVisible();
  // all off hides every idea's blocks
  await page.locator('.staging__btn').click();
  await page.locator('[data-craft-all="0"]').click();
  await expect(page.locator('[data-craft-status]')).toHaveText('All ideas are off.');
  const visible = await page.evaluate(() => [...document.querySelectorAll('[data-craft]')].filter((e) => e.getClientRects().length).length);
  expect(visible).toBe(0);
  await page.evaluate(() => localStorage.removeItem('wrw-craft-v1'));
});

test('logo intro: centred, howls, glides into the header, skippable', async ({ page }) => {
  await page.goto('/?intro');
  const lock = page.locator('.lockup--header');
  await expect(page.locator('html')).toHaveClass(/intro/);
  await page.waitForTimeout(1200);
  const mid = await lock.boundingBox();
  const vp = page.viewportSize();
  expect(Math.abs(mid.x + mid.width / 2 - vp.width / 2)).toBeLessThan(40); // centred while it plays
  // finishes on its own and lands in the header
  await expect(page.locator('html')).not.toHaveClass(/intro/, { timeout: 7000 });
  await expect(lock).toHaveCSS('transform', 'none');
  await expect(page.locator('.hero')).toHaveClass(/is-planed/);
  // preview build: every page load plays it, including clicking to another page
  await page.evaluate(() => { window.__wrwNoIntro = false; });
  await page.goto('/shop/?intro');
  await expect(page.locator('html')).toHaveClass(/intro/);
  await expect(page.locator('html')).not.toHaveClass(/intro/, { timeout: 7000 });
  // any input skips it
  await page.goto('/?intro');
  await page.mouse.click(10, vp.height - 10);
  await expect(page.locator('html')).not.toHaveClass(/intro/, { timeout: 1000 });
});
