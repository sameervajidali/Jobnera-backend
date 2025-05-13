// src/models/LearningMaterial.js
import mongoose from 'mongoose';

const learningMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
    default: '',
  },

  // e.g. 'video', 'article', 'pdf'
  type: {
    type: String,
    required: true,
    enum: ['video', 'article', 'pdf', 'other'],
  },

  // either a remote URL or local file path
  url: {
    type: String,
    required: true,
  },

  // the user this material is assigned to
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // who assigned it (admin/creator)
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // when it was assigned (defaults to now)
  assignedAt: {
    type: Date,
    default: () => new Date(),
  },

}, {
  timestamps: true,   // adds createdAt & updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index so we can quickly list per-user materials
learningMaterialSchema.index({ assignedTo: 1, assignedAt: -1 });

export default mongoose.model('LearningMaterial', learningMaterialSchema);
