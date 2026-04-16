const mongoose = require('mongoose');

const kpiSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    punctualityScore: { type: Number, default: 0 },
    attendanceScore: { type: Number, default: 0 },
    leaveDeductionScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    daysPresent: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    totalLatenessMinutes: { type: Number, default: 0 },
    workingDays: { type: Number, default: 22 },
  },
  { timestamps: true }
);

kpiSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('KPIScore', kpiSchema);
