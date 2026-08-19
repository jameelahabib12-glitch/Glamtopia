const mongoose = require("mongoose");

const providerProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        bio: {
            type: String,
            trim: true,
            default: ""
        },

        services: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },

                price: {
                    type: Number,
                    required: true
                }
            }
        ],

        availability: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ProviderProfile", providerProfileSchema);
