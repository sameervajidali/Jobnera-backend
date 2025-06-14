// src/models/Category.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  slug: { type: String, unique: true, trim: true },
  description: { type: String, trim: true, default: '', maxlength: 1000 },
  type: { type: String, enum: ['quiz', 'blog', 'tutorial', 'resume', 'faq', 'all'], default: 'all' },
  icon: { type: String, trim: true, default: '', maxlength: 40 },
  isVisible: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, min: 0, max: 999 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Always keep slug in sync
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// 🚨 Cascade delete: Remove all topics (+ their subtopics/quizzes) on category delete
categorySchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  // Find all topics in this category
  const topics = await Topic.find({ category: doc._id });
  // For each topic, trigger its own cascade
  for (const topic of topics) {
    await topic.deleteOne();
  }
});


// Virtual stat: topic count
categorySchema.virtual('topicCount', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'category',
  count: true
});

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ type: 1 });
categorySchema.index({ isVisible: 1 });
categorySchema.index({ order: 1 });

export default mongoose.model('Category', categorySchema);
