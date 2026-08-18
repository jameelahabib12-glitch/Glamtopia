const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");

// GET /api/profile — the logged-in user's own profile
// (For providers, this is a convenience wrapper around what
// GET /api/providers/me already returns — kept here so one endpoint
// covers "my profile" regardless of role, for a shared profile page.)
async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "customer") {
      return res.json({ user });
    }

    const profile = await ProviderProfile.findOne({ user_id: req.session.userId });
    return res.json({ user, profile });
  } catch (err) {
    console.error("Get profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/profile
// Both roles can update name/email/phone_number. Providers additionally
// update their business_name/bio/location/category/contact_info here.
// Services and availability are NOT handled here — they're their own
// collections with their own controllers (serviceController, availabilityController).
async function updateMyProfile(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, phone_number, business_name, bio, location, category, contact_info } = req.body;

    if (name && name.trim() !== "") user.name = name.trim();
    if (email && email.trim() !== "") user.email = email.trim().toLowerCase();
    if (phone_number !== undefined) user.phone_number = phone_number;
    await user.save();

    if (user.role === "customer") {
      return res.json({
        message: "Profile updated successfully",
        user: { id: user._id, name: user.name, email: user.email, phone_number: user.phone_number, role: user.role },
      });
    }

    const profileUpdates = {};
    if (business_name !== undefined) profileUpdates.business_name = business_name;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (location !== undefined) profileUpdates.location = location;
    if (category !== undefined) profileUpdates.category = category;
    if (contact_info !== undefined) profileUpdates.contact_info = contact_info;

    const profile = await ProviderProfile.findOneAndUpdate(
      { user_id: req.session.userId },
      { $set: profileUpdates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "No provider profile yet — create one first via POST /api/providers" });
    }

    return res.json({
      message: "Provider profile updated successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profile,
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
    const profile = await ProviderProfile.findOne({ user_id: user._id });
    return res.json({ user, profile });
  } catch (err) {
    console.error("Public profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getMyProfile, updateMyProfile, getPublicProviderProfile };
