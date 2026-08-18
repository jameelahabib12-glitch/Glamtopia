const express = require("express");
const router = express.Router();
const {
    createBooking,
    listMyBookings,
    listProviderBookings,
    confirmBooking,
    completeBooking,
    cancelBooking,
} = require("../controllers/bookingController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Customer — create a booking, view own bookings
router.post("/", requireAuth, requireRole("customer"), createBooking);
router.get("/mine", requireAuth, requireRole("customer"), listMyBookings);

// Provider — view incoming bookings, move them through the lifecycle
router.get("/provider", requireAuth, requireRole("provider"), listProviderBookings);
router.patch("/:id/confirm", requireAuth, requireRole("provider"), confirmBooking);
router.patch("/:id/complete", requireAuth, requireRole("provider"), completeBooking);

// Either party can cancel their own booking (role checked inside the controller)
router.patch("/:id/cancel", requireAuth, cancelBooking);

module.exports = router;