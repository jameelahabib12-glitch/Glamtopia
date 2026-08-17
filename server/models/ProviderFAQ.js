const mongoose = require("mongoose");

// NOTE: same provider_id caveat as AvailabilitySlot.js — points to User for now.
const providerFaqSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "provider_id is required"],
    },
    question: {
      type: String,
      required: [true, "question is required"],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, "answer is required"],
      trim: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

providerFaqSchema.index({ provider_id: 1 });

module.exports = mongoose.model("ProviderFAQ", providerFaqSchema);