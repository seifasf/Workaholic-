const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-process cache: userId → { user, cachedAt }
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const protect = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null;

    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check in-process cache first to avoid a DB round-trip on every request
    const cached = userCache.get(decoded.id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      req.user = cached.user;
      return next();
    }

    // Cache miss — fetch from DB and store
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    userCache.set(decoded.id, { user, cachedAt: Date.now() });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// Clear cache when profile/avatar is updated so stale data isn't served
const clearUserCache = (userId) => {
  userCache.delete(String(userId));
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient role' });
  }
  next();
};

module.exports = { protect, requireRole, clearUserCache };
