# Crimson Bite — Technical Plan

Responsive food delivery website built with HTML, CSS, and Vanilla JavaScript. Red, black, and white color scheme.

## Workflow

Analyze → Plan (this file) → Implement → Test → Review → Fix

Website source files (`index.html`, `styles.css`, `app.js`) are written only after this plan is on disk.

## Scope

**Included**

- Sticky header with skip link, nav, and cart badge
- Hero with CTA to the menu
- Category filters: All, Burgers, Pizza, Sides, Drinks
- Menu grid with 12+ items
- Cart drawer (add, increment, decrement, remove, totals)
- Checkout modal with client-side validation
- Order confirmation overlay
- Footer (about, hours, contact)

**Excluded**

- Search, promo codes, accounts, real payments/APIs
- Multi-restaurant marketplace
- Frameworks or build tools

**Brand:** Crimson Bite

## File architecture

```
Touring the Alternatives — AI Coding Agents/
  PLAN.md
  index.html      # semantic structure only
  styles.css      # tokens, layout, components, responsive
  app.js          # menu data, cart state, render, events
```

### index.html

Semantic, accessible markup. No inline CSS/JS except stylesheet link and deferred script.

| Region | Role |
| --- | --- |
| Skip link | Jump to `#menu` |
| Header | Logo, nav (Home, Menu, About, Contact), cart toggle + count badge |
| Hero | Headline, short copy, CTA scroll to `#menu` |
| Filters | Button group: All, Burgers, Pizza, Sides, Drinks |
| Menu `#menu` | Cards: placeholder image, name, description, price, Add (`data-id`) |
| Cart drawer | Overlay + aside: line items, qty, remove, totals, Checkout, Close |
| Checkout modal | Name, phone, address, notes; required-field validation |
| Confirmation | Order id, summary, Done (clears cart) |
| Footer | About, hours, contact |

Menu images are CSS color blocks or inline SVG so the site stays self-contained.

### styles.css

Mobile-first. Tokens on `:root`:

- `--red: #c8102e`, `--red-dark: #8b0b1f`
- `--black: #111111`, `--white: #ffffff`
- `--gray: #f4f4f4`, `--muted: #6b6b6b`

Layout: CSS Grid for the menu (1 / 2 / 3 columns). Flex for header, cards, cart rows. Drawer slides from the right; modal is centered with a dim overlay. Breakpoints at `640px` and `1024px`. Visible `:focus-visible` rings. `prefers-reduced-motion` disables transitions.

### app.js

Single IIFE. Responsibilities:

1. `MENU` — static array of `{ id, name, description, price, category }`
2. Cart store — state, persistence, totals
3. Render — menu, filters, cart, badge, checkout/confirm
4. Events — delegated clicks + form submit

## Cart state management

Single source of truth in memory. The DOM is derived. Persist only cart line items.

```js
const STORAGE_KEY = 'crimsonBite.cart.v1';

let cart = []; // [{ id, name, price, qty }]
let activeCategory = 'all';
```

**Mutations**

- `addItem(id)`: if id exists, `qty++`; else push `{ id, name, price, qty: 1 }` from `MENU`
- `setQty(id, qty)`: if `qty < 1`, remove the line
- `removeItem(id)` / `clearCart()`

**Derived totals (never stored)**

- `subtotal` = sum(`price * qty`)
- `tax` = 8% of subtotal
- `delivery` = `0` if subtotal >= 25, else `3.99`
- `total` = subtotal + tax + delivery
- `count` = sum of qty (header badge)

**Persistence**

- After every mutation: `saveCart()` then `renderCart()`
- On load: `loadCart()`
  - parse JSON
  - keep only objects with known `MENU` ids, finite `price`, integer `qty >= 1`
  - on any parse/shape error, reset to `[]` and overwrite storage
- `storage` event listener keeps the badge/drawer in sync across tabs

Checkout success generates order id `CB-` + timestamp slice, shows confirmation, then `clearCart()`.

```
User action → mutate cart → localStorage setItem → render badge/drawer/totals
Page load → loadCart + validate → render
Other tab storage event → hydrate → render
```

## Implementation order

1. Replace empty `index.html` with the full semantic skeleton; wire `styles.css` and `app.js`
2. `styles.css`: tokens, reset, header/hero/grid/drawer/modal/footer, responsive
3. `app.js`: `MENU` (12+ items, 4 categories), cart store + localStorage, filter + menu render
4. Cart drawer interactions and live totals
5. Checkout validation + confirmation + cart clear

## Test checklist

- Filter switches menu cards; All shows every item
- Add same item twice increments qty, not a duplicate row
- Minus to 0 removes the line; Remove works; empty-cart copy shows
- Totals: tax 8%, delivery $3.99 under $25, free at/above $25
- Refresh and new tab restore the same cart
- Corrupt `localStorage` recovers to empty cart
- Checkout: empty fields blocked; valid submit shows confirmation and clears cart
- Drawer/modal close via overlay, close button, and Escape
- Layout at ~375px and ~1280px: no overflow, tap targets usable

## Review checklist

- Contrast (red on black/white)
- Keyboard order
- `aria-expanded` on cart toggle
- `aria-modal` on drawer/modal
- No leftover console errors

## Fix

Patch issues found in Test/Review, then re-check the failed cases only.

## Acceptance

- Three source files plus this PLAN.md
- Site usable on phone and desktop
- Cart survives reload
- Checkout cannot submit invalid data
- Palette is only red, black, white, and supporting grays
