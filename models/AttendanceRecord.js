const mongoose = require('mongoose');

const coordSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    clockIn: {
      time: Date,
      coords: coordSchema,
      ip: String,
      ipCity: String,
      ipCountry: String,
    },
    clockOut: {
      time: Date,
      coords: coordSchema,
      ip: String,
    },
    locationVerified: { type: Boolean, default: false },
    gpsVerified: { type: Boolean, default: false },
    ipVerified: { type: Boolean, default: false },
    hoursWorked: { type: Number, default: 0 },
    latenessMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['on-time', 'late', 'early-leave', 'absent'],
      default: 'on-time',
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceSchema);
