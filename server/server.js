require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const demoProtectedRoutes = require("./routes/demoProtectedRoutes");

const app = express();

// --- Core middleware ---
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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