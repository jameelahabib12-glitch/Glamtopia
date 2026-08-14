// requireAuth: blocks the request unless there's an active session.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  next();
}

// requireRole("provider") or requireRole("customer"):
// use AFTER requireAuth on routes that only one role should access.
// e.g. only providers can manage availability; only customers can book.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.role) {
      return res.status(401).json({ message: "You must be logged in to do this" });
    }
    if (req.session.role !== role) {
      return res.status(403).json({ message: `This action is only available to ${role}s` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
