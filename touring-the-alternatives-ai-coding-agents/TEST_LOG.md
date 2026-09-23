# TEST_LOG.md — Crimson Bite QA

Date: 2026-09-22  
Scope: `index.html`, `styles.css`, `app.js`  
Not in scope: `PLAN.md` (unchanged)

## Method

- Static review of markup, CSS breakpoints, and cart store logic.
- Headless Chrome screenshots at 768px and 1280px, plus a same-origin 320px iframe (Chrome `--window-size=320` crops a wider layout viewport; the iframe is the accurate 320px pass).
- JavaScriptCore harness covering cart mutations, `localStorage` hydrate, and checkout validation.

## 1. Responsive layout

| Width | Result after fixes |
| --- | --- |
| 320px | Pass. Logo + Cart stay on one row; nav wraps underneath. Hero heading wraps to `NOW.` Full hero copy. Filters wrap (`Sides` / `Drinks` on a second row). Menu is one column; price + Add remain visible. |
| 768px | Pass. Header is a single row (logo, nav, cart). Menu is two columns. All five filters fit. Hero copy is unclipped. Footer stays one column so the contact email does not overflow. |
| 1024px+ | Pass. Menu is three columns. Footer becomes three columns. Header spacing matches the desktop layout. |

### Layout bugs found

1. **320px cart control could leave the first header row** when logo + Cart competed in a wrapping flex row. **Fix:** CSS grid (`minmax(0,1fr) auto`) pins Cart to column 2 on small screens; flex row from 640px up.
2. **Hero title min-content (`HEAT. SALT. NOW.` on one line) widened the page** and clipped neighboring UI. **Fix:** explicit line break before `Now.` and `max-width: 100%` on the heading.
3. **Footer three-column grid started at 640px**, which squeezed `orders@crimsonbite.local` at 768px. **Fix:** three-column footer only from 1024px; `overflow-wrap: anywhere` on footer text.
4. **Cart qty row and menu card actions** could overflow a 320px drawer/card. **Fix:** `flex-wrap` on `.qty-row` and `.card-row`.

## 2. JavaScript edge cases

| Case | Before | After |
| --- | --- | --- |
| Add the same item twice | Pass in the happy path (`qty++`, one row). **Fail** if `localStorage` already had two rows with the same id: `addItem` only incremented the first row. | Pass. Hydrate merges duplicate ids by summing qty. Adding smash twice → one row, qty 2, 3, … |
| Decrease quantity to 0 | Pass for a single row (row removed, empty copy shown, checkout disabled). **Fail** with duplicate ids: `removeItem` deleted every line with that id. | Pass. Duplicates cannot survive hydrate; decrement to 0 removes only that item. |
| Checkout with empty required fields | Pass. `novalidate` + `validateCheckout()` blocks submit; name/phone/address errors show; confirmation stays closed. Whitespace-only name and short phone/address also blocked. | Pass (unchanged behavior, plus submit no-ops if the cart is empty). |
| Cart persists across refresh | Pass. `crimsonBite.cart.v1` is written after every mutation and read on load. | Pass. `saveCart` / `loadCart` are wrapped in `try/catch` so private-mode / quota errors do not break add-to-cart. Corrupt JSON still resets to `[]`. |

## 3. Fixes applied

- [index.html](index.html): hero heading wraps `Now.` on its own line.
- [styles.css](styles.css): mobile header grid, heading/card/footer overflow, qty-row wrap, footer breakpoint 1024px, drawer `max-width: 100%`.
- [app.js](app.js): merge duplicate cart ids on load; safe `localStorage` access; `closest()` for add/qty/remove clicks; block checkout submit when the cart is empty.

## 4. Retest

JavaScriptCore suite: **18/18 passed** (duplicate hydrate, increment, single row, qty→0, empty cart UI, persistence payload, empty and invalid checkout).

Viewport retest (320 iframe, 768, 1280): cart visible, no clipped headline, filters wrap or fit, Add buttons on screen.

## 5. Residual notes

- Headless Chrome `--window-size=320` is not a trustworthy device viewport; use an iframe or DevTools device mode for visual QA at 320px.
- No live multi-tab `storage` event was exercised (handler is present; hydrate path is covered).
- Focus trapping inside the drawer/modals is still simple (Escape + overlay + close), not a full tab loop.
