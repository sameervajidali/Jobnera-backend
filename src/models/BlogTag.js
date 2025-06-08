import mongoose from 'mongoose';

const blogTagSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true, maxlength: 48 },
  slug:        { type: String, unique: true, trim: true, lowercase: true },
  description: { type: String, trim: true, default: '', maxlength: 512 },
  color:       { type: String, trim: true, default: '' }, // For UI tag badge
}, { timestamps: true });

blogTagSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model('BlogTag', blogTagSchema);
