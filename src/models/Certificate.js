// models/Certificate.js
import mongoose from 'mongoose';

const SignerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  signatureText: { type: String, trim: true }, // For "handwritten" look
}, { _id: false });

const CertificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: String, // <- user's name
  title: { type: String, required: true, trim: true },
  issuer: { type: String, default: 'JobNeura', trim: true },
  certificateId: { type: String, unique: true, required: true }, // public-facing
  location: { type: String, trim: true, default: '' },
  issueDate: { type: Date, required: true, default: Date.now },
   issued: String,
  expirationDate: { type: Date },
  score: { type: Number, default: null },
  badgeUrl: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  signers: [SignerSchema],
}, { timestamps: true });

CertificateSchema.index({ user: 1, issueDate: -1 });
export default mongoose.model('Certificate', CertificateSchema);
