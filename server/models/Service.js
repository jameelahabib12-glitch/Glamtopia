const mongoose = require("mongoose");

// A service a provider offers, each with its own price and duration.
// See Glamtopia_ERD_Final.docx, Section 2 ("services").
const serviceSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: [true, "provider_id is required"],
    },
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
    },
    duration_minutes: {
      type: Number,
      required: [true, "duration_minutes is required"],
      default: 60, // fixed 1-hour slots per SRS — kept as a real field, not hardcoded, in case that changes later
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true, // set false to suspend instead of hard-deleting (FR-16, missed-confirmation threshold)
    },
    missed_confirmation_count: {
      type: Number,
      default: 0, // increments when a booking's date passes with the provider never confirming — SRS §8
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

serviceSchema.index({ provider_id: 1, is_active: 1 });

module.exports = mongoose.model("Service", serviceSchema);
