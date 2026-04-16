const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { clearUserCache } = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// Public self-registration — always creates an employee account
exports.registerPublic = async (req, res) => {
  try {
    const { name, email, password, department, position, workStartTime } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role: 'employee',
      department: department || '',
      position: position || '',
      workStartTime: workStartTime || '09:00',
    });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin-only registration — can set any role
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, position, workStartTime } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, department, position, workStartTime });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, department, position, workStartTime } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, department, position, workStartTime },
      { new: true }
    );
    clearUserCache(req.user._id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    // Convert buffer to base64 data URL — no external service needed
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: dataUrl },
      { new: true }
    );
    clearUserCache(req.user._id);
    res.json({ avatar: user.avatar, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
