const mongoose = require("mongoose");

// Base account for both customers and providers.
// See Glamtopia_ERD_Final.docx, Section 2 ("users").
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default in queries
    },
    role: {
      type: String,
      enum: ["customer", "provider"],
      required: [true, "Role is required"],
    },
    phone_number: {
      type: String,
      trim: true,
      default: null,
    },
    cancellation_warning_count: {
      type: Number,
      default: 0, // customers only — increments when a CONFIRMED booking is cancelled (SRS §8)
    },
    is_suspended: {
      type: Boolean,
      default: false, // set true when cancellation_warning_count crosses the agreed threshold
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("User", userSchema);
