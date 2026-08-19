const mongoose = require("mongoose");

// Business-facing profile, one per provider account.
// See Glamtopia_ERD_Final.docx, Section 2 ("provider_profiles").
const providerProfileSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "user_id is required"],
            unique: true, // one profile per user
        },
        business_name: {
            type: String,
            required: [true, "business_name is required"],
            trim: true,
        },
        bio: {
            type: String,
            trim: true,
            default: "",
        },
        location: {
            type: String,
            required: [true, "location is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "category is required"],
            enum: ["hair", "makeup", "nails", "skincare"], // fixed list, per SRS §8 decision
        },
        contact_info: {
            type: String,
            required: [true, "contact_info is required"],
            trim: true,
        },
        profile_image_url: {
            type: String,
            default: null,
        },
        average_rating: {
            type: Number,
            default: 0, // cached, recomputed when a review is added — see Section 2 of the ERD
        },
        review_count: {
            type: Number,
            default: 0, // cached alongside average_rating
        },
        // Stretch goal fields (SRS §8) — not required for core MVP, left here so
        // the schema doesn't need a migration later if the team picks this up.
        urgent_booking_enabled: {
            type: Boolean,
            default: false,
        },
        urgent_booking_min_notice_hours: {
            type: Number,
            default: null,
        },
        urgent_booking_max_notice_hours: {
            type: Number,
            default: null,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

providerProfileSchema.index({ category: 1, location: 1 }); // supports search/filter (FR-03)

module.exports = mongoose.model("ProviderProfile", providerProfileSchema);
