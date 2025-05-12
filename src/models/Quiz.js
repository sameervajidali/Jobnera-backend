// models/Quiz.js
import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    // ↓ instead of String:
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category",
      required: true 
    },
    topic: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Topic",
      required: true 
    },

    level: {
      type: String,
      enum: ["Beginner","Intermediate","Expert"],
      required: true,
    },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    duration:   { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
