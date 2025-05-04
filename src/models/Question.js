// models/Question.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  topicTag: { type: String }, // e.g. Arrays, Promises
  explanation: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);