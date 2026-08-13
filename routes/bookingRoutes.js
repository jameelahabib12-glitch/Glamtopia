const express = require("express");

const router = express.Router();

const Booking = require("../models/booking");
const User = require("../models/user");


// Create a test completed booking
router.post("/test", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        const customer = await User.findById(
            req.session.userId
        );

        if (!customer) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (customer.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can create bookings"
            });
        }

        const {
            provider,
            serviceName,
            price
        } = req.body;

        if (!provider || !serviceName || price === undefined) {
            return res.status(400).json({
                message: "Provider, service name and price are required"
            });
        }

        const providerUser = await User.findById(provider);

        if (!providerUser) {
            return res.status(404).json({
                message: "Provider not found"
            });
        }

        if (providerUser.role !== "provider") {
            return res.status(400).json({
                message: "Selected user is not a provider"
            });
        }

        const booking = await Booking.create({

            customer: customer._id,

            provider: providerUser._id,

            serviceName,

            price: Number(price),

            bookingDate: new Date(),

            status: "completed"

        });

        res.status(201).json({
            message: "Test completed booking created",
            booking
        });

    } catch (error) {

        console.error(
            "Booking error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }

});


module.exports = router;