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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
