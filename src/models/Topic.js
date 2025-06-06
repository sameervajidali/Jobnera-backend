import mongoose from 'mongoose';
import slugify from 'slugify';

const topicSchema = new mongoose.Schema({
  // Topic name (e.g., "OSI Model")
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: 100,
  },

  // Auto slug for frontend URLs (e.g., "osi-model")
  slug: {
    type: String,
    unique: true,
    trim: true
  },

  // Reference to parent category (e.g., Networking)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Topic must belong to a category'],
  },

  // Type scope: helps isolate quiz/tutorial/blog filtering
  type: {
    type: String,
    enum: ['quiz', 'blog', 'tutorial', 'resume', 'all'],
    default: 'all',
  },

  // Optional visual/icon for UI display
  icon: {
    type: String,
    default: '',
    trim: true,
  },

  // Hide/show in frontend
  isVisible: {
    type: Boolean,
    default: true,
  },

  // Manual ordering (used in sidebar, dropdowns, etc.)
  order: {
    type: Number,
    default: 0,
  },

  // Optional description for tooltips or SEO
  description: {
    type: String,
    default: '',
    trim: true,
  },

}, { timestamps: true });

// Generate slug before save if not present
topicSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Indexes
topicSchema.index({ slug: 1 });
topicSchema.index({ category: 1 });
topicSchema.index({ isVisible: 1 });

export default mongoose.model('Topic', topicSchema);
