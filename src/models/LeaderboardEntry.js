// models/LeaderboardEntry.js
import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  topic: { type: String },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'] },
  score: { type: Number, required: true },
  attempts: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now },
  timePeriod: { type: String, enum: ['week', 'month', 'all-time'], default: 'all-time' },
}, { timestamps: true });

leaderboardEntrySchema.index({ category: 1, topic: 1, score: -1 }); // 🔍 Fast lookup

export default mongoose.model('LeaderboardEntry', leaderboardEntrySchema);