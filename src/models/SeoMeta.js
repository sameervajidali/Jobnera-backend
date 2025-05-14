import mongoose from 'mongoose';

const SeoMetaSchema = new mongoose.Schema({
  path: { type: String, required: true, unique: true }, // e.g. /jobs/frontend-dev-at-google
  title: String,
  description: String,
  keywords: [String],
  ogTitle: String,
  ogImage: String,
  twitterCard: String,
  robots: {
    index: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
  },
  jsonLd: String, // optional schema as JSON string
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('SeoMeta', SeoMetaSchema);
    