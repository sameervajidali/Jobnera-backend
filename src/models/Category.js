// // src/models/Category.js
// import mongoose from 'mongoose';

// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   description: {
//     type: String,
//     default: '',
//     trim: true,
//   },
// }, { timestamps: true });

// export default mongoose.model('Category', categorySchema);


import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    enum: ['quiz', 'blog', 'both'],
    default: 'both', // default means usable in quizzes and blogs
  },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
