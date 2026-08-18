<<<<<<< HEAD

# Glamtopia — Guest-facing browse skeleton (Week 1) + FAQ/chatbot (Week 2)
 
Static page skeletons for the guest-facing browse UI, wired to a mock
provider list. No backend, no auth — this is scaffolding to build on top of
once the real API exists.
 
## Week 2 — FAQ content + chatbot placement
 
Wired up the chatbot widget a teammate built (`js/chatbot-widget.js`,
untouched) onto every page, and seeded real FAQ content for it to serve.
 
**New files:**
- `js/config.js` — one place holding `API_BASE`. Currently
  `http://localhost:5000/api` — **update this to the real Vercel URL once
  deployment (task 5) is done.**
- `js/chatbot-init.js` — builds the widget's `<script>` tag at runtime
  with the right `data-api-base` and `data-provider-id`, instead of a
  static tag hardcoded per page. This is what lets `provider.html` pass
  the correct provider ID automatically (set in `js/provider.js` as soon
  as the URL is parsed) so the widget pulls that provider's own FAQs
  alongside the general ones.
- `js/chatbot-widget.js` — copied verbatim from the teammate's branch,
  not modified.
- `css/styles.css` — added a palette override at the bottom (`!important`,
  since the widget injects its own `<style>` tag at runtime, after ours)
  so the chatbot matches the site instead of its default purple.
**Content:** `../backend-addition/seed/seedFaqs.js` — a seed script for
10 general platform FAQs (booking, account, general categories). Drop it
into `server/seed/seedFaqs.js` in the backend repo and run
`node seed/seedFaqs.js` (needs `.env` with `MONGO_URI` set, same as running
the server). It's idempotent — clears existing general FAQs
(`provider_id: null`) before inserting, safe to re-run.
 
**Testing locally:** the backend's CORS is locked to `CLIENT_URL` with
`credentials: true`, so opening the HTML files directly (`file://`) won't
work — serve this folder with a local static server (e.g. `npx serve` or
`python3 -m http.server`) and make sure the backend's `CLIENT_URL` env var
matches that origin.
 
**Found but out of scope for this task, flagging for the team:**
- `providerFaqRoutes.js` exists in the backend but isn't mounted in
  `server.js` — and it operates on a separate `ProviderFAQ` model that the
  chatbot widget never queries (the widget only calls `/api/faqs`, which
  reads the `Faq` model). Looks like two parallel FAQ systems from
  different branches that never got reconciled — worth a team conversation
  before more content goes into either one.
## Week 1 — Guest-facing browse skeleton
 
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
 
=======
# Glamtopia Backend — Week 1 Scaffold

Express + MongoDB backend scaffold for Glamtopia, covering Week 1 tasks:

- [x] Express project scaffold (MVC structure)
- [x] MongoDB connection (with connection caching for serverless reuse)
- [x] Session-based auth: register + login (bcrypt password hashing)
- [x] Session middleware: route protection for Customer vs Provider
- [x] Session vs JWT explanation (`docs/session-vs-jwt.md`)

## Folder structure

```
glamtopia-backend/
├── server.js                 # Entry point: middleware, session, routes, DB connect
├── config/
│   └── db.js                 # Mongoose connection with caching (Vercel-safe)
├── models/
│   └── User.js                # Base user schema (customer/provider role) — extend once ERD is final
├── controllers/
│   └── authController.js      # register, login, logout, getMe logic
├── routes/
│   ├── authRoutes.js          # /api/auth/*
│   └── demoProtectedRoutes.js # temporary routes to demo role-based protection
├── middleware/
│   └── authMiddleware.js      # requireAuth, requireRole("customer"/"provider")
├── docs/
│   └── session-vs-jwt.md      # demo prep notes
├── .env.example
└── .gitignore
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in real values:
   - `MONGO_URI` — your MongoDB Atlas connection string (placeholder for now)
   - `SESSION_SECRET` — any long random string
3. `npm run dev` (uses nodemon) or `npm start`

The server won't start until it can connect to MongoDB — that's intentional,
so a broken DB connection fails loudly instead of silently.

## Testing the auth flow manually (e.g. with Postman/Thunder Client)

1. `POST /api/auth/register` with body:
   ```json
   { "name": "Ayesha", "email": "ayesha@test.com", "password": "test123", "role": "customer" }
   ```
2. `GET /api/auth/me` — should return the logged-in user (cookie is sent automatically).
3. `GET /api/demo/customer-only` — should succeed for a customer, 403 for a provider.
4. `GET /api/demo/provider-only` — should 403 for a customer.
5. `POST /api/auth/logout` — then re-try `/api/auth/me`, should 401.

Important: enable "send cookies" / credentials in whatever client you test with
(Postman does this by default; for `fetch` from a frontend, use `credentials: "include"`).

## Notes / things to revisit

- `models/User.js` is intentionally minimal — once the ERD is finalized, align
  the schema exactly (this may mean splitting into separate Customer/Provider
  models or a discriminator pattern depending on how different their fields are).
- `bcryptjs` was used instead of `bcrypt` — same API, pure JS (no native
  compilation step), which avoids build issues on Vercel's serverless functions.
- `routes/demoProtectedRoutes.js` exists only to prove the middleware works —
  delete it once real protected routes (dashboards, bookings) exist.
- `server.js` currently calls `app.listen()` for local dev. When we actually
  wire up Vercel deployment, this needs adapting to export `app` for the
  serverless function handler instead — flagging now so it's not forgotten.
>>>>>>> origin/main
