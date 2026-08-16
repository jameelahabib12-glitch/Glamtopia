const express = require("express");
const router = express.Router();
const {
  createSlot,
  getOpenSlotsByProvider,
  deleteSlot,
} = require("../controllers/availabilityController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Public — guests/customers browsing a provider's open slots
router.get("/:providerId", getOpenSlotsByProvider);

// Protected — only the logged-in provider manages their own slots
router.post("/", requireAuth, requireRole("provider"), createSlot);
router.delete("/:id", requireAuth, requireRole("provider"), deleteSlot);

module.exports = router;