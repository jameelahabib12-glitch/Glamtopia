const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");

// Small helper: services are owned by a provider_profiles._id, not a
// users._id directly — this resolves the logged-in user to their profile ID.
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
        if (!name || !description || price === undefined) {
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
            name,
            description,
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

// DELETE /api/services/:id — per SRS Open Questions: services are never
// hard-deleted, they're archived (is_active: false) so booking history that
// references them stays intact. This ALWAYS archives rather than removing
// the document.
//
// TODO once a Booking model exists: block/warn if this service has active
// future bookings, per the original spec ("deletion prevented if active
// future bookings exist"). No Booking model exists yet in this codebase,
// so that check can't be implemented until then — flag this to your team
// when bookings are built, don't skip it silently.
exports.deleteService = async (req, res) => {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const service = await Service.findOneAndUpdate(
            { _id: req.params.id, provider_id: providerId },
            { $set: { is_active: false } },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found or not yours" });
        }

        res.json({ message: "Service archived", service });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to archive service" });
    }
};