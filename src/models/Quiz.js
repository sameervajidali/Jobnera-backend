// src/models/Quiz.js
import mongoose from 'mongoose';
import './SubTopic.js';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
  subTopic: { type: mongoose.Schema.Types.ObjectId, ref: "SubTopic", required: false, index: true },
  level: { type: String, enum: ["Beginner", "Intermediate", "Expert"], required: true, index: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  duration: { type: Number, required: true, min: 1, max: 600 },
  totalMarks: { type: Number, required: true, min: 1 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Cascade delete: on quiz deletion, delete all related questions and user attempts
quizSchema.pre('findOneAndDelete', async function(next) {
  const quiz = await this.model.findOne(this.getFilter());
  if (quiz) {
    await mongoose.model('Question').deleteMany({ quiz: quiz._id });
    // Optionally delete attempts/results/history:
    // await mongoose.model('QuizAttempt').deleteMany({ quiz: quiz._id });
  }
  next();
});

quizSchema.index({ category: 1, topic: 1, subTopic: 1, level: 1, isActive: 1 });

export default mongoose.model("Quiz", quizSchema);
