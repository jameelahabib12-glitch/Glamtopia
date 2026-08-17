# Glamtopia — Guest-facing browse skeleton (Week 1)

Static page skeletons for the guest-facing browse UI, wired to a mock
provider list. No backend, no auth — this is scaffolding to build on top of
once the real API exists.

## Pages

| Page | File | Notes |
|---|---|---|
| Landing | `index.html` | Hero, category quick links, top-rated preview (mock data) |
| Browse/search | `browse.html` | Search, category chips, price + availability filters — client-side against mock data (maps to SRS FR-02/FR-03) |
| Provider profile | `provider.html?id=p1` | Services, mock availability slots, "Fully booked" state (FR-17). Booking buttons redirect guests to `login.html` per FR-13 — no login wall before that point |
| Login | `login.html` | Form skeleton, no auth wired. Shows a banner if arriving via `?next=booking` |
| Register | `register.html` | Form skeleton with customer/provider role toggle (FR-01). Phone field required only for customers, per FR-11 |

## Stack decision

**Tailwind CDN**, loaded via `<script src="https://cdn.tailwindcss.com">` on
every page, with a shared color/font config inline. This worked without any
build step, so the Bootstrap fallback wasn't needed — but if Tailwind's CDN
ever gets blocked (CSP, network policy), swap it for Bootstrap 5's CDN
`<link>` and re-map the utility classes; the custom tokens in
`css/styles.css` don't depend on either framework.

This matches the SRS Assumptions note that the team is working in vanilla
HTML/CSS/JS (no React) — Tailwind here is just a utility-class layer on top
of that, not a framework swap.

## Design tokens (`css/styles.css`) — v2, cooler green palette

Updated to the team's green/beige swatch. Mapping (light → dark):

| Swatch | Hex | Token | Used for |
|---|---|---|---|
| Lightest beige | `#F6F0D8` | `--glam-blush` | Page background |
| Light mint | `#C6DA9F` | `--glam-nav` | Navbar, footer, future sidebars — "a bit darker" than the background |
| Sage | `#9DAD86` | `--glam-rose` | Primary button base |
| Dark olive | `#89986D` | `--glam-gold` | Button hover state, card hairline accent |
| Derived dark | `#33402A` | `--glam-ink` | Headings, body text |
| Derived accent | `#B0623F` | `--glam-warn` | The one non-green color — "fully booked" status and form errors, so they don't blend into a page full of greens |

(Token names like `glam-rose`/`glam-gold` kept from v1 for minimal code
churn — they no longer describe literal rose/gold, just "button base" and
"button hover / accent" respectively.)

- Type: **Fraunces** for headings, **Manrope** for everything else (Google
  Fonts CDN).
- Cards (`.glam-card`) are semi-transparent with a backdrop blur (frosted
  glass) and a real drop shadow, deepening on hover — plus the 2px olive
  hairline across the top, the one recurring motif across all pages.
- Buttons/chips use a real shadow too, darkening on hover.

## Responsiveness

- Header logo and Log in/Sign up buttons scale down (`text-xs`/`px-3`/`py-1.5`
  on mobile) so they never overflow a 320px viewport.
- The landing page's decorative overlapping-card hero visual is `hidden` below
  `sm` (it can't fit narrow phones without redesigning) — mobile gets a clean
  text-only hero instead.
- Landing page nav links collapse into a hamburger-triggered dropdown
  (`#nav-toggle` / `#nav-menu`, logic in `js/nav.js`) below `md`; other pages
  only have the logo + auth buttons, which already fit at every width.
- All grids (`featured-grid`, `results-grid`, service cards) go single-column
  on mobile, 2-up on tablet, 3-up on desktop.

## Mock data (`js/mock-data.js`)

Field names mirror the ERD exactly (`provider_profiles`, `services`) so
swapping in real API calls later is a like-for-like replacement:

```js
// today
const providers = await MockAPI.getProviders();

// later
const providers = await fetch('/api/providers').then(r => r.json());
```

`fully_booked` is a hardcoded flag here for demo purposes only. Per SRS
Section 8, the real system computes this live against `availability_slots`
(any `booked: false` slot with a future `start_time`) rather than storing it.

## What's stubbed vs. real

- **Wired to mock data:** search, category/price/availability filtering on
  browse, provider profile rendering, featured providers on landing.
- **Not wired (static skeleton only):** login/register form submission,
  actual booking creation, real availability slots (provider profile shows
  placeholder time chips, not real `availability_slots` documents).

## Next steps for whoever picks this up

- Replace `MockAPI` calls with real `fetch()` calls once endpoints exist.
- Wire `login.html` / `register.html` forms to `/api/auth/*`.
- Replace the placeholder time chips on `provider.html` with real slots
  from `availability_slots`.