const ProviderProfile = require("../models/ProviderProfile");

// POST /api/providers — create a new provider profile for the logged-in provider
exports.createProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const existingProfile = await ProviderProfile.findOne({ user_id: userId });
        if (existingProfile) {
            return res.status(400).json({ message: "You already have a provider profile" });
        }

        const {
            business_name,
            bio,
            location,
            category,
            contact_info,
            profile_image_url,
            urgent_booking_enabled,
            urgent_booking_min_notice_hours,
            urgent_booking_max_notice_hours,
        } = req.body;

        if (!business_name || !location || !category || !contact_info) {
            return res.status(400).json({
                message: "business_name, location, category, and contact_info are required",
            });
        }

        const profile = await ProviderProfile.create({
            user_id: userId,
            business_name,
            bio: bio || "",
            location,
            category,
            contact_info,
            profile_image_url: profile_image_url || null,
            urgent_booking_enabled: urgent_booking_enabled || false,
            urgent_booking_min_notice_hours: urgent_booking_min_notice_hours || null,
            urgent_booking_max_notice_hours: urgent_booking_max_notice_hours || null,
        });

        res.status(201).json(profile);
    } catch (err) {
        console.error("Create profile error:", err);
        res.status(500).json({ message: "Failed to create provider profile" });
    }
};

// GET /api/providers — public browse & filter providers (FR-02, FR-03)
exports.listProviders = async (req, res) => {
    try {
        const { category, search, q, location, sort } = req.query;
        const filter = {};

        if (category && category !== "all") {
            filter.category = category.toLowerCase();
        }

        const queryTerm = search || q;
        if (queryTerm) {
            const regex = new RegExp(queryTerm, "i");
            filter.$or = [
                { business_name: regex },
                { bio: regex },
                { location: regex },
                { category: regex },
            ];
        }

        if (location) {
            filter.location = new RegExp(location, "i");
        }

        let sortOption = { average_rating: -1, review_count: -1 };
        if (sort === "newest") {
            sortOption = { created_at: -1 };
        } else if (sort === "rating") {
            sortOption = { average_rating: -1 };
        } else if (sort === "reviews") {
            sortOption = { review_count: -1 };
        }

        const providers = await ProviderProfile.find(filter).sort(sortOption);
        res.status(200).json(providers);
    } catch (err) {
        console.error("List providers error:", err);
        res.status(500).json({ message: "Failed to fetch providers" });
    }
};

// GET /api/providers/:id — public, get single provider profile by ID
exports.getProviderById = async (req, res) => {
    try {
        const provider = await ProviderProfile.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }
        res.status(200).json(provider);
    } catch (err) {
        console.error("Get provider by ID error:", err);
        res.status(500).json({ message: "Failed to fetch provider" });
    }
};

// GET /api/providers/me — logged-in provider gets their own profile
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user_id: req.session.userId });
        if (!profile) {
            return res.status(404).json({ message: "Provider profile not found" });
        }
        res.status(200).json(profile);
    } catch (err) {
        console.error("Get my profile error:", err);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

// PATCH /api/providers/me — logged-in provider updates their own profile
exports.updateMyProfile = async (req, res) => {
    try {
        const allowedFields = [
            "business_name",
            "bio",
            "location",
            "category",
            "contact_info",
            "profile_image_url",
            "urgent_booking_enabled",
            "urgent_booking_min_notice_hours",
            "urgent_booking_max_notice_hours",
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const profile = await ProviderProfile.findOneAndUpdate(
            { user_id: req.session.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ message: "Provider profile not found" });
        }

        res.status(200).json(profile);
    } catch (err) {
        console.error("Update my profile error:", err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
