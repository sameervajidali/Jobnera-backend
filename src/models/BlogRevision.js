import mongoose from 'mongoose';

const blogRevisionSchema = new mongoose.Schema({
  post:          { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  editor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:       { type: mongoose.Schema.Types.Mixed, required: true },
  changeSummary: { type: String, trim: true, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } });

blogRevisionSchema.index({ post: 1 });

export default mongoose.model('BlogRevision', blogRevisionSchema);
