import mongoose from 'mongoose';

const seoSchema = new mongoose.Schema({
  metaTitle:     { type: String, trim: true, maxlength: 80 },
  metaDesc:      { type: String, trim: true, maxlength: 180 },
  canonicalUrl:  { type: String, trim: true, default: '' },
  ogImage:       { type: String, trim: true, default: '' },
  robots:        { type: String, trim: true, default: '' },
  schemaJson:    mongoose.Schema.Types.Mixed,
}, { _id: false });

const blogPostSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true, maxlength: 180 },
  slug:         { type: String, required: true, unique: true, trim: true, lowercase: true },
  summary:      { type: String, trim: true, maxlength: 500, default: '' },
  content:      { type: mongoose.Schema.Types.Mixed, required: true }, // Rich JSON/HTML/MD as per editor
  status:       { type: String, enum: ['draft', 'review', 'scheduled', 'published', 'archived'], default: 'draft' },
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  editors:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category:     { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogTag' }],
  coverImageUrl:{ type: String, trim: true, default: '' },
  mediaAssets:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogMedia' }],
  seo:          { type: seoSchema },
  scheduledAt:  { type: Date },
  publishedAt:  { type: Date },
  viewCount:    { type: Number, default: 0 },
  likeCount:    { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  readingTime:  { type: Number }, // In minutes
  revisionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogRevision' }],
  customFields: { type: mongoose.Schema.Types.Mixed }, // For plugin/future use
}, { timestamps: true });

blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ publishedAt: -1 });

export default mongoose.model('BlogPost', blogPostSchema);
