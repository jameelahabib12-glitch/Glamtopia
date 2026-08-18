const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");

const connectDB = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

// ==========================================
// ENVIRONMENT
// ==========================================

dotenv.config();

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    cors({
        origin: "http://localhost:5000",
        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ==========================================
// SESSION
// ==========================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || "zirium-secret",

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI
        }),

        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ==========================================
// FRONTEND
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "frontend")
    )
);

// ==========================================
// API ROUTES
// ==========================================

// Authentication
app.use(
    "/api/auth",
    authRoutes
);

// Profile
app.use(
    "/api/profile",
    profileRoutes
);

// Reviews
app.use(
    "/api/reviews",
    reviewRoutes
);

// Bookings
app.use(
    "/api/bookings",
    bookingRoutes
);

// Chatbot
app.use(
    "/api/chatbot",
    chatbotRoutes
);

// ==========================================
// API HOME
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        message:
            "Glamtopia Local Service Marketplace API Running 🚀"
    });

});


// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});