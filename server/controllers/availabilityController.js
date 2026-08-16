const AvailabilitySlot = require("../models/AvailabilitySlot");

// POST /api/availability — provider creates a new open slot
exports.createSlot = async (req, res) => {
  try {
    const { start_time } = req.body;

    if (!start_time) {
      return res.status(400).json({ message: "start_time is required" });
    }

    const start = new Date(start_time);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // fixed 1-hour slots per SRS

    const slot = await AvailabilitySlot.create({
      provider_id: req.session.userId,
      start_time: start,
      end_time: end,
      booked: false,
    });

    res.status(201).json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create slot" });
  }
};

// GET /api/availability/:providerId — public, view a provider's OPEN slots only
exports.getOpenSlotsByProvider = async (req, res) => {
  try {
    const slots = await AvailabilitySlot.find({
      provider_id: req.params.providerId,
      booked: false,
      start_time: { $gte: new Date() }, // no point showing past slots
    }).sort({ start_time: 1 });

    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch availability" });
  }
};

// DELETE /api/availability/:id — provider removes an unbooked slot
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await AvailabilitySlot.findOneAndDelete({
      _id: req.params.id,
      provider_id: req.session.userId,
      booked: false, // safety: never let a provider delete an already-booked slot
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found, not yours, or already booked" });
    }

    res.json({ message: "Slot deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete slot" });
  }
};

// ---------------------------------------------------------------------------
// This function is the ANSWER to the "prevent double-booking" requirement.
// It matches SRS §6 exactly: atomic updateOne + matchedCount check.
//
// IMPORTANT: This might belong in a shared bookingController.js instead,
// since booking a slot also creates a `booking` document (owned by whoever
// builds bookings). Show this function to your team lead — ask whether
// it should live here, or be moved/merged into their booking creation code.
// Either way, THIS is the exact logic that must run before a booking is
// created — don't let anyone create a booking without this check first.
// ---------------------------------------------------------------------------
exports.attemptBookSlot = async (slotId) => {
  const result = await AvailabilitySlot.updateOne(
    { _id: slotId, booked: false },
    { $set: { booked: true } }
  );

  // matchedCount === 0 means someone else booked it a moment earlier
  return result.matchedCount > 0; // true = you won the slot, false = too late
};