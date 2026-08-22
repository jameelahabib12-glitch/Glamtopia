const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");

// SRS §7: "tunable constant" — confirmed with team as 3.
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
// Merges two teammates' versions of this file:
//  - Input validation (ObjectId format) and the atomic findOneAndUpdate
//    claim style
//  - The MIN_NOTICE_HOURS/MAX_ADVANCE_DAYS booking-window check (SRS §8),
//    which had been dropped in one branch
//  - The whole function wrapped in try/catch, not just the transaction body
//    — a DB hiccup on the Service/Slot lookups BEFORE the transaction
//    starts would otherwise be an unhandled rejection instead of a clean
//    500
// ---------------------------------------------------------------------------
async function createBooking(req, res) {
    try {
        const { serviceId, slotId } = req.body;

        if (typeof serviceId !== "string" || typeof slotId !== "string") {
            return res.status(400).json({ message: "serviceId and slotId are required" });
        }
        if (!mongoose.Types.ObjectId.isValid(serviceId) || !mongoose.Types.ObjectId.isValid(slotId)) {
            return res.status(400).json({ message: "Invalid serviceId or slotId" });
        }

        const service = await Service.findById(serviceId);
        if (!service || service.is_active === false) {
            return res.status(404).json({ message: "Service not found or no longer active" });
        }

        const slot = await AvailabilitySlot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: "Availability slot not found" });
        }

        // The slot and the service must belong to the SAME provider — otherwise
        // a customer could book a slot from one provider's calendar against a
        // totally different provider's service.
        if (slot.provider_id.toString() !== service.provider_id.toString()) {
            return res.status(400).json({ message: "This slot does not belong to that service's provider" });
        }

        const now = new Date();
        const minStart = new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
        const maxStart = new Date(now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
        if (slot.start_time < minStart || slot.start_time > maxStart) {
            return res.status(400).json({
                message: `Bookings must be made between ${MIN_NOTICE_HOURS} hours and ${MAX_ADVANCE_DAYS} days in advance`,
            });
        }

        const session = await mongoose.startSession();
        let booking = null;
        let slotWasTaken = false;

        try {
            await session.withTransaction(async () => {
                // Atomic claim, INSIDE the transaction (SRS §6): if another request
                // claimed this slot a moment earlier, this returns null and the
                // throw below aborts + rolls back the whole transaction.
                const claimedSlot = await AvailabilitySlot.findOneAndUpdate(
                    { _id: slotId, booked: false },
                    { $set: { booked: true } },
                    { new: true, session }
                );

                if (!claimedSlot) {
                    slotWasTaken = true;
                    throw new Error("SLOT_ALREADY_TAKEN");
                }

                const created = await Booking.create(
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

                booking = created[0];
            });
        } catch (err) {
            if (slotWasTaken) {
                return res.status(409).json({ message: "That slot was just taken. Pick another time below." });
            }
            throw err; // handled by the outer catch below
        } finally {
            session.endSession();
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate("provider_id")
            .populate("service_id")
            .populate("slot_id");

        return res.status(201).json({
            message: "Booking request sent — waiting for provider confirmation",
            booking: populatedBooking,
        });
    } catch (err) {
        console.error("Create booking error:", err);
        return res.status(500).json({ message: "Server error while creating booking" });
    }
}

// GET /api/bookings/mine — the logged-in customer's own bookings
async function listMyBookings(req, res) {
    try {
        const { status } = req.query;
        const filter = { customer_id: req.session.userId };
        if (status && status !== "all") filter.status = status;

        const bookings = await Booking.find(filter)
            .populate("provider_id")
            .populate("service_id")
            .populate("slot_id")
            .sort({ created_at: -1 });

        return res.json(bookings);
    } catch (err) {
        console.error("List my bookings error:", err);
        return res.status(500).json({ message: "Failed to fetch your bookings" });
    }
}

// GET /api/bookings/provider — the logged-in provider's incoming bookings
async function listProviderBookings(req, res) {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const { status } = req.query;
        const filter = { provider_id: providerId };
        if (status && status !== "all") filter.status = status;

        const bookings = await Booking.find(filter)
            .populate("customer_id", "name email phone_number")
            .populate("service_id")
            .populate("slot_id")
            .sort({ created_at: -1 });

        return res.json(bookings);
    } catch (err) {
        console.error("List provider bookings error:", err);
        return res.status(500).json({ message: "Failed to fetch bookings" });
    }
}

