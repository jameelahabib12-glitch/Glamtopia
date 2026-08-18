const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: [true, "provider_id is required"],
    },
    start_time: {
      type: Date,
      required: [true, "start_time is required"],
    },
    end_time: {
      type: Date,
      required: [true, "end_time is required"],
    },
    booked: {
      type: Boolean,
      default: false, // exact field name required by SRS §6 atomic update logic
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

// Speeds up the most common query: "give me this provider's open slots"
availabilitySlotSchema.index({ provider_id: 1, start_time: 1 });

module.exports = mongoose.model("AvailabilitySlot", availabilitySlotSchema);