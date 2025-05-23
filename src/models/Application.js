// src/models/Application.js
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['Applied', 'Reviewed', 'InterviewScheduled', 'Offered', 'Rejected'],
    default: 'Applied',
    required: true,
    index: true,
  },
  resumeUrl: {
    type: String,
    default: null,
  },
  coverLetter: {
    type: String,
    default: null,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' }
});

// Compound index to prevent duplicate applications
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
