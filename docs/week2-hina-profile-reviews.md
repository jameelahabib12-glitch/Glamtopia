# Week 2 — Profile Editing & Reviews (Hina)

This branch (`profile-reviews-week2`, based on `hina-work` + the earlier
`feature/hina-profile-reviews` scaffold) completes the four Week 2 items:

## 1. Customer profile (name/bio/photo) — DONE
- `server/models/User.js`: added `bio` and `photo` fields.
- `server/middleware/uploadMiddleware.js`: new — multer config, saves photos
  to `server/uploads/profile-photos/`, 5MB limit, images only.
- `server/routes/profileRoutes.js`: `PUT /api/profile` now runs
  `uploadPhoto.single("photo")` before the controller.
- `server/controllers/profileController.js`: customers can now save
  bio + photo (previously only name/email).
- `client/profile-customer.html` / `.js`: bio + photo fields enabled, form
  now submits `FormData` (needed because of the file), photo preview added.
- `server/server.js`: serves `/uploads/*` statically so photos are viewable,
  and (important!) actually registers `profileRoutes` and `reviewRoutes` —
  these were written but never mounted before.

**To run:** `cd server && npm install` (pulls in `multer`), then `npm run dev`.

## 2. Provider profile (bio/services/pricing) — verified, wired up
Backend + form already existed from Week 1 scaffolding. Just:
- Registered the routes (see above).
- Pointed `client/profile-provider.js` fetch calls at `API_BASE` for
  consistency with the rest of the client code (chatbot widget does the same).

## 3. Reviews — submit endpoint + rule — verified, wired up
`server/controllers/reviewController.js` already enforced:
- only the booking's own customer can review it,
- only `status: "completed"` bookings can be reviewed,
- one review per booking.

Routes are now registered (`/api/reviews`). **Still open:** `server/models/Booking.js`
is a placeholder — talk to Jameela about swapping it for her real Booking
model once it's ready (same `customer`/`provider`/`status` shape is assumed).

## 4. Reviews display on provider profile — DONE, needs Alishba's input
`Provider.js` (root-level, the guest-facing provider page) now fetches
`GET /api/reviews/provider/:id` and renders an average rating + review list
under a new "Reviews" section, right under Availability.

**Coordinate with Alishba:** the page currently uses `MockAPI` for provider
data, so the `id` in the URL is a mock id, not a real Mongo `_id`. Once her
page switches to real provider data, the same `id` will work for reviews
automatically — no extra change needed on the reviews side, just confirm the
id types line up.

## Manual test checklist
1. Register a customer + a provider (`POST /api/auth/register`).
2. Log in as customer → `GET/PUT /api/profile` → confirm bio/photo save.
3. Log in as provider → `GET/PUT /api/profile` → confirm bio/services/pricing save.
4. In Mongo, manually insert a `Booking` with `status: "completed"` linking
   that customer + provider.
5. `POST /api/reviews` as that customer → should succeed.
6. Try again → should fail ("already reviewed").
7. Try with a `pending` booking → should fail ("only completed bookings").
8. `GET /api/reviews/provider/:providerId` → should return the review.
9. Open `Provider.html?id=<mock-id>` and check the Reviews section renders
   (will show "no reviews yet" until the id issue above is resolved with Alishba).
