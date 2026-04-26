const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'Marked all as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REST-style alias for bulk update
exports.updateNotifications = async (req, res) => {
  try {
    const { read, scope } = req.body || {};
    if (read !== true || scope !== 'all') {
      return res.status(400).json({ message: "Use body: { read: true, scope: 'all' }" });
    }
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return res.json({ message: 'Marked all as read' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
