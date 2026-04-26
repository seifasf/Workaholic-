const User = require('../models/User');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const KPIScore = require('../models/KPIScore');

const todayStr = () => new Date().toISOString().slice(0, 10);

const getDashboard = async (req, res) => {
  try {
    const today = todayStr();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [
      totalEmployees,
      todayRecords,
      pendingLeaves,
      teamKPIs,
      recentLeaves,
    ] = await Promise.all([
      User.countDocuments({ role: 'emp', isActive: true }),
      AttendanceRecord.find({ date: today })
        .populate('userId', 'name department avatar position'),
      LeaveRequest.countDocuments({ status: 'pending' }),
      KPIScore.find({ month, year })
        .populate('userId', 'name department avatar kpiScore'),
      LeaveRequest.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name department avatar'),
    ]);

    // Derive counts from today's records
    const liveCount = todayRecords.filter(
      (r) => r.clockIn?.time && !r.clockOut?.time
    ).length;
    const lateToday = todayRecords.filter((r) => r.status === 'late').length;
    const onTimeToday = todayRecords.filter((r) => r.status === 'on-time').length;
    const clockedOutToday = todayRecords.filter((r) => r.clockOut?.time).length;
    const absentToday = Math.max(0, totalEmployees - todayRecords.length);

    // Late employee details
    const lateEmployees = todayRecords
      .filter((r) => r.status === 'late')
      .map((r) => ({
        name: r.userId?.name,
        department: r.userId?.department,
        avatar: r.userId?.avatar,
        latenessMinutes: r.latenessMinutes,
        clockInTime: r.clockIn?.time,
      }));

    // Today's breakdown for donut chart
    const todayBreakdown = {
      'On Time': onTimeToday,
      Late: lateToday,
      'Clocked Out': clockedOutToday,
      Absent: absentToday,
    };

    const avgKPI =
      teamKPIs.length > 0
        ? Math.round(teamKPIs.reduce((sum, k) => sum + k.totalScore, 0) / teamKPIs.length)
        : 0;

    return res.json({
      totalEmployees,
      liveCount,
      lateToday,
      onTimeToday,
      absentToday,
      pendingLeaves,
      avgKPI,
      teamKPIs,
      lateEmployees,
      recentLeaves,
      todayBreakdown,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, position, workStartTime } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role, department, position, workStartTime });
    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, department, position, workStartTime, vacationBalance, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, department, position, workStartTime, vacationBalance, isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.json({ message: 'User deactivated' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
