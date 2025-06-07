// src/models/Topic.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, unique: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  type: { type: String, enum: ['quiz', 'blog', 'tutorial', 'resume', 'all'], default: 'all' },
  icon: { type: String, default: '', trim: true, maxlength: 40 },
  isVisible: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, min: 0, max: 999 },
  description: { type: String, default: '', trim: true, maxlength: 1000 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

topicSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Cascade delete: when deleting a topic, delete all subtopics & quizzes under it
topicSchema.pre('findOneAndDelete', async function(next) {
  const topic = await this.model.findOne(this.getFilter());
  if (topic) {
    const SubTopic = mongoose.model('SubTopic');
    const Quiz = mongoose.model('Quiz');
    await SubTopic.deleteMany({ topic: topic._id });
    await Quiz.deleteMany({ topic: topic._id });
  }
  next();
});

// Virtual stat: subtopic count
topicSchema.virtual('subTopicCount', {
  ref: 'SubTopic',
  localField: '_id',
  foreignField: 'topic',
  count: true
});
topicSchema.virtual('quizCount', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'topic',
  count: true
});

topicSchema.index({ slug: 1 }, { unique: true });
topicSchema.index({ category: 1, isVisible: 1, order: 1 });
topicSchema.index({ type: 1 });

export default mongoose.model('Topic', topicSchema);
