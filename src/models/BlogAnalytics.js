import mongoose from 'mongoose';

const referrerStatsSchema = new mongoose.Schema({
  source: { type: String, trim: true },
  count:  { type: Number, default: 0 },
}, { _id: false });

const blogAnalyticsSchema = new mongoose.Schema({
  post:           { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  date:           { type: Date, required: true },
  views:          { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  avgTimeOnPage:  { type: Number, default: 0 },
  shares:         { type: Number, default: 0 },
  referrerStats:  [referrerStatsSchema],
}, { timestamps: true });

blogAnalyticsSchema.index({ post: 1, date: -1 });

export default mongoose.model('BlogAnalytics', blogAnalyticsSchema);
