const express = require('express');
const router = express.Router();
const {
  getMyNotifications, markRead, updateNotifications, getUnreadCount,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);

// REST-style endpoint
router.patch('/', protect, updateNotifications);

// Backward-compatible action endpoint
router.patch('/mark-read', protect, markRead);

module.exports = router;
