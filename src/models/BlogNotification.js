import mongoose from 'mongoose';

const blogNotificationSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  post:   { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' },
  type:   { type: String, enum: ['comment', 'like', 'publish', 'reply'], required: true },
  status: { type: String, enum: ['sent', 'read'], default: 'sent' },
}, { timestamps: true });

blogNotificationSchema.index({ user: 1, status: 1 });

export default mongoose.model('BlogNotification', blogNotificationSchema);
