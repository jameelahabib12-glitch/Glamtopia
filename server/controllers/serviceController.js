const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const Booking = require("../models/Booking");
const AvailabilitySlot = require("../models/AvailabilitySlot");

async function getMyProviderProfileId(userId) {
    const profile = await ProviderProfile.findOne({ user_id: userId });
    return profile ? profile._id : null;
}

// POST /api/services — create a service under the logged-in provider
exports.createService = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "Create your provider profile before adding services" });
        }

        const { name, description, duration_minutes, price } = req.body;

        // Type guards first — a string field that's actually an object/array
        // could otherwise reach Service.create() and behave unpredictably.
        if (typeof name !== "string" || typeof description !== "string") {
            return res.status(400).json({ message: "name and description must be text" });
        }
        if (!name.trim() || !description.trim() || price === undefined) {
            return res.status(400).json({ message: "name, description, and price are required" });
        }
        if (typeof price !== "number" || price < 0) {
            return res.status(400).json({ message: "price must be a non-negative number" });
        }
        if (duration_minutes !== undefined && (typeof duration_minutes !== "number" || duration_minutes <= 0)) {
            return res.status(400).json({ message: "duration_minutes must be a positive number" });
        }

        const service = await Service.create({
            provider_id: providerId,
            name: name.trim(),
            description: description.trim(),
            duration_minutes: duration_minutes || 60,
            price,
        });

        res.status(201).json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create service" });
    }
};

// GET /api/services/provider/:providerId — public, a provider's active services
exports.listServicesByProvider = async (req, res) => {
    try {
        const services = await Service.find({
            provider_id: req.params.providerId,
            is_active: true,
        }).sort({ created_at: 1 });

        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch services" });
    }
};

// GET /api/services/:id — public, single service (used on booking screen)
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service not found" });
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch service" });
    }
};

// PATCH /api/services/:id — update a service, only if it belongs to the logged-in provider
exports.updateService = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const allowedFields = ["name", "description", "duration_minutes", "price", "is_active"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        // Type guards on whatever fields were actually sent
        if (updates.name !== undefined && typeof updates.name !== "string") {
            return res.status(400).json({ message: "name must be text" });
        }
        if (updates.description !== undefined && typeof updates.description !== "string") {
            return res.status(400).json({ message: "description must be text" });
        }
        if (updates.is_active !== undefined && typeof updates.is_active !== "boolean") {
            return res.status(400).json({ message: "is_active must be true or false" });
        }
        if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price < 0)) {
            return res.status(400).json({ message: "price must be a non-negative number" });
        }
        if (updates.duration_minutes !== undefined && (typeof updates.duration_minutes !== "number" || updates.duration_minutes <= 0)) {
            return res.status(400).json({ message: "duration_minutes must be a positive number" });
        }

        const service = await Service.findOneAndUpdate(
            { _id: req.params.id, provider_id: providerId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found or not yours" });
        }

        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update service" });
    }
};

// DELETE /api/services/:id
// FR-16 + senior dev decision:
//   - If ANY booking (pending or confirmed) for this service has an
//     appointment within the next 24 hours -> block deletion entirely.
//   - Otherwise -> archive the service (is_active: false) AND
//     automatically cancel any other future bookings on it (more than
//     24 hours out), freeing their slots.
exports.deleteService = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const service = await Service.findOne({ _id: req.params.id, provider_id: providerId });
        if (!service) {
            return res.status(404).json({ message: "Service not found or not yours" });
        }

        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const activeBookings = await Booking.find({
            service_id: service._id,
            status: { $in: ["pending", "confirmed"] },
        }).populate("slot_id");

        const hasImminentBooking = activeBookings.some(
            (b) => b.slot_id && b.slot_id.start_time < in24Hours
        );

        if (hasImminentBooking) {
            return res.status(400).json({
                message: "Cannot delete this service — it has a booking within the next 24 hours",
            });
        }

        for (const booking of activeBookings) {
            booking.status = "cancelled";
            booking.cancelled_at = now;
            await booking.save();

            if (booking.slot_id) {
                await AvailabilitySlot.findByIdAndUpdate(booking.slot_id._id, { $set: { booked: false } });
            }
        }

        service.is_active = false;
        await service.save();

        res.json({
            message: "Service archived",
            cancelledBookings: activeBookings.length,
            service,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to archive service" });
    }
};