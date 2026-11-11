// Internal link + asset check against the running preview (every href/src/srcset in every built page).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const base = 'http://127.0.0.1:8797';
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && pages.push(p); } })('dist');
const urls = new Set();
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"#]+)/g)) if (m[1].startsWith('/')) urls.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach((s) => urls.add(s.trim().split(' ')[0]));
  for (const m of html.matchAll(/url\((\/[^)]+)\)/g)) urls.add(m[1]);
}
for (const f of readdirSync('dist/_astro').filter((f) => f.endsWith('.css'))) for (const m of readFileSync(join('dist/_astro', f), 'utf8').matchAll(/url\((\/[^)"']+)\)/g)) urls.add(m[1]);
let bad = 0;
await Promise.all([...urls].map(async (u) => { const r = await fetch(base + u); if (r.status >= 400) { bad++; console.log('BROKEN', r.status, u); } }));
console.log(`${pages.length} pages, ${urls.size} internal URLs, ${bad} broken`);
process.exit(bad ? 1 : 0);
