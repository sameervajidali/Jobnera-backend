import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft', index: true },
  content: { type: String, required: true }, // HTML content
  excerpt: { type: String },
  featuredImage: { type: String }, // URL or path
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  publishedAt: { type: Date, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

// Auto-generate slug before save, ensuring uniqueness
blogSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    // Check for existing slugs and append suffix if needed
    while (await mongoose.models.Blog.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
  next();
});

export default mongoose.model('Blog', blogSchema);
