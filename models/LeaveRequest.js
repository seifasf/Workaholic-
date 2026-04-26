const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['vacation', 'sick', 'emergency', 'other'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysRequested: { type: Number, required: true },
    reason: { type: String, default: '' },
    // Proof is stored inline in MongoDB (base64) to avoid external dependencies (e.g., Cloudinary).
    // Keep files small; MongoDB has a 16MB document limit.
    proof: {
      data: { type: String, default: '' }, // base64 (no data: prefix)
      mimeType: { type: String, default: '' },
      originalName: { type: String, default: '' }
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminComment: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveSchema);
