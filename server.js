const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

dotenv.config();

connectDB();

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

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/profile",
    profileRoutes
);

app.use(
    "/api/reviews",
    reviewRoutes
);

app.use(
    "/api/bookings",
    bookingRoutes
);

// ==========================================
// API HOME
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        message:
            "ZiriumAI Local Service Marketplace API Running 🚀"
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

app.use("/api/chatbot", chatbotRoutes);