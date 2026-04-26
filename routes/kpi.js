const express = require('express');
const router = express.Router();
const {
  getMyScore, getTeamScores, getUserReport, computeAll, createComputationRun,
} = require('../controllers/kpiController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/my-score', protect, getMyScore);
router.get('/team', protect, requireRole('admin'), getTeamScores);
router.get('/report/:userId', protect, requireRole('admin'), getUserReport);

// REST-style endpoint
router.post('/runs', protect, requireRole('admin'), createComputationRun);

// Backward-compatible action endpoint
router.post('/compute', protect, requireRole('admin'), computeAll);

module.exports = router;
