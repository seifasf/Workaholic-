const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const KPIScore = require('../models/KPIScore');
const User = require('../models/User');

const WEIGHTS = {
  punctuality: 0.4,
  attendance: 0.4,
  leaveDeduction: 0.2,
};

const getWorkingDays = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};

const computeKPIForUser = async (userId, month, year) => {
  const workingDays = getWorkingDays(year, month);
  const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

  const records = await AttendanceRecord.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  });

  const daysPresent = records.length;
  const daysAbsent = workingDays - daysPresent;
  const totalLatenessMinutes = records.reduce((sum, r) => sum + (r.latenessMinutes || 0), 0);

  const allowedLateMinutesPerMonth = 120;
  const lateRatio = Math.min(totalLatenessMinutes / allowedLateMinutesPerMonth, 1);
  const punctualityScore = Math.max(0, 100 * (1 - lateRatio));

  const attendanceScore = workingDays > 0 ? (daysPresent / workingDays) * 100 : 0;

  const leaves = await LeaveRequest.find({
    userId,
    status: 'approved',
    startDate: { $gte: new Date(year, month - 1, 1) },
    endDate: { $lte: new Date(year, month, 0) },
  });
  const leaveDays = leaves.reduce((sum, l) => sum + (l.daysRequested || 0), 0);
  const leaveDeductionScore = Math.max(0, 100 - leaveDays * 5);

  const totalScore =
    punctualityScore * WEIGHTS.punctuality +
    attendanceScore * WEIGHTS.attendance +
    leaveDeductionScore * WEIGHTS.leaveDeduction;

  return KPIScore.findOneAndUpdate(
    { userId, month, year },
    {
      punctualityScore: Math.round(punctualityScore),
      attendanceScore: Math.round(attendanceScore),
      leaveDeductionScore: Math.round(leaveDeductionScore),
      totalScore: Math.round(totalScore),
      daysPresent,
      daysAbsent,
      totalLatenessMinutes,
      workingDays,
    },
    { upsert: true, new: true }
  );
};

const computeAllKPIs = async (month, year) => {
  const users = await User.find({ role: 'employee', isActive: true });
  const results = await Promise.all(users.map((u) => computeKPIForUser(u._id, month, year)));
  for (const kpi of results) {
    await User.findByIdAndUpdate(kpi.userId, { kpiScore: kpi.totalScore });
  }
  return results;
};

module.exports = { computeKPIForUser, computeAllKPIs };
