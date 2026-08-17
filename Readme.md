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
