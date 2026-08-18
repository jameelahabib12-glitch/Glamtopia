const express = require("express");
const router = express.Router();
const { getMyProfile, updateMyProfile, getPublicProviderProfile } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/", requireAuth, getMyProfile);
router.put("/", requireAuth, updateMyProfile);
router.get("/provider/:id", getPublicProviderProfile); // public, no auth needed

module.exports = router;
