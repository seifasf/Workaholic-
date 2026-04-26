const KPIScore = require('../models/KPIScore');
const { computeKPIForUser, computeAllKPIs } = require('../services/kpiEngine');

exports.getMyScore = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    let score = await KPIScore.findOne({ userId: req.user._id, month, year });
    if (!score) score = await computeKPIForUser(req.user._id, month, year);
    res.json(score);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamScores = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const scores = await KPIScore.find({ month, year })
      .populate('userId', 'name department avatar kpiScore');
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const scores = await KPIScore.find({ userId }).sort({ year: 1, month: 1 }).limit(12);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.computeAll = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.body.month) || now.getMonth() + 1;
    const year = parseInt(req.body.year) || now.getFullYear();
    const results = await computeAllKPIs(month, year);
    res.json({ message: 'KPI computed', count: results.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REST-style alias for KPI computation run
exports.createComputationRun = async (req, res) => exports.computeAll(req, res);
