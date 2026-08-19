const Review = require("../models/Review");
const Booking = require("../models/Booking");
const ProviderProfile = require("../models/ProviderProfile");
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
    if (booking.customer_id.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ message: "You can only review your own booking" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "You can only review a completed booking" });
    }

    const existingReview = await Review.findOne({ booking_id: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "This booking has already been reviewed" });
    }

    const review = await Review.create({
      booking_id: booking._id,
      rating: Number(rating),
      comment: comment || "",
    });

    // Keep provider_profiles' cached rating in sync (see ERD notes on
    // average_rating/review_count — cached for fast reads, recomputed here).
    const providerReviews = await getReviewsForProvider(booking.provider_id);
    const avg =
      providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    await ProviderProfile.findByIdAndUpdate(booking.provider_id, {
      average_rating: Number(avg.toFixed(1)),
      review_count: providerReviews.length,
    });

    return res.status(201).json({ message: "Review submitted successfully", review });
  } catch (err) {
    console.error("Create review error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Reviews don't store provider_id directly (see Review model comment), so
// finding "all reviews for a provider" goes through their completed bookings.
async function getReviewsForProvider(providerId) {
  const bookingIds = await Booking.find({ provider_id: providerId }).distinct("_id");
  return Review.find({ booking_id: { $in: bookingIds } });
}

// GET /api/reviews/provider/:providerId  (public)
async function getProviderReviews(req, res) {
  try {
    const bookingIds = await Booking.find({ provider_id: req.params.providerId }).distinct("_id");

    const reviews = await Review.find({ booking_id: { $in: bookingIds } })
      .populate({
        path: "booking_id",
        select: "customer_id created_at",
        populate: { path: "customer_id", select: "name" },
      })
      .sort({ created_at: -1 });

    const averageRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0;

    return res.json({
      totalReviews: reviews.length,
      averageRating,
      reviews,
    });
  } catch (err) {
    console.error("Get reviews error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createReview, getProviderReviews };
