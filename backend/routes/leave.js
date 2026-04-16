const express = require('express');
const router = express.Router();
const {
  createLeave, getMyLeaves, getBalance, getAllLeaves, approveLeave, rejectLeave,
} = require('../controllers/leaveController');
const { protect, requireRole } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/request', protect, upload.single('proof'), createLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/balance', protect, getBalance);
router.get('/all', protect, requireRole('admin', 'hr'), getAllLeaves);
router.patch('/:id/approve', protect, requireRole('admin', 'hr'), approveLeave);
router.patch('/:id/reject', protect, requireRole('admin', 'hr'), rejectLeave);

module.exports = router;
