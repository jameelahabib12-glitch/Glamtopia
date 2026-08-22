require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const demoProtectedRoutes = require("./routes/demoProtectedRoutes");
const faqRoutes = require("./routes/faqRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const providerRoutes = require("./routes/providerRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// --- Core middleware ---
app.use(express.json());

// CORS: kept as a safety net for anyone who insists on serving the
// frontend from a separate dev server. NOTE: this does NOT fix session
// cookies across origins — browsers block cookies on cross-site
// fetch/XHR requests regardless of CORS headers unless the cookie is
// SameSite=None + Secure (HTTPS), which local dev doesn't have. The
// real fix is below: Express now serves the frontend itself, so the
// whole app runs on ONE origin (http://localhost:5000) and this
// problem can't happen at all. Always open pages via that URL, not
// through Live Server or any other separate dev server/port.
const isProd = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProd
      ? process.env.CLIENT_URL
      : (origin, callback) => {
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS: " + origin));
      },
    credentials: true,
  })
);

// --- Session middleware ---
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // 14 days, matches cookie maxAge below
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    },
  })
);

// --- Routes ---
app.get("/api/health", (req, res) => {
  res.json({ message: "Glamtopia API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/demo", demoProtectedRoutes); // remove once real routes exist
app.use("/api/faqs", faqRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);

// Serve uploaded profile photos statically (e.g. GET /uploads/profile-photos/xyz.jpg)
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// --- Serve the frontend itself, so the whole app is ONE origin ---
// (http://localhost:5000) and session cookies always work, with no CORS
// or SameSite gymnastics needed. Open pages via this server going
// forward — e.g. http://localhost:5000/register.html,
// http://localhost:5000/client/profile-provider.html — instead of
// through Live Server or any other separate dev server/port.
const path = require("path");

// Block direct access to the backend source/.env BEFORE the static
// handler below — otherwise express.static would happily serve
// http://localhost:5000/server/.env to anyone who asked.
app.use("/server", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(express.static(path.join(__dirname, "..")));

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Global error handler (catches anything thrown/passed to next(err)) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

// Connect to DB, then start listening.
// (Locally this starts a normal long-running server. On Vercel, this file
// gets adapted to export the app instead of calling listen() — flagged as
// a task for when we actually set up the Vercel deployment.)
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

module.exports = app;