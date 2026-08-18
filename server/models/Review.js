const mongoose = require("mongoose");

// One review per completed booking. customer and provider are deliberately
// NOT stored here — both are already on the booking this review references,
// so duplicating them would be redundant. Look them up via booking_id.
// See Glamtopia_ERD_Final.docx, Section 2 ("reviews").
const reviewSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // one review per booking
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

module.exports = mongoose.model("Review", reviewSchema);
