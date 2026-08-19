const express = require("express");
const router = express.Router();
const {
  createFaq,
  getFaqsByProvider,
  updateFaq,
  deleteFaq,
} = require("../controllers/providerFaqController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Public — anyone (guest, customer) can view a provider's FAQs
router.get("/:providerId", getFaqsByProvider);

// Protected — only a logged-in provider can create/edit/delete
router.post("/", requireAuth, requireRole("provider"), createFaq);
router.put("/:id", requireAuth, requireRole("provider"), updateFaq);
router.delete("/:id", requireAuth, requireRole("provider"), deleteFaq);

module.exports = router;