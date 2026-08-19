const mongoose = require("mongoose");

// PLACEHOLDER — Booking is Jameela's Week 2 deliverable (booking creation +
// conflict prevention, per the WBS critical path). This minimal version
// exists only so Review can be tested locally right now (reviews require
// a completed booking to exist). Replace/reconcile this with Jameela's
// real Booking model as soon as she has it — do not treat this as final.
const bookingSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        serviceName: {
            type: String,
            required: true,
            trim: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        bookingDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.Booking ||
    mongoose.model("Booking", bookingSchema);
