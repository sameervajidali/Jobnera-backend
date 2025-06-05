import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  // Reference to the user who attempted the quiz
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Reference to the quiz attempted
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },

  // Score obtained by the user
  score: { type: Number, required: true },

  // Total number of questions in the quiz
  totalQuestions: { type: Number, required: true },

  // Number of correctly answered questions
  correctAnswers: { type: Number, required: true },

  // Array of answers with question reference, selected option index, and correctness
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedIndex: Number,
      isCorrect: Boolean
    }
  ],

  // Time taken to complete the quiz in seconds
  timeTaken: { type: Number },

  // Timestamp when the quiz was submitted (default to now)
  submittedAt: { type: Date, default: Date.now },

  // Optional: rank of the user at the time of attempt
  rankSnapshot: { type: Number },

  // Array of topic names identified as weak areas for the user in this attempt
  weakTopics: [String]
}, { timestamps: true }); // also adds createdAt and updatedAt

export default mongoose.model('QuizAttempt', quizAttemptSchema);
