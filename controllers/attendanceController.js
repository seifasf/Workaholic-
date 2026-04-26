const AttendanceRecord = require('../models/AttendanceRecord');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyGPS, verifyIP, getClientIP } = require('../services/geoVerifier');
const { lateAlertEmail } = require('../services/emailService');

const todayStr = () => new Date().toISOString().slice(0, 10);

// Lateness is computed relative to the employee's configured start time (defaults to 09:00).
// We intentionally keep this logic server-side so clients can't "fake" lateness by changing device time.
const getLatenessMinutes = (workStartTime) => {
  const now = new Date();
  const [h, m] = workStartTime.split(':').map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const diff = Math.floor((now - start) / 60000);
  return diff > 0 ? diff : 0;
};

exports.clockIn = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ message: 'GPS location is required for clock-in' });
    }
    const date = todayStr();
    const existing = await AttendanceRecord.findOne({ userId: req.user._id, date });
    if (existing?.clockIn?.time) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }

    const ip = getClientIP(req);
    const gpsResult = verifyGPS(latNum, lngNum);
    if (!gpsResult.verified) {
      // Security/HR rule: clock-in is blocked unless the user is physically near the office.
      return res.status(403).json({
        message: `You must be within 2 km of office to clock in. Current distance: ${gpsResult.distanceKm.toFixed(2)} km`,
      });
    }
    // IP verification is best-effort and informational (geo lookup may fail); do not block on it.
    const ipResult = await verifyIP(ip);
    const locationVerified = gpsResult.verified;

    const latenessMinutes = getLatenessMinutes(req.user.workStartTime || '09:00');
    const status = latenessMinutes > 15 ? 'late' : 'on-time';

    const record = await AttendanceRecord.findOneAndUpdate(
      { userId: req.user._id, date },
      {
        $set: {
          clockIn: { time: new Date(), coords: { lat: latNum, lng: lngNum }, ip, ipCity: ipResult.city, ipCountry: ipResult.country },
          locationVerified,
          gpsVerified: gpsResult.verified,
          ipVerified: ipResult.verified,
          latenessMinutes,
          status,
        },
      },
      { upsert: true, new: true }
    );

    if (status === 'late') {
      await Notification.create({
        userId: req.user._id,
        message: `You clocked in ${latenessMinutes} minutes late today.`,
        type: 'late-alert',
      });
      const adminUsers = await User.find({ role: 'admin', isActive: true });
      adminUsers.forEach((a) => lateAlertEmail(a.email, req.user, latenessMinutes).catch(() => {}));
    }

    const io = req.app.get('io');
    if (io) {
      // Broadcast so dashboards can update in real time without polling.
      io.emit('attendance:clockIn', { userId: req.user._id, name: req.user.name, time: new Date() });
    }

    res.json({ record, locationVerified, gpsVerified: gpsResult.verified, latenessMinutes, status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const date = todayStr();
    const record = await AttendanceRecord.findOne({ userId: req.user._id, date });
    if (!record?.clockIn?.time) return res.status(400).json({ message: 'You have not clocked in yet' });
    if (record?.clockOut?.time) return res.status(400).json({ message: 'Already clocked out today' });

    const ip = getClientIP(req);
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime - record.clockIn.time) / 3600000;

    const [h, m] = (req.user.workStartTime || '09:00').split(':').map(Number);
    const expectedEndHours = h + 8;
    const expectedEnd = new Date();
    expectedEnd.setHours(expectedEndHours, m, 0, 0);
    if (clockOutTime < expectedEnd && record.status !== 'late') {
      record.status = 'early-leave';
    }

    record.clockOut = { time: clockOutTime, coords: lat ? { lat, lng } : undefined, ip };
    record.hoursWorked = parseFloat(hoursWorked.toFixed(2));
    await record.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:clockOut', { userId: req.user._id, name: req.user.name });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REST-style aliases
exports.createSession = async (req, res) => exports.clockIn(req, res);
exports.updateTodaySession = async (req, res) => exports.clockOut(req, res);

exports.getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      AttendanceRecord.find({ userId: req.user._id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      AttendanceRecord.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ records, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const record = await AttendanceRecord.findOne({ userId: req.user._id, date: todayStr() });
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLiveBoard = async (req, res) => {
  try {
    const today = todayStr();
    const records = await AttendanceRecord.find({
      date: today,
      'clockIn.time': { $exists: true },
      'clockOut.time': { $exists: false },
    }).populate('userId', 'name email department position avatar');

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminHistory = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    const records = await AttendanceRecord.find(filter)
      .sort({ date: -1 })
      .populate('userId', 'name department');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Returns chart-ready stats for the current employee's current month
exports.getMyStats = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    const records = await AttendanceRecord.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Daily hours for chart
    const dailyHours = records.map((r) => ({
      date: r.date,
      day: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      hours: r.hoursWorked || 0,
      status: r.status,
    }));

    // Status breakdown
    const breakdown = { 'on-time': 0, late: 0, 'early-leave': 0, absent: 0 };
    records.forEach((r) => { if (breakdown[r.status] !== undefined) breakdown[r.status]++; });

    // Weekly lateness (last 4 weeks)
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - (w + 1) * 7);
      const wEnd = new Date(now);
      wEnd.setDate(now.getDate() - w * 7);
      const wStartStr = wStart.toISOString().slice(0, 10);
      const wEndStr = wEnd.toISOString().slice(0, 10);
      const wRecords = records.filter((r) => r.date >= wStartStr && r.date < wEndStr);
      const totalLate = wRecords.reduce((s, r) => s + (r.latenessMinutes || 0), 0);
      weeks.push({
        week: `Week ${4 - w}`,
        latenessMinutes: totalLate,
        daysPresent: wRecords.length,
      });
    }

    res.json({ dailyHours, breakdown, weeklyTrend: weeks, totalRecords: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
