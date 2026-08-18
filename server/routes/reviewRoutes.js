const express = require("express");
const router = express.Router();
const { createReview, getProviderReviews } = require("../controllers/reviewController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.post("/", requireAuth, requireRole("customer"), createReview);
router.get("/provider/:providerId", getProviderReviews); // public, no auth needed

module.exports = router;
