// src/models/LoginHistory.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const LoginHistorySchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ip:        { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  country:    { type: String },
  region:     { type: String },
  city:       { type: String },
}, {
  timestamps: { createdAt: 'at', updatedAt: false }
});

// Prevent model overwrite errors in development/hot reload
const LoginHistory = mongoose.models.LoginHistory || model('LoginHistory', LoginHistorySchema);
export default LoginHistory;
