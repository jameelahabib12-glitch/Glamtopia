const express = require("express");
const router = express.Router();
const {
    createService,
    listServicesByProvider,
    getServiceById,
    updateService,
    deleteService,
} = require("../controllers/serviceController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Public — anyone browsing a provider's profile sees their services
router.get("/provider/:providerId", listServicesByProvider);
router.get("/:id", getServiceById);

// Protected — only the logged-in provider manages their own services
router.post("/", requireAuth, requireRole("provider"), createService);
router.patch("/:id", requireAuth, requireRole("provider"), updateService);
router.delete("/:id", requireAuth, requireRole("provider"), deleteService); // archives, does not hard-delete

module.exports = router;