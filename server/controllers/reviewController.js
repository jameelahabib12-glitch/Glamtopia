const Review = require("../models/Review");
const Booking = require("../models/Booking");
const User = require("../models/User");

// POST /api/reviews
async function createReview(req, res) {
  try {
    const customer = await User.findById(req.session.userId);
    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }
    if (customer.role !== "customer") {
      return res.status(403).json({ message: "Only customers can submit reviews" });
    }

    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }
    if (!rating) {
      return res.status(400).json({ message: "Rating is required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.customer.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ message: "You can only review your own booking" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "You can only review a completed booking" });
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "This booking has already been reviewed" });
    }

    const review = await Review.create({
      booking: booking._id,
      customer: booking.customer,
      provider: booking.provider,
      rating: Number(rating),
      comment: comment || ""
    });

    return res.status(201).json({ message: "Review submitted successfully", review });
  } catch (err) {
    console.error("Create review error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

// GET /api/reviews/provider/:providerId  (public)
async function getProviderReviews(req, res) {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate("customer", "name")
      .sort({ createdAt: -1 });

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    return res.json({
      totalReviews: reviews.length,
      averageRating: Number(averageRating.toFixed(1)),
      reviews
    });
  } catch (err) {
    console.error("Get reviews error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createReview, getProviderReviews };
