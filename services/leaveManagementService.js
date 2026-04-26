const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { leaveApprovedEmail, leaveRejectedEmail } = require('./emailService');

const calcDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
};

const createLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const daysRequested = calcDays(startDate, endDate);

    if (req.user.vacationBalance < daysRequested && type === 'vacation') {
      return res.status(400).json({ message: 'Insufficient vacation balance' });
    }

    const leave = await LeaveRequest.create({
      userId: req.user._id,
      type,
      startDate,
      endDate,
      daysRequested,
      reason,
      proof: req.file
        ? {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype,
            originalName: req.file.originalname || '',
          }
        : undefined,
    });

    const hrUsers = await User.find({ role: { $in: ['hr', 'admin'] }, isActive: true });
    await Notification.insertMany(
      hrUsers.map((hr) => ({
        userId: hr._id,
        message: `${req.user.name} submitted a ${type} leave request for ${daysRequested} day(s).`,
        type: 'general',
      }))
    );

    return res.status(201).json(leave);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(leaves);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getBalance = async (req, res) => {
  return res.json({ vacationBalance: req.user.vacationBalance });
};

const getAllLeaves = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const leaves = await LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email department');
    return res.json(leaves);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const reviewLeaveWithStatus = async (req, res, nextStatus) => {
  const leave = await LeaveRequest.findById(req.params.id).populate('userId');
  if (!leave) return res.status(404).json({ message: 'Leave not found' });
  if (leave.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

  const { adminComment } = req.body;
  leave.status = nextStatus;
  leave.adminComment = adminComment || '';
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  if (nextStatus === 'approved' && leave.userId.vacationBalance >= leave.daysRequested) {
    await User.findByIdAndUpdate(leave.userId._id, {
      $inc: { vacationBalance: -leave.daysRequested },
    });
  }

  const message = nextStatus === 'approved'
    ? `Your ${leave.type} leave request has been approved.`
    : `Your ${leave.type} leave request has been rejected. ${adminComment || ''}`;
  const type = nextStatus === 'approved' ? 'leave-approved' : 'leave-rejected';
  await Notification.create({
    userId: leave.userId._id,
    message,
    type,
  });

  if (nextStatus === 'approved') leaveApprovedEmail(leave.userId, leave).catch(() => {});
  else leaveRejectedEmail(leave.userId, leave).catch(() => {});

  return res.json(leave);
};

const approveLeave = async (req, res) => {
  try {
    return await reviewLeaveWithStatus(req, res, 'approved');
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const rejectLeave = async (req, res) => {
  try {
    return await reviewLeaveWithStatus(req, res, 'rejected');
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const reviewLeave = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    }
    return await reviewLeaveWithStatus(req, res, status);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createLeave,
  getMyLeaves,
  getBalance,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  reviewLeave,
};
