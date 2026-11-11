// QA screenshots. Usage: node tests/shoot.mjs <path> <outfile> [phone|desktop|og] [--dark] [--reduce] [--full] [--scroll=N]
import { chromium } from '@playwright/test';
const [path, out, vp = 'desktop', ...flags] = process.argv.slice(2);
const sizes = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, og: { width: 1200, height: 630 } };
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: sizes[vp], deviceScaleFactor: vp === 'og' ? 1 : 1, isMobile: vp === 'phone', hasTouch: vp === 'phone',
  colorScheme: flags.includes('--dark') ? 'dark' : 'light', reducedMotion: flags.includes('--reduce') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://127.0.0.1:8797${path}`, { waitUntil: 'networkidle' });
const scroll = flags.find((f) => f.startsWith('--scroll='));
if (flags.includes('--full')) {
  // walk the page so every seam fires, then return to top
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(1600);
  await page.evaluate(() => scrollTo(0, 0));
}
if (scroll) { await page.evaluate((y) => scrollTo(0, y), Number(scroll.split('=')[1])); }
await page.waitForTimeout(2200);
await page.screenshot({ path: out, fullPage: flags.includes('--full'), type: out.endsWith('.jpg') ? 'jpeg' : 'png', quality: out.endsWith('.jpg') ? 88 : undefined });
if (errors.length) console.log('ERRORS:', errors.join('\n'));
await browser.close();
