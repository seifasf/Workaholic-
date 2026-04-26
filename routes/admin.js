const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/dashboard', protect, requireRole('admin'), getDashboard);
router.get('/users', protect, requireRole('admin'), getUsers);
router.post('/users', protect, requireRole('admin'), createUser);
router.patch('/users/:id', protect, requireRole('admin'), updateUser);
router.delete('/users/:id', protect, requireRole('admin'), deleteUser);

module.exports = router;
