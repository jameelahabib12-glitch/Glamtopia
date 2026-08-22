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
            // NOTE: no `unique: true` here anymore — see the partial index
            // below instead. A plain unique index blocks a slot from EVER
            // being booked again once any booking (even a cancelled one)
            // has existed for it, which is wrong: cancelling should free
            // the slot for a new booking.
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

// One ACTIVE booking per slot — this is the real fix for the duplicate-key
// bug. A plain `unique: true` on slot_id (the old approach) enforces
// uniqueness forever, so once a booking for a slot is cancelled, that
// slot_id can never be used again — every rebooking attempt after a
// cancellation would hit E11000. A partial index scopes the uniqueness
// constraint to only documents matching partialFilterExpression, so a
// cancelled booking (cancelled_at gets set to a real Date) drops out of
// the index and frees that slot_id up for a new booking.
//
// Mongo only supports a limited operator set inside partialFilterExpression
// ($eq, $exists, $gt/$gte/$lt/$lte, $type, $and) — no $ne/$in/$or — which is
// why this checks `cancelled_at: { $eq: null }` rather than `status: { $ne:
// "cancelled" }`.
bookingSchema.index(
    { slot_id: 1 },
    { unique: true, partialFilterExpression: { cancelled_at: { $eq: null } } }
);

module.exports = mongoose.model("Booking", bookingSchema);