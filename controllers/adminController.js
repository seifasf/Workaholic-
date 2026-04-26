const adminControlAlertsService = require('../services/adminControlAlertsService');

exports.getDashboard = (req, res) => adminControlAlertsService.getDashboard(req, res);
exports.getUsers = (req, res) => adminControlAlertsService.getUsers(req, res);
exports.createUser = (req, res) => adminControlAlertsService.createUser(req, res);
exports.updateUser = (req, res) => adminControlAlertsService.updateUser(req, res);
exports.deleteUser = (req, res) => adminControlAlertsService.deleteUser(req, res);
