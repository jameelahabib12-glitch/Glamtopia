const express = require("express");
const router = express.Router();
const {
    listFaqs,
    askFaq,
    createProviderFaq,
    updateProviderFaq,
    deleteProviderFaq,
} = require("../controllers/faqController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Public — used by the chatbot widget (Jameela's existing routes, unchanged)
router.get("/", listFaqs);
router.post("/ask", askFaq);

// Protected — provider manages their own FAQ entries (Eeman's addition)
router.post("/", requireAuth, requireRole("provider"), createProviderFaq);
router.patch("/:id", requireAuth, requireRole("provider"), updateProviderFaq);
router.delete("/:id", requireAuth, requireRole("provider"), deleteProviderFaq);

module.exports = router;