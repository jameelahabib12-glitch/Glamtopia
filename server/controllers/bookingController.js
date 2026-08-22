const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");

// Customer cancellation warning threshold (SRS §7: "a tunable constant, to
// be set by the team during implementation"). Crossing it suspends the
// account (users.is_suspended).
const CANCELLATION_WARNING_THRESHOLD = 3;

// Standard booking window (SRS §8 Final Decisions). Urgent/short-notice
// booking (provider_profiles.urgent_booking_*) is a separate stretch goal
// and intentionally NOT applied here.
const MIN_NOTICE_HOURS = 24;
const MAX_ADVANCE_DAYS = 30;

// provider_profiles._id for the logged-in provider's session user.
async function getMyProviderProfileId(userId) {
    const profile = await ProviderProfile.findOne({ user_id: userId });
    return profile ? profile._id : null;
}

// ---------------------------------------------------------------------------
// POST /api/bookings — customer books an open slot for a service.
//
// This is the answer to "checks slot availability before confirming" +
// "conflict prevention per ERD §4": the slot claim and the booking creation
// happen inside one MongoDB transaction, so either both succeed or neither
// does. The claim itself is the same atomic
//   updateOne({ _id: slotId, booked: false }, { $set: { booked: true } })
// pattern documented in availabilityController — two simultaneous requests
// for the same slot can never both win.
// ---------------------------------------------------------------------------
exports.createBooking = async (req, res) => {
    const { serviceId, slotId } = req.body;

    if (!serviceId || !slotId) {
        return res.status(400).json({ message: "serviceId and slotId are required" });
    }

    const session = await mongoose.startSession();

    try {
        let createdBooking;

        await session.withTransaction(async () => {
            const service = await Service.findById(serviceId).session(session);
            if (!service || !service.is_active) {
                throw httpError(404, "Service not found or no longer active");
            }

            const slot = await AvailabilitySlot.findById(slotId).session(session);
            if (!slot) {
                throw httpError(404, "Slot not found");
            }

            // The slot and the service must belong to the SAME provider —
            // otherwise a customer could book a slot from one provider's
            // calendar against a totally different provider's service.
            if (slot.provider_id.toString() !== service.provider_id.toString()) {
                throw httpError(400, "This slot does not belong to that service's provider");
            }

            const now = new Date();
            const minStart = new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
            const maxStart = new Date(now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
            if (slot.start_time < minStart || slot.start_time > maxStart) {
                throw httpError(
                    400,
                    `Bookings must be made between ${MIN_NOTICE_HOURS} hours and ${MAX_ADVANCE_DAYS} days in advance`
                );
            }

            // The atomic claim — this is the double-booking guard. If another
            // request claimed this slot a moment earlier, matchedCount is 0 and
            // the whole transaction is aborted (the throw rolls it back).
            const claim = await AvailabilitySlot.updateOne(
                { _id: slotId, booked: false },
                { $set: { booked: true } },
                { session }
            );
            if (claim.matchedCount === 0) {
                throw httpError(409, "This slot was just booked by someone else — please pick another");
            }

            const [booking] = await Booking.create(
                [
                    {
                        customer_id: req.session.userId,
                        provider_id: service.provider_id,
                        service_id: service._id,
                        slot_id: slot._id,
                        status: "pending",
                        price_at_booking: service.price,
                    },
                ],
                { session }
            );

            createdBooking = booking;
        });

        return res.status(201).json({ message: "Booking request sent — waiting for provider confirmation", booking: createdBooking });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error("Create booking error:", err);
        return res.status(500).json({ message: "Server error while creating booking" });
    } finally {
        session.endSession();
    }
};

function httpError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

// GET /api/bookings/mine — the logged-in customer's own bookings
exports.listMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer_id: req.session.userId })
            .populate({ path: "provider_id", select: "business_name location contact_info" })
            .populate({ path: "service_id", select: "name duration_minutes" })
            .populate({ path: "slot_id", select: "start_time end_time" })
            .sort({ created_at: -1 });

        res.json(bookings);
    } catch (err) {
        console.error("List my bookings error:", err);
        res.status(500).json({ message: "Failed to fetch your bookings" });
    }
};

