const mongoose = require("mongoose");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const ProviderProfile = require("../models/ProviderProfile");

async function getMyProviderProfileId(userId) {
  const profile = await ProviderProfile.findOne({ user_id: userId });
  return profile ? profile._id : null;
}

// POST /api/availability — provider creates a new open slot
exports.createSlot = async (req, res) => {
  try {
    const { start_time } = req.body;

    if (typeof start_time !== "string") {
      return res.status(400).json({ message: "start_time is required" });
    }

    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(400).json({ message: "Create your provider profile before adding availability" });
    }

    const start = new Date(start_time);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "start_time is not a valid date" });
    }
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
    // A malformed ID (wrong length/characters) would otherwise throw a raw
    // Mongoose CastError — check the format first for a clean 400 instead.
    if (!mongoose.Types.ObjectId.isValid(req.params.providerId)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }

    const slots = await AvailabilitySlot.find({
      provider_id: req.params.providerId,
      booked: false,
      start_time: { $gte: new Date() },
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid slot ID" });
    }

    const providerId = await getMyProviderProfileId(req.session.userId);
    if (!providerId) {
      return res.status(400).json({ message: "You don't have a provider profile" });
    }

    const slot = await AvailabilitySlot.findOneAndDelete({
      _id: req.params.id,
      provider_id: providerId,
      booked: false,
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

exports.attemptBookSlot = async (slotId) => {
  const result = await AvailabilitySlot.updateOne(
    { _id: slotId, booked: false },
    { $set: { booked: true } }
  );
  return result.matchedCount > 0;
};