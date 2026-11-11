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
