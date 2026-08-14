// These routes exist to PROVE the middleware works end-to-end for the demo.
// Once real dashboard/booking routes exist, this file can be deleted.
const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Any logged-in user (customer OR provider)
router.get("/dashboard", requireAuth, (req, res) => {
  res.json({ message: `Welcome, your role is ${req.session.role}` });
});

// Customer-only
router.get("/customer-only", requireAuth, requireRole("customer"), (req, res) => {
  res.json({ message: "This is a customer-only route" });
});

// Provider-only
router.get("/provider-only", requireAuth, requireRole("provider"), (req, res) => {
  res.json({ message: "This is a provider-only route" });
});

module.exports = router;
