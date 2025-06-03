// src/models/Blog.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  content: { type: String, required: true },
  excerpt: { type: String },
  featuredImage: { type: String },
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  publishedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Blog', blogSchema);
