import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  // Question text content
  text: { type: String, required: true },

  // Array of answer options (at least one required)
  options: [{ type: String, required: true }],

  // Index of the correct answer in the options array
  correctIndex: { type: Number, required: true },

  // Topic tag for categorization (e.g., Arrays, Promises)
  topicTag: { type: String },

  // Optional explanation or rationale for the correct answer
  explanation: { type: String },

  // Difficulty level, default is 'medium'
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

  // Reference back to the quiz this question belongs to (optional)
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
}, { timestamps: true }); // adds createdAt and updatedAt automatically

export default mongoose.model('Question', questionSchema);
