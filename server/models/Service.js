const mongoose = require("mongoose");

// Service catalog item belonging to a provider profile.
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
            required: [true, "Service name is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Service description is required"],
            trim: true,
        },
        duration_minutes: {
            type: Number,
            required: [true, "Duration is required"],
            default: 60,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price must be non-negative"],
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Optimize queries fetching active services for a provider
serviceSchema.index({ provider_id: 1, is_active: 1 });

module.exports = mongoose.model("Service", serviceSchema);
