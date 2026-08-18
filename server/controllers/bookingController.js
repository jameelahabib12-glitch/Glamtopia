const Booking = require("../models/Booking");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");

// Helper: resolve logged-in user's ProviderProfile ID
async function getMyProviderProfileId(userId) {
  const profile = await ProviderProfile.findOne({ user_id: userId });
  return profile ? profile._id : null;
}

// POST /api/bookings
// Customer creates a new booking and atomically claims the availability slot
async function createBooking(req, res) {
  try {
    const { serviceId, slotId } = req.body;

    if (!serviceId || !slotId) {
      return res.status(400).json({ message: "serviceId and slotId are required" });
    }

    // Verify service exists and is active
    const service = await Service.findById(serviceId);
    if (!service || service.is_active === false) {
      return res.status(404).json({ message: "Service not found or inactive" });
    }

    // Verify slot exists
    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Availability slot not found" });
    }

    // Ensure slot matches service provider
    if (slot.provider_id.toString() !== service.provider_id.toString()) {
      return res.status(400).json({ message: "Slot does not belong to the service provider" });
    }

    // Atomic double-booking guard: attempt to claim the open slot
    const claimedSlot = await AvailabilitySlot.findOneAndUpdate(
      { _id: slotId, booked: false },
      { $set: { booked: true } },
      { new: true }
    );

    if (!claimedSlot) {
      return res.status(409).json({ message: "That slot was just taken. Pick another time below." });
    }

    let booking;
    try {
      booking = await Booking.create({
        customer_id: req.session.userId,
        provider_id: service.provider_id,
        service_id: service._id,
        slot_id: slot._id,
        status: "pending",
        price_at_booking: service.price,
      });
    } catch (err) {
      // Revert slot status if booking creation fails
      await AvailabilitySlot.findByIdAndUpdate(slotId, { $set: { booked: false } });
      throw err;
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("provider_id")
      .populate("service_id")
      .populate("slot_id");

    return res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ message: "Failed to create booking", error: err.message });
  }
}

// GET /api/bookings/mine
// Customer views their own bookings
async function listMyBookings(req, res) {
  try {
    const { status } = req.query;
    const filter = { customer_id: req.session.userId };

    if (status && status !== "all") {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate("provider_id")
      .populate("service_id")
      .populate("slot_id")
      .sort({ created_at: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("List customer bookings error:", err);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
}

// GET /api/bookings/provider
// Provider views incoming bookings
async function listProviderBookings(req, res) {
  try {
    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const { status } = req.query;
    const filter = { provider_id: providerId };

    if (status && status !== "all") {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate("customer_id", "name email phone_number")
      .populate("service_id")
      .populate("slot_id")
      .sort({ created_at: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("List provider bookings error:", err);
    return res.status(500).json({ message: "Failed to fetch provider bookings" });
  }
}

// PATCH /api/bookings/:id/confirm
// Provider confirms a pending booking
async function confirmBooking(req, res) {
  try {
    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      provider_id: providerId,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or does not belong to you" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: `Cannot confirm booking in '${booking.status}' status` });
    }

    booking.status = "confirmed";
    booking.confirmed_at = new Date();
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "name email phone_number")
      .populate("service_id")
      .populate("slot_id");

    return res.json({ message: "Booking confirmed successfully", booking: updatedBooking });
  } catch (err) {
    console.error("Confirm booking error:", err);
    return res.status(500).json({ message: "Failed to confirm booking" });
  }
}

// PATCH /api/bookings/:id/complete
// Provider marks a confirmed booking as completed
async function completeBooking(req, res) {
  try {
    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      provider_id: providerId,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or does not belong to you" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: `Only confirmed bookings can be marked completed (current: '${booking.status}')` });
    }

    booking.status = "completed";
    booking.completed_at = new Date();
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "name email phone_number")
      .populate("service_id")
      .populate("slot_id");

    return res.json({ message: "Booking completed successfully", booking: updatedBooking });
  } catch (err) {
    console.error("Complete booking error:", err);
    return res.status(500).json({ message: "Failed to complete booking" });
  }
}

// PATCH /api/bookings/:id/cancel
// Either customer or provider can cancel an active booking
async function cancelBooking(req, res) {
  try {
    const userId = req.session.userId;
    const userRole = req.session.role;

    let booking;
    if (userRole === "customer") {
      booking = await Booking.findOne({ _id: req.params.id, customer_id: userId });
    } else if (userRole === "provider") {
      const providerId = await getMyProviderProfileId(userId);
      if (!providerId) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      booking = await Booking.findOne({ _id: req.params.id, provider_id: providerId });
    }

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or access denied" });
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: `Cannot cancel a booking that is already '${booking.status}'` });
    }

    booking.status = "cancelled";
    booking.cancelled_at = new Date();
    await booking.save();

    // Free up the availability slot so another customer can book it
    if (booking.slot_id) {
      await AvailabilitySlot.findByIdAndUpdate(booking.slot_id, { $set: { booked: false } });
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "name email phone_number")
      .populate("service_id")
      .populate("slot_id");

    return res.json({ message: "Booking cancelled successfully", booking: updatedBooking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return res.status(500).json({ message: "Failed to cancel booking" });
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  listProviderBookings,
  confirmBooking,
  completeBooking,
  cancelBooking,
};
