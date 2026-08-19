const mongoose = require("mongoose");

// NOTE: This is a minimal version to unblock auth work in Week 1.
// Once the ERD is finalized, extend this (or split into Customer/Provider
// sub-schemas) to match it exactly — don't treat this as final.
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
    // Added for Week 2 — customer profile editing (name/bio/photo).
    // Providers keep their bio/services on ProviderProfile instead;
    // these two fields here only really get used by customers.
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      type: String, // stored as a relative URL path, e.g. /uploads/profile-photos/xyz.jpg
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
