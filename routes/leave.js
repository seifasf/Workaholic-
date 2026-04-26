const express = require('express');
const router = express.Router();
const {
  createLeave, getMyLeaves, getBalance, getAllLeaves, approveLeave, rejectLeave, reviewLeave,
} = require('../controllers/leaveController');
const { protect, requireRole } = require('../middleware/auth');
const { uploadProof } = require('../config/uploads');

router.post('/request', protect, uploadProof.single('proof'), createLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/balance', protect, getBalance);
router.get('/all', protect, requireRole('admin', 'hr'), getAllLeaves);

// REST-style endpoint
router.patch('/:id', protect, requireRole('admin', 'hr'), reviewLeave);

// Backward-compatible action endpoints
router.patch('/:id/approve', protect, requireRole('admin', 'hr'), approveLeave);
router.patch('/:id/reject', protect, requireRole('admin', 'hr'), rejectLeave);

module.exports = router;
