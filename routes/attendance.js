const express = require('express');
const router = express.Router();
const {
  clockIn, clockOut, getHistory, getTodayStatus, getLiveBoard, getAdminHistory, getMyStats,
} = require('../controllers/attendanceController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.get('/history', protect, getHistory);
router.get('/today', protect, getTodayStatus);
router.get('/my-stats', protect, getMyStats);
router.get('/live', protect, requireRole('admin', 'hr'), getLiveBoard);
router.get('/admin', protect, requireRole('admin', 'hr'), getAdminHistory);

module.exports = router;
