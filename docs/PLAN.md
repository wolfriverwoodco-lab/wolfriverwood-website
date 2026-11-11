# Wolf River Wood Co. - First Preview Plan (2026-11-10)

## Outcome
A private, locally verified client preview. A visitor immediately reads "custom woodworking, Collierville TN". They can browse demo products, configure one, see the price update, add it to a right-side cart drawer, and reach a test-mode checkout summary. Large work routes to a free-consultation request that carries the product context. A separate client status page lists done, current, next and waiting-on-client items. Nothing is deployed, charged or sent.

## Verified current state
- Repo: `main`, one commit; local edits to CLAUDE.md and .env.example plus untracked `.ghl-agency` and the brief. All preserved and none touched.
- Drive `wolfriverwood-website/photos／videos`: 33 photos (3 HEIC) and an empty doc. Downloaded to `_client-assets/` (gitignored).
- Discord: owner's references are Runyon's (product-page customization, Product Care, category menus, consult push), Woodland Creek and Quality Woods. Layout only; owner wants our creative direction.
- Logo: Facebook page profile image (1206px raster). Public email on the page: wolfriverwoodco@gmail.com.
- AOS MCP server failed to connect, and the project is not on the roster (brief: do not silently onboard). No leases apply; working only inside this repo.

## Decisions (confirmed with Clarke)
- Reference: Runyon's product page and navigation **mechanics only**. The look is our own.
- Grammar: "Sections are planed into view: one pass along the grain shaves the rough face off and the figure comes up."
- Scope: full local preview with no deploy, no GHL writes and no payments.

## Architecture (proposed defaults)
- Astro static pages plus Cloudflare Pages Functions (`functions/api/*`), targeting the client's Cloudflare Pages.
- `src/data/catalog.json` is the product source. Adding a product does not need a template edit.
- `src/lib/pricing.js` is a pure validate-and-price module shared by the browser (preview) and the Functions (authority). The server re-prices every line. Browser prices are display only.
- Cart: localStorage lines keyed by a hash of product plus normalized selections, so different configurations stay separate lines.
- Checkout `/api/checkout`: re-prices the cart and returns a TEST-MODE summary. There is no payment provider yet.
- Consult `/api/consult`: validates the request and returns `intercepted: true`. Nothing is sent and no CRM write happens in preview.
- Staging notice in the layout, controlled by `PUBLIC_STAGING` (on by default). Preview pages carry noindex, and `robots.txt` disallows all.
- Status page: `status-site/index.html`, self-contained and hosted separately later.

## Sequence
1. Logo rebuild and variants (done: `tools/build_logo.py`).
2. Photo pipeline: HEIC/JPEG to WebP/AVIF at several widths (`tools/build_photos.mjs`), then palette extraction with node-vibrant.
3. Scaffold Astro and DESIGN.md tokens (palette from the photos; Barlow Condensed and Barlow).
4. Layout: utility bar, header with category menu, mobile slide-in menu, cart drawer, footer, staging notice.
5. Pages: home, shop, product configurator, custom work and consult, gallery, about, checkout (test).
6. Functions plus pricing tests (node:test), including manipulated and invalid configurations.
7. Seam (planed wipe) with reduced-motion and no-JS fallbacks.
8. Status page.
9. Verification: unit tests, Playwright e2e (desktop and phone), axe, Lighthouse, html-validate; then the UI/UX audit loop (at most 5 rounds).

## Risks and stop conditions
- Demo prices and options could read as real. Every price shows a "Demo price" label, and the catalog carries `"demo": true`.
- The 768x1024 source photos are soft. Hero crops stay modest and no photo is upscaled past 1.25x.
- Product claims (food safety, specific wood species) are not stated as fact. Species names appear only as option labels marked "to confirm".
- Payment and messages: there is no provider in code, so no live side effect is possible.
- Rollback: everything new is additive files in git. Revert by commit.

## Acceptance
Matches the brief's criteria for the preview scope: identity is clear on phone and desktop; only applicable options show; tampered prices are rejected server-side; cart separates configurations and survives a reload; the consult flow keeps the context; drawers trap and restore focus and close on Esc; reduced motion works; the staging notice never covers controls; the status page is honest.

## Readiness review (self, separate pass)
- Gap found: owner quote and deposit tool, booking calendar and GHL sync are in the brief but outside this pass. Listed as next on the status page, not faked.
- Gap found: HEIC decode in Node. Use Python pillow-heif to convert first, then sharp.
- Gap found: Pages Functions need wrangler for local e2e. Use `npx wrangler pages dev dist`. No Cloudflare auth is needed locally.
- Privacy: the public business email is used and marked "confirm". Family and dog photos are excluded from the storefront until the owner approves.
- Concurrency: none (single agent, no leases available). Preserve the uncommitted user edits and do not commit them.

## Run and verify (local)
```
python tools/build_logo.py      # logo variants + favicons (needs _client-assets/logo source)
python tools/build_photos.py    # WebP/AVIF/thumbs from the Drive photos in _client-assets/
npm run build && npm run preview # wrangler pages dev on http://127.0.0.1:8797 (8788 is taken by another local project)
npm test                        # pricing unit tests
npx playwright test             # 42 e2e checks, desktop + Pixel 7 (needs preview running)
node tests/links.mjs            # internal links/assets
npx html-validate "dist/**/*.html"
```
Git Bash: `export MSYS_NO_PATHCONV=1` before passing URL paths like `/shop/` to node scripts.
Release build: `PUBLIC_STAGING=false npm run build` removes the staging notice and noindex meta; also replace `public/robots.txt` and the `X-Robots-Tag` in `public/_headers`.

---

# Craft styling pass (2026-11-11)

## Outcome
All 13 craft ideas from the brainstorm are built into the preview. Each one can be switched on or off independently. A **Style checklist** drawer, opened from the staging notice, turns them on and off live, remembers the choices in this browser and copies a "keep / drop" list. Defaults: all on. In the release build (`PUBLIC_STAGING=false`) there is no panel, and only the ids listed in `PUBLIC_CRAFT` are on.

## Design
- Registry: `src/data/craft.json` holds the id, group, name, a one-line description and where to see it.
- Switch: `html.craft-<id>`. Blocks that exist only for one idea carry `data-craft="<id>"` and are hidden by a generated rule when it's off. Behaviour in JS checks the class when it runs, so live toggles take effect.
- No flash: an inline head script applies the saved overrides from localStorage (`wrw-craft-v1`) before the page paints.
- Ideas: dims, cutlist, storystick, brand (shop drawing); grit, oil, checker (finish schedule); crayon, sequence, glueup, movement (workbench); passport, rings (content).

## Readiness review
- Content ideas need owner data. The passport, rings and sequence show labelled "to confirm" values or "Photo needed" slots, never invented history, species or claims.
- Seam interaction: new section pseudo-elements aren't direct children, so the plane rule doesn't hide them. Grit lines sit under the plane face.
- Accessibility: decorative pieces are `aria-hidden`. The cut list is a real `<table>` with a caption. Checklist checkboxes have labels. Everything degrades with reduced motion.
- Performance: no new images or fonts; the SVGs are inline and small. The crayon look uses a CSS mask, not a handwriting font.
- Rollback: everything is on branch `feat/craft-styles`. Any idea can also be turned off by removing its id.
- Low memory on this machine: run the e2e tests against the wrangler preview only if it starts. Otherwise verify the pages through the static server and say so.

## Acceptance
Every idea is visible with all on and absent with each switched off (checked one at a time). Choices survive a reload. Copy picks produces the list. The existing e2e tests still pass, html-validate is clean, and the release build has no panel.
