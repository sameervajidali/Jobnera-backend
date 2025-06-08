import mongoose from 'mongoose';

const SignerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  signatureText: { type: String, trim: true },
}, { _id: false });

const CertificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: String, trim: true }, // User's name
  title: { type: String, required: true, trim: true }, // Quiz or award name
  issuer: { type: String, default: 'JobNeura', trim: true },
  certificateId: { type: String, unique: true, required: true }, // public-facing
  issued: { type: String, trim: true, default: '' }, // Location
  issueDate: { type: Date, required: true, default: Date.now },
  expirationDate: { type: Date },
  score: { type: Number, default: null },
  badgeUrl: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  signers: [SignerSchema],
}, { timestamps: true });

CertificateSchema.index({ user: 1, issueDate: -1 });

CertificateSchema.virtual('quizName').get(function () {
  return this.title;
});
CertificateSchema.set('toJSON', { virtuals: true });
CertificateSchema.set('toObject', { virtuals: true });

export default mongoose.model('Certificate', CertificateSchema);
