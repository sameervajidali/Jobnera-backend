import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  // Category name (unique)
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // Optional description of the category
  description: {
    type: String,
    default: '',
    trim: true,
  },
  // Category usage type: quiz, blog, or both
  type: {
    type: String,
    enum: ['quiz', 'blog', 'both'],
    default: 'both', // Default means category is usable in quizzes and blogs
  },
}, { timestamps: true }); // createdAt and updatedAt timestamps

export default mongoose.model('Category', categorySchema);
