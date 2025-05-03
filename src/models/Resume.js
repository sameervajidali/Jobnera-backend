// src/models/Resume.js
import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    data: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup by user
resumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Resume', resumeSchema);
