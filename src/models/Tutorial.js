import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
}, { _id: false });

const TutorialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: '' }, // sanitized HTML or markdown
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorialCategory', required: true, index: true },
  videoUrl: { type: String, default: '' }, // validated URL format on input
  attachments: [AttachmentSchema], // array of files attached

  order: { type: Number, default: 0, index: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },

  seo: {
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    metaKeywords: [{ type: String }],
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
},
{ timestamps: true });

// Indexes for optimized queries
TutorialSchema.index({ title: 'text', 'seo.metaTitle': 'text' });

export default mongoose.model('Tutorial', TutorialSchema);
