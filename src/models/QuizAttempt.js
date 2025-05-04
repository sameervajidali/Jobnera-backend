// models/QuizAttempt.js
import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedIndex: Number,
      isCorrect: Boolean
    }
  ],
  timeTaken: { type: Number }, // seconds
  submittedAt: { type: Date, default: Date.now },
  rankSnapshot: { type: Number },
  weakTopics: [String]
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
