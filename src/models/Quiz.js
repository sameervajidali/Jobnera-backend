import mongoose from 'mongoose';
import './SubTopic.js'; 

const quizSchema = new mongoose.Schema(
  {
    // Quiz title
    title: { type: String, required: true },

    // Reference to Category document (must exist)
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category",
      required: true 
    },

    // Reference to Topic document (must exist)
    topic: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Topic",
      required: true 
    },
    // Reference to SubTopic document (NEW!)
    subTopic: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "SubTopic",
      required: true // (or false, if not strictly required)
    },


    // Difficulty level enum
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: true,
    },

    // Array of question references
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    // Duration of the quiz in minutes (or seconds, clarify usage)
    duration: { type: Number, required: true },

    // Total marks for the quiz
    totalMarks: { type: Number, required: true },

    // Is the quiz currently active
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt and updatedAt managed automatically
  }
);

export default mongoose.model("Quiz", quizSchema);
