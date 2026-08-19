const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");

// GET /api/profile
async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "customer") {
      return res.json({ user });
    }

    const profile = await ProviderProfile.findOne({ user: req.session.userId });
    return res.json({ user, profile });
  } catch (err) {
    console.error("Get profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/profile
// Both roles can update name/email. Customers additionally update bio/photo.
// Providers additionally update bio/services/availability (on ProviderProfile).
// Route is wired with multer (uploadPhoto.single("photo")), so req.body holds
// the text fields and req.file (if present) holds the uploaded photo.
async function updateMyProfile(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, bio, services, availability } = req.body;

    if (name && name.trim() !== "") user.name = name.trim();
    if (email && email.trim() !== "") user.email = email.trim().toLowerCase();

    if (user.role === "customer") {
      if (bio !== undefined) user.bio = bio.trim();
      if (req.file) user.photo = `/uploads/profile-photos/${req.file.filename}`;
      await user.save();

      return res.json({
        message: "Profile updated successfully",
        user: { id: user._id, name: user.name, email: user.email, role: user.role, bio: user.bio, photo: user.photo }
      });
    }

    await user.save();

    let profile = await ProviderProfile.findOne({ user: req.session.userId });
    if (!profile) {
      profile = new ProviderProfile({ user: req.session.userId });
    }

    if (bio !== undefined) profile.bio = bio;
    if (services !== undefined) profile.services = services;
    if (availability !== undefined) profile.availability = availability;
    await profile.save();

    return res.json({
      message: "Provider profile updated successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profile: { id: profile._id, bio: profile.bio, services: profile.services, availability: profile.availability }
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

// GET /api/profile/provider/:id  (public)
async function getPublicProviderProfile(req, res) {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "provider" }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Provider not found" });
    }
    const profile = await ProviderProfile.findOne({ user: user._id });
    return res.json({ user, profile });
  } catch (err) {
    console.error("Public profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getMyProfile, updateMyProfile, getPublicProviderProfile };
