const express = require("express");

const router = express.Router();

const glamtopiaContext = `
You are the chatbot assistant for Glamtopia.

Glamtopia is a local beauty services marketplace.

Customers can:
- Browse beauty service providers.
- View provider profiles.
- View services and prices.
- Check provider availability.
- Book an available time slot.
- View their bookings.
- Cancel upcoming bookings according to the booking rules.
- Leave a rating and review after completing a booking.

Providers can:
- Create and edit their public profile.
- Add and manage their beauty services and prices.
- Set their availability.
- View incoming bookings.

Important rules:
- Only registered customers can make bookings.
- A booked time slot must not be available to another customer.
- Reviews are allowed only for completed bookings.
- Glamtopia does not include online payment processing.
- There is no admin role.
- There is no customer-provider messaging system.
`;


// ==========================================
// CHATBOT RESPONSE
// ==========================================

function getChatbotResponse(message) {

    const question = message.toLowerCase().trim();


    // Glamtopia
    if (
        question.includes("what is glamtopia") ||
        question.includes("what's glamtopia") ||
        question.includes("glamtopia kya hai") ||
        question.includes("glamtopia")
    ) {
        return "Glamtopia is a local beauty services marketplace where customers can discover beauty service providers, view their services and prices, check availability, make bookings, and leave reviews after completed bookings.";
    }


    // Customer
    if (
        question.includes("customer") ||
        question.includes("customer can do") ||
        question.includes("what can customer")
    ) {
        return "A customer can browse beauty providers, view profiles, services and prices, check availability, book an available time slot, view bookings, cancel upcoming bookings according to the booking rules, and leave a rating and review after completing a booking.";
    }


    // Provider
    if (
        question.includes("provider") ||
        question.includes("provider can do") ||
        question.includes("what can provider")
    ) {
        return "A provider can create and edit their public profile, add services and prices, manage availability, and view incoming bookings.";
    }


    // Services
    if (
        question.includes("service") ||
        question.includes("services")
    ) {
        return "Glamtopia allows customers to view beauty services offered by providers along with their prices.";
    }


    // Booking
    if (
        question.includes("booking") ||
        question.includes("book") ||
        question.includes("appointment")
    ) {
        return "Customers can book an available time slot with a beauty service provider. Once a slot is booked, it must not be available to another customer.";
    }


    // Reviews
    if (
        question.includes("review") ||
        question.includes("rating")
    ) {
        return "Customers can leave a rating and comment only after completing a booking. This keeps reviews connected to real and verified bookings.";
    }


    // Profile
    if (
        question.includes("profile") ||
        question.includes("edit profile")
    ) {
        return "Providers can create and edit their public profile, including their information, services, pricing, and availability.";
    }


    // Availability
    if (
        question.includes("availability") ||
        question.includes("available")
    ) {
        return "Providers can define their available days and time blocks. Customers can check availability before making a booking.";
    }


    // Payment
    if (
        question.includes("payment") ||
        question.includes("pay")
    ) {
        return "Glamtopia does not include real online payment processing. A simple pay-at-appointment option can be used.";
    }


    // Cancel
    if (
        question.includes("cancel")
    ) {
        return "Customers can cancel upcoming bookings according to the cancellation rules defined by the Glamtopia booking system.";
    }


    // Greeting
    if (
        question.includes("hello") ||
        question.includes("hi") ||
        question.includes("hey") ||
        question.includes("salam")
    ) {
        return "Hello! 👋 Welcome to Glamtopia. I can help you with beauty services, providers, bookings, profiles, availability, and reviews.";
    }


    // Default response
    return "I'm the Glamtopia Assistant 🤖. I can help you with providers, beauty services, prices, availability, bookings, profiles, and reviews. Please ask me something about Glamtopia.";
}


// ==========================================
// CHATBOT API
// ==========================================

router.post("/", (req, res) => {

    const { message } = req.body;


    if (!message) {

        return res.status(400).json({
            message: "Please enter a question."
        });

    }


    const reply =
        getChatbotResponse(message);


    res.json({

        reply: reply,

        context: glamtopiaContext

    });

});


module.exports = router;