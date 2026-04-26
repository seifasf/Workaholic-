const express = require('express');
const router = express.Router();
const {
  clockIn, clockOut, createSession, updateTodaySession, getHistory, getTodayStatus, getLiveBoard, getAdminHistory, getMyStats,
} = require('../controllers/attendanceController');
const { protect, requireRole } = require('../middleware/auth');

// REST-style endpoints
router.post('/sessions', protect, createSession);
router.patch('/sessions/today', protect, updateTodaySession);

// Backward-compatible action endpoints
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.get('/history', protect, getHistory);
router.get('/today', protect, getTodayStatus);
router.get('/my-stats', protect, getMyStats);
router.get('/live', protect, requireRole('admin'), getLiveBoard);
router.get('/admin', protect, requireRole('admin'), getAdminHistory);

module.exports = router;
