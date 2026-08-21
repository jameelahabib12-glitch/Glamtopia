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
      match: [/^[0-9+\-\s()]{7,20}$/, "Phone number can only contain digits, spaces, +, -, and ()"],
    },
    cancellation_warning_count: {
      type: Number,
      default: 0, // customers only — increments when a CONFIRMED booking is cancelled (SRS §8)
    },
    is_suspended: {
      type: Boolean,
      default: false, // set true when cancellation_warning_count crosses the agreed threshold
    },
    // Not in the original ERD — added in Week 2 for customer profile editing
    // (name/bio/photo). Only really used by customers today; providers keep
    // their public-facing bio on ProviderProfile instead. Worth a formal
    // ERD note since it's a real, intentional addition, not an oversight.
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      type: String, // relative URL path, e.g. /uploads/profile-photos/xyz.jpg
      default: "",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("User", userSchema);
