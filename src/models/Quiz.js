// models/Quiz.js
import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Programming
  topic: { type: String, required: true }, // e.g. JavaScript
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert'],
    required: true,
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  duration: { type: Number, required: true }, // in minutes
  totalMarks: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);