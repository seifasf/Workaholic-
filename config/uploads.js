const multer = require('multer');

// Leave proof uploads (stored inline in MongoDB as base64).
const uploadProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      /image\/(jpeg|png|webp|gif)/.test(file.mimetype) ||
      file.mimetype === 'application/pdf';
    if (ok) cb(null, true);
    else cb(new Error('Only images (JPEG/PNG/WebP/GIF) or PDF files are allowed'));
  },
});

// Avatar uploads (stored inline in MongoDB as base64).
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP images are allowed'));
  },
});

module.exports = { uploadProof, uploadAvatar };

