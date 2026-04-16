const express = require('express');
const router = express.Router();
const { getMyNotifications, markRead, getUnreadCount } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/mark-read', protect, markRead);

module.exports = router;
