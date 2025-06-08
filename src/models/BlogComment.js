import mongoose from 'mongoose';

const blogCommentSchema = new mongoose.Schema({
  post:          { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // or null for guest
  content:       { type: String, required: true, trim: true },
  status:        { type: String, enum: ['pending', 'approved', 'flagged'], default: 'approved' },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogComment', default: null }, // For threaded replies
  replies:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogComment' }],
  likeCount:     { type: Number, default: 0 },
}, { timestamps: true });

blogCommentSchema.index({ post: 1 });
blogCommentSchema.index({ status: 1 });
blogCommentSchema.index({ parentComment: 1 });

export default mongoose.model('BlogComment', blogCommentSchema);
