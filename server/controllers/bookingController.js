const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");

// SRS §7: "tunable constant" — confirmed with team as 3.
const CANCELLATION_WARNING_THRESHOLD = 3;

async function getMyProviderProfileId(userId) {
  const profile = await ProviderProfile.findOne({ user_id: userId });
  return profile ? profile._id : null;
}

// POST /api/bookings
// Customer creates a new booking. Per SRS §6 Technical Constraints, the
// slot-claim and booking-creation are wrapped in a real MongoDB
// multi-document ACID transaction: if booking creation fails after the
// slot was claimed, the ENTIRE operation rolls back automatically —
// no manual "undo" logic needed, and no risk of a slot being stuck
// marked booked with no matching booking record.
async function createBooking(req, res) {
  const { serviceId, slotId } = req.body;

  if (typeof serviceId !== "string" || typeof slotId !== "string") {
    return res.status(400).json({ message: "serviceId and slotId are required" });
  }
  if (!mongoose.Types.ObjectId.isValid(serviceId) || !mongoose.Types.ObjectId.isValid(slotId)) {
    return res.status(400).json({ message: "Invalid serviceId or slotId" });
  }

  const service = await Service.findById(serviceId);
  if (!service || service.is_active === false) {
    return res.status(404).json({ message: "Service not found or inactive" });
  }

  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) {
    return res.status(404).json({ message: "Availability slot not found" });
  }

  if (slot.provider_id.toString() !== service.provider_id.toString()) {
    return res.status(400).json({ message: "Slot does not belong to the service provider" });
  }

  const session = await mongoose.startSession();
  let booking = null;
  let slotWasTaken = false;

  try {
    await session.withTransaction(async () => {
      // Atomic claim, INSIDE the transaction — matches SRS §6 exactly.
      const claimedSlot = await AvailabilitySlot.findOneAndUpdate(
        { _id: slotId, booked: false },
        { $set: { booked: true } },
        { new: true, session }
      );

      if (!claimedSlot) {
        slotWasTaken = true;
        // Throwing inside withTransaction aborts and rolls back automatically.
        throw new Error("SLOT_ALREADY_TAKEN");
      }

      const created = await Booking.create(
        [
          {
            customer_id: req.session.userId,
            provider_id: service.provider_id,
            service_id: service._id,
            slot_id: slot._id,
            status: "pending",
            price_at_booking: service.price,
          },
        ],
        { session }
      );

      booking = created[0];
    });
  } catch (err) {
    if (slotWasTaken) {
      return res.status(409).json({ message: "That slot was just taken. Pick another time below." });
    }
    console.error("Create booking error:", err);
    return res.status(500).json({ message: "Failed to create booking" });
  } finally {
    session.endSession();
  }

  const populatedBooking = await Booking.findById(booking._id)
    .populate("provider_id")
    .populate("service_id")
    .populate("slot_id");

  return res.status(201).json({
    message: "Booking created successfully",
    booking: populatedBooking,
  });
}

// GET /api/bookings/mine
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
async function confirmBooking(req, res) {
  try {
    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const booking = await Booking.findOne({ _id: req.params.id, provider_id: providerId });
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
async function completeBooking(req, res) {
  try {
    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const booking = await Booking.findOne({ _id: req.params.id, provider_id: providerId });
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
// FR-15 + senior dev decision:
//   - 24-hour cutoff applies to BOTH customer and provider cancellations.
//   - Warning count + suspension only applies when the CUSTOMER cancels
//     a booking that was already CONFIRMED.
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

    const slot = await AvailabilitySlot.findById(booking.slot_id);
    if (slot) {
      const hoursUntilAppointment = (slot.start_time - new Date()) / (1000 * 60 * 60);
      if (hoursUntilAppointment < 24) {
        return res.status(400).json({
          message: "Bookings can only be cancelled up to 24 hours before the appointment",
        });
      }
    }

    const wasConfirmed = booking.status === "confirmed";

    booking.status = "cancelled";
    booking.cancelled_at = new Date();
    await booking.save();

    if (booking.slot_id) {
      await AvailabilitySlot.findByIdAndUpdate(booking.slot_id, { $set: { booked: false } });
    }

    let suspended = false;
    if (userRole === "customer" && wasConfirmed) {
      const customer = await User.findByIdAndUpdate(
        userId,
        { $inc: { cancellation_warning_count: 1 } },
        { new: true }
      );

      if (customer.cancellation_warning_count >= CANCELLATION_WARNING_THRESHOLD && !customer.is_suspended) {
        customer.is_suspended = true;
        await customer.save();
        suspended = true;
      }
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "name email phone_number")
      .populate("service_id")
      .populate("slot_id");

    return res.json({
      message: suspended
        ? "Booking cancelled. Your account has been suspended due to repeated cancellations of confirmed bookings."
        : "Booking cancelled successfully",
      booking: updatedBooking,
    });
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