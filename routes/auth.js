const express = require('express');
const router = express.Router();
const { register, registerPublic, login, getMe, updateProfile, uploadAvatar } = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/auth');
const { uploadAvatar: uploadAvatarMiddleware } = require('../config/uploads');

router.post('/register', registerPublic);
router.post('/register/admin', protect, requireRole('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/avatar', protect, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

module.exports = router;
