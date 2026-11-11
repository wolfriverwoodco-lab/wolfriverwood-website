# Style checklist: craft ideas

All 14 ideas are built into the preview and switched on. To try them live, open the preview, click **Style checklist** in the yellow notice bar, and tick or untick each one. Changes show immediately and are remembered in your browser. **Copy my picks** gives you a list to paste back to us.

You can also tick them here instead.

## The shop drawing
_Precise and measured, like plans pinned over the bench._

- [ ] **Howling logo intro** (`howl`): On the first page of a visit, the header wolf throws its head back and howls while the lettering zooms in. See it: [Home (replay)](/?intro)
- [ ] **Dimension lines** (`dims`): Section headings get a measured dimension line. Product pages show a plan-view drawing of the board that redraws when you change the size. See it: [Home](/), [End-grain board](/shop/end-grain-cutting-board/)
- [ ] **Cut list spec table** (`cutlist`): The product's choices read like a woodworker's cut list: part, spec, quantity. Updates as you configure. See it: [End-grain board](/shop/end-grain-cutting-board/)
- [ ] **Story stick** (`storystick`): A ruler down the left edge that fills as you scroll. Wide desktop screens only. See it: [Home](/)
- [x] **Maker's mark** (`brand`): The wolf mark pressed into product photos like a hot-iron brand, and stamped on a finished order. See it: [Shop](/shop/)

## The finish schedule
_The finish going on: oil and end grain._

- [x] **Oil sheen** (`oil`): The final, oiled section catches a slow pass of light across the badge when it arrives. See it: [Home (bottom)](/#maker-h)
- [x] **End-grain loader** (`checker`): While a photo or the server is working, a small checkerboard fills in tile by tile, like the end-grain boards. See it: [Pick a pattern](/shop/end-grain-cutting-board/)

## The workbench
_Hand-marked, physical, the shop at work._

- [x] **Lumber crayon marks** (`crayon`): Demo-price and seasonal tags look marked in red lumber crayon. Quantity also shows as tally marks. See it: [End-grain board](/shop/end-grain-cutting-board/), [Shop](/shop/)
- [x] **The making sequence** (`sequence`): Custom page walks through rough lumber, milled, glued up, flattened, oiled. Missing steps show where a shop photo is needed. See it: [Custom orders](/custom/)
- [ ] **Glue-up cart** (`glueup`): Adding to the cart clamps the bag icon and squeezes the new line into place, like a glue-up. See it: [Add a board](/shop/end-grain-cutting-board/)
- [x] **Saw cut between sections** (`saw`): On the homepage, a spinning saw blade runs along the line above “Made to order”, then that section drops down into place. See it: [Home](/#flow-h)

## The craft as proof
_Content that needs real details from the shop._

- [ ] **Collierville map with parallax** (`map`): A stylised map of Collierville in the brand colours drifts behind the "One shop" section as you scroll. See it: [Home (bottom)](/#maker-h)
- [x] **Board passport** (`passport`): Each piece gets a provenance card: wood, source, shop hours, finish, oiled-on date. Needs real details from the shop. See it: [End-grain board](/shop/end-grain-cutting-board/)
- [ ] **Growth-ring timeline** (`rings`): The shop's story as growth rings around the badge, one ring per milestone. Needs the real years from the shop. See it: [Home (bottom)](/#maker-h)

## Needs real details from the shop
The board passport, growth-ring timeline and making sequence show "to confirm" text and "Shop photo needed" slots where real details belong. Nothing there is made up. Keeping them means we need those details before launch.

## Turning picks into the release
The release build keeps only the ideas listed in `PUBLIC_CRAFT`, for example `PUBLIC_CRAFT=dims,cutlist,brand npm run build`. **Copy my picks** writes this line for you.

## Decisions (2026-11-11)
- Kept: maker's mark, oil sheen, end-grain loader, lumber crayon marks, making sequence, saw cut, board passport.
- Dropped and removed from the site: sanding grit dividers, wood movement hover.
- Added after picks: howling logo intro, Collierville map (both open).
- Still open: dimension lines, cut list, story stick, glue-up cart (now visible before the cart opens), growth-ring timeline (now linked to its list on hover).
