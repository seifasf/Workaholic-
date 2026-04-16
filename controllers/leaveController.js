const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { leaveApprovedEmail, leaveRejectedEmail } = require('../services/emailService');
const { cloudinary } = require('../config/cloudinary');

const calcDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
};

exports.createLeave = async (req, res) => {
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
      proofUrl: req.file?.path || '',
      proofPublicId: req.file?.filename || '',
    });

    const hrUsers = await User.find({ role: { $in: ['hr', 'admin'] }, isActive: true });
    await Notification.insertMany(
      hrUsers.map((hr) => ({
        userId: hr._id,
        message: `${req.user.name} submitted a ${type} leave request for ${daysRequested} day(s).`,
        type: 'general',
      }))
    );

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBalance = async (req, res) => {
  res.json({ vacationBalance: req.user.vacationBalance });
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const leaves = await LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email department');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('userId');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    const { adminComment } = req.body;
    leave.status = 'approved';
    leave.adminComment = adminComment || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    if (leave.userId.vacationBalance >= leave.daysRequested) {
      await User.findByIdAndUpdate(leave.userId._id, {
        $inc: { vacationBalance: -leave.daysRequested },
      });
    }

    await Notification.create({
      userId: leave.userId._id,
      message: `Your ${leave.type} leave request has been approved.`,
      type: 'leave-approved',
    });

    leaveApprovedEmail(leave.userId, leave).catch(() => {});
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('userId');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    const { adminComment } = req.body;
    leave.status = 'rejected';
    leave.adminComment = adminComment || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    await Notification.create({
      userId: leave.userId._id,
      message: `Your ${leave.type} leave request has been rejected. ${adminComment || ''}`,
      type: 'leave-rejected',
    });

    leaveRejectedEmail(leave.userId, leave).catch(() => {});
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
