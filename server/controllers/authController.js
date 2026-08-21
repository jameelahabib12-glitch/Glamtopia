const bcrypt = require("bcryptjs");
const User = require("../models/User");
// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role, phone_number } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["customer", "provider"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'customer' or 'provider'" });
    }
    // Per ERD FR-11: phone_number is required for customers, optional for providers at signup
    if (role === "customer" && !phone_number) {
      return res.status(400).json({ message: "Phone number is required for customer accounts" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone_number: phone_number || null,
    });
    // Log the user in immediately after registering by creating a session
    req.session.userId = user._id;
    req.session.role = user.role;
    return res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone_number: user.phone_number },
    });
  } catch (err) {
    // Mongoose validation errors (e.g. the phone_number match pattern failing)
    // land here — surface the real message instead of a generic 500.
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0];
      return res.status(400).json({ message: firstError.message });
    }
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
}
// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    // password is select:false on the schema, so explicitly request it
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    req.session.userId = user._id;
    req.session.role = user.role;
    return res.status(200).json({
      message: "Logged in successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
}
// POST /api/auth/logout
async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Could not log out, please try again" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
}
// GET /api/auth/me  (quick check to see who's logged in — useful for frontend/demo)
async function getMe(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Session user no longer exists" });
  }
  return res.status(200).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}
module.exports = { register, login, logout, getMe };