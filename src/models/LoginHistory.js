// src/models/LoginHistory.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const LoginHistorySchema = new Schema({
  user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ip:         { type: String },
  userAgent:  { type: String },
  success:    { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'at' /* rename createdAt → at */, updatedAt: false }
});

export default model('LoginHistory', LoginHistorySchema);
