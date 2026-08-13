const express = require("express");
const router = express.Router();

const User = require("../models/user");
const ProviderProfile = require("../models/providerProfile");

// ======================================================
// GET MY PROFILE
// GET /api/profile
// ======================================================

router.get("/", async (req, res) => {
    try {
        // Check login
        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        // Find user
        const user = await User.findById(req.session.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // If customer
        if (user.role === "customer") {
            return res.json({
                user
            });
        }

        // Find provider profile
        const profile = await ProviderProfile.findOne({
            user: req.session.userId
        });

        res.json({
            user,
            profile
        });

    } catch (error) {
        console.log("Get profile error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ======================================================
// CREATE / UPDATE PROVIDER PROFILE
// PUT /api/profile
// ======================================================

router.put("/", async (req, res) => {
    try {
        // Check login
        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        // Find logged-in user
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Only provider can edit provider profile
        if (user.role !== "provider") {
            return res.status(403).json({
                message: "Only providers can edit provider profile"
            });
        }

        const {
            name,
            email,
            bio,
            services,
            availability
        } = req.body;


        // Update basic user information
        if (name && name.trim() !== "") {
            user.name = name.trim();
        }

        if (email && email.trim() !== "") {
            user.email = email.trim().toLowerCase();
        }

        await user.save();


        // Find existing provider profile
        let profile = await ProviderProfile.findOne({
            user: req.session.userId
        });


        // Create profile if it doesn't exist
        if (!profile) {
            profile = new ProviderProfile({
                user: req.session.userId
            });
        }


        // Update bio
        if (bio !== undefined) {
            profile.bio = bio;
        }


        // Update services
        if (services !== undefined) {
            profile.services = services;
        }


        // Update availability
        if (availability !== undefined) {
            profile.availability = availability;
        }


        await profile.save();


        res.json({
            message: "Provider profile updated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },

            profile: {
                id: profile._id,
                bio: profile.bio,
                services: profile.services,
                availability: profile.availability
            }
        });

    } catch (error) {
        console.log("Profile update error:", error.message);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// ======================================================
// PUBLIC PROVIDER PROFILE
// GET /api/profile/provider/:id
// ======================================================

router.get("/provider/:id", async (req, res) => {
    try {

        const user = await User.findOne({
            _id: req.params.id,
            role: "provider"
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Provider not found"
            });
        }


        const profile = await ProviderProfile.findOne({
            user: user._id
        });


        res.json({
            user,
            profile
        });

    } catch (error) {
        console.log("Public profile error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});
module.exports = router;