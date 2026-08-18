const express = require("express");
const router = express.Router();
const {
    createProfile,
    listProviders,
    getProviderById,
    getMyProfile,
    updateMyProfile,
} = require("../controllers/providerProfileController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Public — guests/customers browsing providers (FR-02, FR-03)
router.get("/", listProviders);

// Specific routes before the generic "/:id" so "/me" isn't swallowed by it
router.get("/me", requireAuth, requireRole("provider"), getMyProfile);
router.patch("/me", requireAuth, requireRole("provider"), updateMyProfile);

router.get("/:id", getProviderById);

// Protected — only a logged-in provider can create their own profile
router.post("/", requireAuth, requireRole("provider"), createProfile);

module.exports = router;