// PATCH /api/bookings/:id/confirm — provider accepts a pending booking
async function confirmBooking(req, res) {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const booking = await Booking.findOne({ _id: req.params.id, provider_id: providerId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found or does not belong to you" });
        }
        if (booking.status !== "pending") {
            return res.status(400).json({ message: `Cannot confirm booking in '${booking.status}' status` });
        }

        booking.status = "confirmed";
        booking.confirmed_at = new Date();
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate("customer_id", "name email phone_number")
            .populate("service_id")
            .populate("slot_id");

        return res.json({ message: "Booking confirmed", booking: updatedBooking });
    } catch (err) {
        console.error("Confirm booking error:", err);
        return res.status(500).json({ message: "Failed to confirm booking" });
    }
}

// PATCH /api/bookings/:id/complete — provider marks a confirmed booking done
// (this is what unlocks the customer's ability to leave a review)
async function completeBooking(req, res) {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const booking = await Booking.findOne({ _id: req.params.id, provider_id: providerId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found or does not belong to you" });
        }
        if (booking.status !== "confirmed") {
            return res
                .status(400)
                .json({ message: `Only confirmed bookings can be marked completed (current: '${booking.status}')` });
        }

        booking.status = "completed";
        booking.completed_at = new Date();
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate("customer_id", "name email phone_number")
            .populate("service_id")
            .populate("slot_id");

        return res.json({ message: "Booking marked as completed", booking: updatedBooking });
    } catch (err) {
        console.error("Complete booking error:", err);
        return res.status(500).json({ message: "Failed to complete booking" });
    }
}

// PATCH /api/bookings/:id/cancel — customer or provider cancels a
// pending/confirmed booking. Frees the slot immediately (SRS §8).
//
// FR-15 + senior dev decision: the 24-hour cutoff applies to BOTH customer
// AND provider cancellations, not just the customer. (If this decision
// wasn't actually confirmed with your senior dev/PM, flag it — a provider
// being blocked from cancelling their own booking within 24h is a real
// behavior change worth double-checking before it ships.)
//
// Cancellation-warning + suspension only applies when the CUSTOMER cancels
// a booking the provider had already CONFIRMED — cancelling while still
// pending never counts, and providers cancelling never counts against the
// customer.
//
// Wrapped in a transaction (unlike a prior version of this function): if
// the process died between freeing the slot and saving the booking status,
// the slot could be stuck "booked" forever with no booking to match it.
async function cancelBooking(req, res) {
    const session = await mongoose.startSession();
    try {
        let result;
        let suspended = false;

        await session.withTransaction(async () => {
            const userId = req.session.userId;
            const userRole = req.session.role;

            let booking;
            let isProvider = false;
            if (userRole === "customer") {
                booking = await Booking.findOne({ _id: req.params.id, customer_id: userId }).session(session);
            } else if (userRole === "provider") {
                const providerId = await getMyProviderProfileId(userId);
                if (!providerId) throw httpError(400, "You don't have a provider profile");
                booking = await Booking.findOne({ _id: req.params.id, provider_id: providerId }).session(session);
                isProvider = true;
            }

            if (!booking) throw httpError(404, "Booking not found or access denied");

            if (!["pending", "confirmed"].includes(booking.status)) {
                throw httpError(400, `Cannot cancel a booking that is already '${booking.status}'`);
            }

            const slot = await AvailabilitySlot.findById(booking.slot_id).session(session);
            if (slot) {
                const hoursUntilAppointment = (slot.start_time - new Date()) / (1000 * 60 * 60);
                if (hoursUntilAppointment < MIN_NOTICE_HOURS) {
                    throw httpError(
                        400,
                        `Bookings can only be cancelled at least ${MIN_NOTICE_HOURS} hours before the appointment. Please contact ${isProvider ? "the customer" : "the provider"} directly.`
                    );
                }
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
            if (!isProvider && wasConfirmed) {
                const customer = await User.findById(booking.customer_id).session(session);
                customer.cancellation_warning_count += 1;
                if (customer.cancellation_warning_count >= CANCELLATION_WARNING_THRESHOLD && !customer.is_suspended) {
                    customer.is_suspended = true;
                    suspended = true;
                }
                await customer.save({ session });
            }

            result = booking;
        });

        const updatedBooking = await Booking.findById(result._id)
            .populate("customer_id", "name email phone_number")
            .populate("service_id")
            .populate("slot_id");

        return res.json({
            message: suspended
                ? "Booking cancelled. Your account has been suspended due to repeated cancellations of confirmed bookings."
                : "Booking cancelled",
            booking: updatedBooking,
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error("Cancel booking error:", err);
        return res.status(500).json({ message: "Server error while cancelling booking" });
    } finally {
        session.endSession();
    }
}

function httpError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

module.exports = {
    createBooking,
    listMyBookings,
    listProviderBookings,
    confirmBooking,
    completeBooking,
    cancelBooking,
};