# Session vs JWT — Demo Prep Notes

Talking points for explaining why Glamtopia uses session-based auth instead of JWT.

## The core difference

- **Session auth**: after login, the server creates a session record and stores it
  (in our case, in a MongoDB `sessions` collection). The browser only holds a small,
  random session ID in an HTTP-only cookie. On every request, the server looks up
  that ID against the stored session to know who's logged in. The server can kill
  a session instantly by deleting that record.
- **JWT auth**: after login, the server signs a token containing the user's info
  (id, role, etc.) and hands it to the client. The client sends it back on every
  request, and the server just verifies the signature — no database lookup needed.
  The server doesn't "remember" the session; the token itself carries everything.

## Why this matters for us specifically

1. **Logout / revocation.** With sessions, logout = delete the record, done — instantly
   invalid everywhere. With JWT, a token is valid until it expires; revoking it early
   needs extra machinery (a blocklist, short expiries + refresh tokens, etc.). For a
   marketplace with providers and customers, being able to kill a session
   immediately (e.g. suspicious activity) matters more than saving a DB lookup.

2. **Serverless (Vercel) constraint — this is the one that actually forced our hand.**
   Vercel functions are stateless and short-lived, so we can't keep sessions in
   server memory. Two options: (a) sessions backed by MongoDB, or (b) JWT (no server
   storage needed at all). We chose (a) because revocation and role control matter
   more to us than shaving off the one extra DB read per request — and we're already
   hitting MongoDB for almost everything else anyway, so the extra lookup is cheap.

3. **Payload size / cookie vs token.** Session cookies just carry an ID (tiny). JWTs
   carry the actual claims, so they're bigger, and if you ever encode too much into
   them they get bulky on every request.

4. **Statelessness benefit we're giving up.** JWT's real strength is horizontal
   scaling without a shared session store — great for multi-service / microservice
   setups where you don't want every service hitting one auth database. We don't
   have that problem: we're a single Express API talking to a single MongoDB
   instance, so JWT's main advantage doesn't buy us much here.

## One-line summary for the demo

> "We chose sessions over JWT mainly for control — instant logout and simple
> role checks — and because our serverless setup already means we're hitting
> MongoDB per request anyway, so storing sessions there costs us almost nothing
> extra. JWT would remove that DB lookup, but at the cost of harder revocation,
> which matters more for a booking platform than the small performance gain."

## Anticipated follow-up questions

- **"What if we scale to multiple servers?"** MongoDB-backed sessions already work
  fine across multiple server instances since the session store is centralized —
  it's serverless statelessness we had to solve for, not horizontal scaling per se.
- **"Isn't a DB read on every request slow?"** It's one indexed lookup by session ID
  against a collection we already control (with a TTL index for auto-expiry), so
  it's fast — and we're already connecting to MongoDB for nearly every request.
- **"Could we switch to JWT later?"** Yes, but it would touch the auth middleware,
  the login/register controllers, and how the frontend stores/sends credentials —
  not a trivial swap, so worth deciding now rather than mid-build.
