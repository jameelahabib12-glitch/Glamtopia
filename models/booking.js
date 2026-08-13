const mongoose = require("mongoose");

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
            enum: [
                "pending",
                "confirmed",
                "completed",
                "cancelled"
            ],
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