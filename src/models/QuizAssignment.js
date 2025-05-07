import mongoose from 'mongoose';

const quizAssignmentSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// prevent duplicate assignments
quizAssignmentSchema.index({ quiz: 1, user: 1 }, { unique: true });

export default mongoose.model('QuizAssignment', quizAssignmentSchema);