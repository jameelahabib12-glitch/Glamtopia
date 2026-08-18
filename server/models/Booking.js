const mongoose = require("mongoose");

// The core transactional record linking a customer, provider, service, and slot.
// See Glamtopia_ERD_Final.docx, Section 2 ("bookings") and Section 5 (lifecycle).
const bookingSchema = new mongoose.Schema(
    {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "customer_id is required"],
        },
        provider_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProviderProfile",
            required: [true, "provider_id is required"],
        },
        service_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: [true, "service_id is required"],
        },
        slot_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AvailabilitySlot",
            required: [true, "slot_id is required"],
            unique: true, // one booking per slot — mirrors the atomic booked:false -> true claim
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
        price_at_booking: {
            type: Number,
            required: [true, "price_at_booking is required"],
            min: [0, "price_at_booking must be non-negative"],
        },
        confirmed_at: { type: Date, default: null },
        completed_at: { type: Date, default: null },
        cancelled_at: { type: Date, default: null },
    },
    { timestamps: { createdAt: "created_at", updatedAt: false } }
);

// Common dashboard queries: "my bookings as a customer" / "my incoming bookings as a provider"
bookingSchema.index({ customer_id: 1, status: 1 });
bookingSchema.index({ provider_id: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);