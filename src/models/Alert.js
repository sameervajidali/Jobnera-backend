import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  dauThreshold: { type: Number, required: true, default: 0 },  // Daily Active User threshold
  sendEmail: { type: Boolean, required: true, default: false }, // Whether to send email notifications
  isActive: { type: Boolean, default: true },                   // Alert enabled or disabled
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update `updatedAt` on save
alertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