// GET /api/bookings/provider — the logged-in provider's incoming bookings
exports.listProviderBookings = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const filter = { provider_id: providerId };
        if (req.query.status) filter.status = req.query.status;

        const bookings = await Booking.find(filter)
            .populate({ path: "customer_id", select: "name phone_number" })
            .populate({ path: "service_id", select: "name duration_minutes" })
            .populate({ path: "slot_id", select: "start_time end_time" })
            .sort({ created_at: -1 });

        res.json(bookings);
    } catch (err) {
        console.error("List provider bookings error:", err);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

// PATCH /api/bookings/:id/confirm — provider accepts a pending booking
exports.confirmBooking = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.id, provider_id: providerId, status: "pending" },
            { $set: { status: "confirmed", confirmed_at: new Date() } },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: "Pending booking not found, not yours, or already actioned" });
        }

        res.json({ message: "Booking confirmed", booking });
    } catch (err) {
        console.error("Confirm booking error:", err);
        res.status(500).json({ message: "Failed to confirm booking" });
    }
};

// PATCH /api/bookings/:id/complete — provider marks a confirmed booking done
// (this is what unlocks the customer's ability to leave a review)
exports.completeBooking = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.id, provider_id: providerId, status: "confirmed" },
            { $set: { status: "completed", completed_at: new Date() } },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: "Confirmed booking not found, not yours, or already actioned" });
        }

        res.json({ message: "Booking marked as completed", booking });
    } catch (err) {
        console.error("Complete booking error:", err);
        res.status(500).json({ message: "Failed to complete booking" });
    }
};

// PATCH /api/bookings/:id/cancel — customer or provider cancels a
// pending/confirmed booking. Frees the slot immediately (SRS §8).
// If the booking was already CONFIRMED and the CUSTOMER is the one
// cancelling, it counts as a cancellation warning against their account
// (SRS §8) — cancelling while still pending never counts.
exports.cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        let result;

        await session.withTransaction(async () => {
            const booking = await Booking.findById(req.params.id).session(session);
            if (!booking) throw httpError(404, "Booking not found");

            const isCustomer = req.session.role === "customer" && booking.customer_id.toString() === req.session.userId.toString();
            let isProvider = false;
            if (req.session.role === "provider") {
                const providerId = await getMyProviderProfileId(req.session.userId);
                isProvider = providerId && booking.provider_id.toString() === providerId.toString();
            }

            if (!isCustomer && !isProvider) {
                throw httpError(403, "You can only cancel your own bookings");
            }

            if (!["pending", "confirmed"].includes(booking.status)) {
                throw httpError(400, "Only pending or confirmed bookings can be cancelled");
            }

            const wasConfirmed = booking.status === "confirmed";

            booking.status = "cancelled";
            booking.cancelled_at = new Date();
            await booking.save({ session });

            // Free the slot immediately so someone else can book it.
            await AvailabilitySlot.updateOne(
                { _id: booking.slot_id },
                { $set: { booked: false } },
                { session }
            );

            // Warning only applies when a CUSTOMER cancels a booking the
            // provider had already confirmed.
            if (isCustomer && wasConfirmed) {
                const customer = await User.findById(booking.customer_id).session(session);
                customer.cancellation_warning_count += 1;
                if (customer.cancellation_warning_count >= CANCELLATION_WARNING_THRESHOLD) {
                    customer.is_suspended = true;
                }
                await customer.save({ session });
            }

            result = booking;
        });

        return res.json({ message: "Booking cancelled", booking: result });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error("Cancel booking error:", err);
        return res.status(500).json({ message: "Server error while cancelling booking" });
    } finally {
        session.endSession();
    }
};