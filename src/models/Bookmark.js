// src/models/Bookmark.js
import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
}, { timestamps: true });

bookmarkSchema.index({ user: 1, quiz: 1 }, { unique: true });

export default mongoose.model('Bookmark', bookmarkSchema);
