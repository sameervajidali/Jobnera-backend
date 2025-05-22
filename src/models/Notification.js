// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['quizAssigned','message','system'], required: true },
  payload:     { type: mongoose.Schema.Types.Mixed },  // e.g. { quizId, title }
  isRead:      { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

export default mongoose.model('Notification', notificationSchema);
