const express = require('express');
const router = express.Router();
const { getMyScore, getTeamScores, getUserReport, computeAll } = require('../controllers/kpiController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/my-score', protect, getMyScore);
router.get('/team', protect, requireRole('admin', 'hr'), getTeamScores);
router.get('/report/:userId', protect, requireRole('admin', 'hr'), getUserReport);
router.post('/compute', protect, requireRole('admin'), computeAll);

module.exports = router;
