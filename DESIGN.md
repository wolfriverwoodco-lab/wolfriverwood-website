# DESIGN.md - Wolf River Wood Co.

Source of truth for brand tokens. Built under `hospcreative-site`, with `design-hybrid` handling direction and review.

## Grammar
**Sections are planed into view.** One pass along the grain shaves the rough face off, and the figure comes up.
- Derivation: Q2 (what's hidden, then revealed). Rough-sawn stock hides the figure until a plane pass and the first coat of oil bring it up.
- Seam: a section-coloured "rough face" covers the section. It wipes left to right along the grain, its leading edge carries a thin maple shaving line, and the content settles in behind it. Photos also "wet": a dry veil fades off them after the wipe, the way oil darkens and warms the wood.
- Delivery: the opening plays on load; later sections play on arrival, once each, and stay revealed. No scroll hijack.
- Fallbacks: reduced motion, no JS and print show static content (the overlay is added by JS only).

## Reference
Runyon's Fine Furniture is used for **mechanics only**: the utility bar with the custom-work pill, the centred logo over a category row, the product page (gallery and thumbnails, option chips, add to cart plus a customize route, accordions including Product Care), the category row on the homepage and the custom-commission banner. None of its code, fonts, photos or palette is used.

## Colour (extracted from the client's photos with node-vibrant)
| Token | Light | Dark | From |
|---|---|---|---|
| `--ground` | `#f2f1ed` | `#17110f` | Quiet maple-grey, so the wood in the photos carries the warmth (brief: readable content sits on quiet surfaces) |
| `--surface` | `#e7e4dd` | `#211816` | maple LightMuted `#cfc8b9`, lightened |
| `--ink` | `#1f1412` | `#efe9e1` | walnut DarkVibrant `#1c0c0e` |
| `--ink-2` | `#5a4a42` | `#bfb1a6` | walnut DarkMuted `#583f2f` |
| `--accent` | `#962714` | `#e0805a` | padauk DarkVibrant `#962714` / Vibrant `#d0855d` |
| `--accent-ink` | `#ffffff`-ish `#fbf7f2` | `#17110f` | button label |
| `--wood` | `#1f1412` | `#0f0a09` | utility bar and walnut bands |

There is one accent (padauk) on the whole page. Taste's premium-consumer ban is honoured: no cream ground and no brass accent. The accent is the client's own padauk, not a catalogue clay.

## Type
- Display: **Barlow Condensed** 600/700, uppercase only for short labels. It matches the condensed letterforms in the logo.
- Body: **Barlow** 400/500. Both are self-hosted via @fontsource.
- Scale: 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 (clamp at the large end).

## Shape
- Radius: 4px everywhere (chips, inputs, buttons, images). Square-ish, like a bench-dressed edge. Drawers have 0 on the screen edge.
- No shadows except drawers (tinted walnut, low opacity). No nested cards.

## Motion system (locked)
| Token | Desktop | <768px |
|---|---|---|
| `--d-plane` (wipe) | 900ms | 630ms |
| `--d-settle` (content) | 600ms | 420ms |
| `--d-ui` (drawers, menus, chips) | 280ms | 220ms |
| Eases | `--e-plane: cubic-bezier(.65,0,.35,1)`, `--e-out: cubic-bezier(.16,1,.3,1)`, `--e-in: cubic-bezier(.4,0,1,1)`, `--e-ui: cubic-bezier(.2,.8,.2,1)` | |
| Stagger | 70ms | |
| Breakpoint | 768px (plus 1100px for the 3-up nav) | |

Attribute vocabulary: `data-plane` (section seam), `data-wet` (photo veil), `data-drawer`, `data-drawer-open="id"`, `data-add-to-cart`, `data-cart-count`.

## Logo system (`public/brand`, built by `tools/build_logo.py`)
- `logo-badge(.svg|-cream.svg|-{512,1024,2048}.png)`: the full roundel. Fixed: the source ring was elliptical (1806x1894) and off-centre, and the R in RIVER ran into it. It's now a true circle with clear space.
- `mark-wolf(.svg|-cream.svg)`: the wolf head alone, for the header and small spaces.
- `wordmark(.svg|-cream.svg)`: the "WOLF RIVER / WOOD CO." lettering from the badge, for the horizontal header lockup.
- Favicons: `favicon.svg`, `favicon.ico` (16/32/48), `apple-touch-icon.png`, `icon-192/512.png` and `icon-maskable-512.png`. The wolf strokes are optically thickened at 16-48px, since the line art turns to mush at that size.
- `og-default.jpg` (1200x630) is used for page meta.
- Minimum sizes: the badge at 96px and up; below that, use the mark.

## Wood bands (pattern breaks)

Real wood, never drawn wood. Two bands break the page rhythm, and they look the same in light and dark mode:
walnut is always dark and maple is always light, so each band is a real break in either scheme.

- `.section--wood` / `.band--walnut`: walnut photo texture under a 40% `#1a110d` veil, with light text.
- `.band--padauk` (50% `#1f0f08` veil) and `.band--purpleheart` (30% `#1a0a12` veil): the exotics, the same woods that go into the boards. They have light text, `--ink-2` `#d9cbbf`, and maple as the accent.
- `.section--maple` / `.band--maple`: maple photo texture under a 60% `#f4ece0` veil, with dark text. Inside it, `--ink-2` is `#3f302a` and `--accent` is `#6e1a0c`.
- Each band sets its own colour tokens (`--ink`, `--ink-2`, `--accent`, `--line`, `--surface`...), so everything inside it follows the band.
- `.band` makes a section inside `.wrap` run edge to edge while its content keeps the column. `body` has `overflow-x: clip` for this.
- Home: plain → plain → maple (process) → padauk (gifts) → plain → walnut (the shop) → flat dark footer. Custom: purpleheart (making sequence). About and Work: maple closing call to action. Never put two bands of the same wood next to each other.
- Readability rule: every text colour must pass WCAG AA at the texture's worst pixel (the brightest pixel under walnut, the darkest under maple), not just its average. Measured 2026-11-12 on the rendered pages: 200 text elements, the lowest 5.30:1, on large step numbers that need 3:1. Body text is 6:1 or better.
  Re-measure whenever a veil, texture or band text colour changes. Keep forms off the bands.
- Logo inlay: in the walnut "One shop" band, the badge is filled with pale maple (`--inlay`, ambientCG Wood021, brightened). The cut-outs show the walnut through, a hairline drop-shadow is the glue line, and the oil sheen passes over it.

- **End-grain board in the margin (home, "Heirloom pieces"):** on screens 1680px and wider, the empty right margin holds a CSS cutting board echoing the photo beside it: walnut end-grain blocks, a maple centre strip with purpleheart diamonds, maple rails. Decorative, `aria-hidden`, hidden below 1680px.
- **Logo intro:** home page only, at most once every 3 hours per browser (both builds); `/?intro` forces it.

## Craft ideas (on trial, 2026-11-11)
There are 12 optional treatments (grit dividers and wood-movement hover were dropped on 2026-11-11) drawn from the shop's own process. Each is switched by `html.craft-<id>`, and the registry is in `src/data/craft.json`. Staging shows a **Style checklist** drawer to toggle them, and the release keeps only the ids in `PUBLIC_CRAFT`. See `docs/STYLE-CHECKLIST.md`.
- Shop drawing: dimension lines and a plan-view drawing (`src/lib/shopdraw.js`), the cut list table, the story stick ruler (1440px and up) and the hot-iron maker's mark.
- Finish schedule: an oil sheen across the badge in the final section (`data-oiled`), and an end-grain checker loader.
- Workbench: lumber-crayon tags and tally marks, the making sequence (shop photos only, "photo needed" slots otherwise) and the glue-up cart clamp.
- Content: board passport and growth-ring timeline. Unknown facts are labelled "to confirm".
- Rules: no fake woodgrain textures, crayon texture is a CSS mask (no handwriting font), every motion respects reduced motion, and decorative pieces are `aria-hidden`.
- Saw cut (`saw`, added on Clarke's request): before the cut, everything after "Made to order" is lifted by that section's height (transforms only, no layout shift), so "Furniture and built-ins" sits right under the line. Only the top half of the table-saw blade shows, crossing in 2600ms (1900ms on phones). After a 450ms pause, the lifted content drops back down with a landing bounce (1100ms) while "Made to order" rises into the opening gap with a 3D tilt (950ms). If you scroll past the line first, it settles instantly with scroll compensation. **Waiver:** hospcreative-site's "one grammar" rule; this is a second seam style, added on direct instruction.
- Howling logo intro (`howl`): plays on every page load in the preview build and at most once every 3 hours per browser in the release build (`localStorage` `wrw-intro-at`). It is a 5.6s night scene on one clock (`--i-total`). Letterbox bars slide in over a night ground with grain and vignette. A moon rises behind the wolf, which rises into it as a silhouette and howls (the glow swells, four cream rings roll out). The title is unveiled left to right in cream with a light streak, while the camera slowly pushes in. At daybreak the bars retract and the ground warms from night to walnut, amber and the page ground. The moon sets as the logo recolours to ink and glides into the header, then the veil lifts and the header controls fade in. The framing includes the moon's overhang, so the shot is centred with even margins on phones. Any input skips it, it is skipped with reduced motion, and `?intro` replays it. Mobile Lighthouse with it playing: performance 95 to 96, LCP 2.5 to 2.8s (hero image under the veil), CLS 0.
- Cart drawer: the body sits on real wood grain, a photographed plank texture (maple in light mode, walnut in dark, `public/img/texture/`, vertical grain, 640px seamless tile) under a 72 to 80% ground veil (the drawer keeps the page scheme, unlike the bands), so it reads as a board, not an image. Textures are CC0 from ambientCG (Wood092, Wood067); see `public/img/texture/SOURCES.txt`. Swap in the shop's own lumber photos when they arrive.
- Collierville map (`map`): a stylised OpenStreetMap render (`tools/build_map.py`, `public/img/collierville-map.svg`, 52 KB gzipped). Roads are drawn in cream and maple at 13 to 42% opacity, the rail line dashed, Nonconnah Creek muted, and the Wolf River in padauk with a soft glow. It sits behind "One shop, one piece at a time" at 62% opacity, with parallax drift of about 18% of its height across the scroll (transform only, none with reduced motion). A walnut scrim (86 to 92% behind the copy column, top to bottom on phones) keeps text contrast. The town is named in live text (`.geo`), not on the map, so it never hides under the copy. The "Map data (c) OpenStreetMap contributors" credit is required (ODbL). No shop location is marked.
