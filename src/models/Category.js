import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  // Category name (unique, required)
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: 100
  },

  // Auto-generated slug (e.g., "web-development")
  slug: {
    type: String,
    unique: true,
    trim: true
  },

  // Optional description
  description: {
    type: String,
    default: '',
    trim: true
  },

  // Category type: used to separate module ownership
  type: {
    type: String,
    enum: ['quiz', 'blog', 'tutorial', 'resume', 'faq', 'all'],
    default: 'all'
  },

  // Optional icon class or keyword (for admin UI)
  icon: {
    type: String,
    trim: true,
    default: '' // e.g., "BookOpen", "Code"
  },

  // Show/hide from public
  isVisible: {
    type: Boolean,
    default: true
  },

  // Optional order for display sorting
  order: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// Generate slug before save if not present
categorySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Indexes for speed
categorySchema.index({ slug: 1 });
categorySchema.index({ type: 1 });
categorySchema.index({ isVisible: 1 });

export default mongoose.model('Category', categorySchema);
