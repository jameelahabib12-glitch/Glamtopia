const express = require("express");
const router = express.Router();

const Review = require("../models/review");
const Booking = require("../models/booking");
const User = require("../models/user");

// ======================================================
// CREATE REVIEW
// POST /api/reviews
// ======================================================

router.post("/", async (req, res) => {
    try {

        // Check login
        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        // Find logged-in user
        const customer = await User.findById(req.session.userId);

        if (!customer) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Only customers can give reviews
        if (customer.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can submit reviews"
            });
        }

        const {
            bookingId,
            rating,
            comment
        } = req.body;


        // Check required booking
        if (!bookingId) {
            return res.status(400).json({
                message: "Booking ID is required"
            });
        }


        // Check rating
        if (!rating) {
            return res.status(400).json({
                message: "Rating is required"
            });
        }


        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }


        // Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }


        // Make sure booking belongs to logged-in customer
        if (
            booking.customer.toString() !==
            req.session.userId.toString()
        ) {
            return res.status(403).json({
                message: "You can only review your own booking"
            });
        }


        // Review only completed booking
        if (booking.status !== "completed") {
            return res.status(400).json({
                message: "You can only review a completed booking"
            });
        }


        // Check duplicate review
        const existingReview = await Review.findOne({
            booking: bookingId
        });

        if (existingReview) {
            return res.status(400).json({
                message: "This booking has already been reviewed"
            });
        }


        // Create review
        const review = await Review.create({
            booking: booking._id,
            customer: booking.customer,
            provider: booking.provider,
            rating: Number(rating),
            comment: comment || ""
        });


        res.status(201).json({
            message: "Review submitted successfully",
            review
        });

    } catch (error) {

        console.log(
            "Create review error:",
            error.message
        );

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// ======================================================
// GET PROVIDER REVIEWS
// GET /api/reviews/provider/:providerId
// ======================================================

router.get("/provider/:providerId", async (req, res) => {
    try {

        const reviews = await Review.find({
            provider: req.params.providerId
        })
        .populate("customer", "name")
        .sort({ createdAt: -1 });


        // Calculate average rating
        let averageRating = 0;

        if (reviews.length > 0) {

            const totalRating = reviews.reduce(
                (sum, review) => sum + review.rating,
                0
            );

            averageRating =
                totalRating / reviews.length;
        }


        res.json({
            totalReviews: reviews.length,

            averageRating:
                Number(averageRating.toFixed(1)),

            reviews
        });

    } catch (error) {

        console.log(
            "Get reviews error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;