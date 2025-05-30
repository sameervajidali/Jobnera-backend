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

quizAssignmentSchema.plugin(notificationPlugin, {
  events: [{
    on: 'insert',
    event: 'quizAssigned',
    payload: doc => ({
      userId: doc.userId,
      quizId: doc.quizId,
      title:  'A new quiz has been assigned'
    })
  }]
});

// prevent duplicate assignments
quizAssignmentSchema.index({ quiz: 1, user: 1 }, { unique: true });

export default mongoose.model('QuizAssignment', quizAssignmentSchema);