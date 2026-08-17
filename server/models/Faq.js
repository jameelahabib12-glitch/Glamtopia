const mongoose = require("mongoose");

// Shared table for both provider-specific and general customer-facing FAQs.
// See Glamtopia_ERD_Final.docx, Section 2 ("faqs") and Section 8 decision #7.
const faqSchema = new mongoose.Schema(
    {
        provider_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProviderProfile",
            default: null,
            // null  = general platform FAQ, shown to all customers
            // set   = FAQ specific to that provider's own profile
        },
        question: {
            type: String,
            required: [true, "Question is required"],
            trim: true,
        },
        answer: {
            type: String,
            required: [true, "Answer is required"],
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            default: null, // e.g. 'booking', 'account' — only meaningful for general FAQs
        },
        display_order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: false } }
);

faqSchema.index({ provider_id: 1, display_order: 1 });

module.exports = mongoose.model("Faq", faqSchema);
