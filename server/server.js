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
const providerRoutes = require("./routes/providerRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// --- Core middleware ---
app.use(express.json());

// CORS: in production this must be locked to the real deployed frontend
// origin (CLIENT_URL). In local dev, everyone on the team runs the
// frontend a different way (double-clicking the HTML file, VS Code Live
// Server on 5500, `npx serve` on 3000, etc.), and a single hardcoded
// origin breaks for anyone not using that exact one — which is exactly
// what happened here. So in development, reflect any localhost/127.0.0.1
// origin (any port) instead of hardcoding one.
const isProd = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProd
      ? process.env.CLIENT_URL // production: locked to the real deployed frontend
      : (origin, callback) => {
        // origin is undefined for same-origin/non-browser requests (e.g. curl, Postman)
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS: " + origin));
      },
    credentials: true, // required so the session cookie is sent/received
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
app.get("/", (req, res) => {
  res.json({ message: "Glamtopia API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/demo", demoProtectedRoutes); // remove once real routes exist
app.use("/api/faqs", faqRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);

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