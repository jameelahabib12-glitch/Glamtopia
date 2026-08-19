const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure the upload folder exists (multer won't create it for you)
const uploadDir = path.join(__dirname, "..", "uploads", "profile-photos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // req.session.userId + timestamp keeps filenames unique per user/upload
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.session.userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
  }
  cb(null, true);
}

const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = { uploadPhoto };
