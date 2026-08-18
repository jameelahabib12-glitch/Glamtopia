const AvailabilitySlot = require("../models/AvailabilitySlot");
const ProviderProfile = require("../models/ProviderProfile");

// Slots reference provider_profiles._id (per ERD), not users._id — this
// resolves the logged-in provider's session user to their profile ID.
// (Fixed here: this previously stored req.session.userId directly, which
// silently mismatched services.provider_id and would have broken booking
// validation, since a booking's slot and service need to resolve to the
// SAME provider_profiles._id.)
async function getMyProviderProfileId(userId) {
  const profile = await ProviderProfile.findOne({ user_id: userId });
  return profile ? profile._id : null;
}

// POST /api/availability — provider creates a new open slot
exports.createSlot = async (req, res) => {
  try {
    const { start_time } = req.body;

    if (!start_time) {
      return res.status(400).json({ message: "start_time is required" });
    }

    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(400).json({ message: "Create your provider profile before adding availability" });
    }

    const start = new Date(start_time);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // fixed 1-hour slots per SRS

    const slot = await AvailabilitySlot.create({
      provider_id: providerId,
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
    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(400).json({ message: "You don't have a provider profile" });
    }

    const slot = await AvailabilitySlot.findOneAndDelete({
      _id: req.params.id,
      provider_id: providerId,
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
// RESOLVED (Week 2): this now lives in bookingController.createBooking,
// wrapped in a MongoDB transaction together with the booking document
// creation itself, per SRS §6 ("operations spanning multiple collections
// are wrapped in multi-document transactions"). Kept here, unused by the
// booking flow, only as a reference for the exact atomic pattern:
//
//   updateOne({ _id: slotId, booked: false }, { $set: { booked: true } })
//   matchedCount === 0  -> someone else booked it first, reject
// ---------------------------------------------------------------------------
exports.attemptBookSlot = async (slotId) => {
  const result = await AvailabilitySlot.updateOne(
    { _id: slotId, booked: false },
    { $set: { booked: true } }
  );

  return result.matchedCount > 0;
};