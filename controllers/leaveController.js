const leaveManagementService = require('../services/leaveManagementService');

exports.createLeave = (req, res) => leaveManagementService.createLeave(req, res);
exports.getMyLeaves = (req, res) => leaveManagementService.getMyLeaves(req, res);
exports.getBalance = (req, res) => leaveManagementService.getBalance(req, res);
exports.getAllLeaves = (req, res) => leaveManagementService.getAllLeaves(req, res);
exports.approveLeave = (req, res) => leaveManagementService.approveLeave(req, res);
exports.rejectLeave = (req, res) => leaveManagementService.rejectLeave(req, res);
exports.reviewLeave = (req, res) => leaveManagementService.reviewLeave(req, res);
