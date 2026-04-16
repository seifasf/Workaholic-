const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Leave-proof uploads — still go to Cloudinary when configured
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'workaholic/leave-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

// Avatar uploads — stored in memory then saved as base64 in MongoDB
// No external service required
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP images are allowed'));
    }
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { cloudinary, upload, uploadAvatar };
