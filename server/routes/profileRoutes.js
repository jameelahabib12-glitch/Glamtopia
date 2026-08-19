const express = require("express");
const router = express.Router();
const { getMyProfile, updateMyProfile, getPublicProviderProfile } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/authMiddleware");
const { uploadPhoto } = require("../middleware/uploadMiddleware");

router.get("/", requireAuth, getMyProfile);
// uploadPhoto.single("photo") parses multipart/form-data: text fields land in
// req.body, the uploaded file (if any) lands in req.file. Works fine even
// when no file is sent (e.g. provider saving bio/services with plain fields).
router.put("/", requireAuth, uploadPhoto.single("photo"), updateMyProfile);
router.get("/provider/:id", getPublicProviderProfile); // public, no auth needed

module.exports = router;
