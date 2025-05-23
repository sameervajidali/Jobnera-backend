// src/models/Notification.js
import mongoose from 'mongoose';

// Define all valid notification types
const notificationTypes = [
  'userRegistered',
  'passwordResetRequested',
  'passwordResetCompleted',
  'quizAssigned',
  'quizGraded',
  'materialAssigned',
  'ticketReplied',
  'jobPosted',
  'applicationStatusChanged',
  'adminUserCreated',
  'roleChanged',
  'system',
  'message'
];

const notificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: notificationTypes, required: true },
  payload:   { type: mongoose.Schema.Types.Mixed },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', notificationSchema);
