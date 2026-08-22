const bcrypt = require("bcryptjs");
const User = require("../models/User");

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role, phone_number } = req.body;

    // --- Type guards: SECURITY, not just validation ---
    // Without this, someone could send { "email": { "$gt": "" } } and
    // manipulate the MongoDB query below (NoSQL injection). Every field
    // that ends up inside a query or a bcrypt call MUST be confirmed as
    // an actual string first.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({ message: "Invalid input format" });
    }
    if (phone_number != null && typeof phone_number !== "string") {
      // Loose `!= null` deliberately catches BOTH undefined and null —
      // JSON has no `undefined`, so a client omitting the field entirely
      // vs. explicitly sending `null` (which register.html does for an
      // optional provider phone number) must both be treated as "not
      // provided." The previous strict `!== undefined` check rejected a
      // real, valid provider signup with no phone number as "Invalid
      // input format."
      return res.status(400).json({ message: "Invalid input format" });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["customer", "provider"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'customer' or 'provider'" });
    }
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

    req.session.userId = user._id;
    req.session.role = user.role;

    return res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
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

    // Same reasoning as register — this is the more critical of the two,
    // since login directly gates access to the account.
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input format" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Suspended accounts (FR-15) should not be able to log in and keep
    // using the platform while suspended.
    if (user.is_suspended) {
      return res.status(403).json({ message: "This account has been suspended. Contact support." });
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

// GET /api/auth/me
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