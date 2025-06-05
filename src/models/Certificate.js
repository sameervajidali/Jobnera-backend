import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const CertificateSchema = new Schema({
  // Reference to the user owning the certificate
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Indexed for fast user-based queries
  },
  // Title of the certificate
  title: {
    type: String,
    required: true,
    trim: true,
  },
  // Issuer of the certificate, default to JobNeura
  issuer: {
    type: String,
    default: 'JobNeura',
    trim: true,
  },
  // Date the certificate was issued
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Optional expiration date of the certificate
  expirationDate: {
    type: Date,
  },
  // Score or grade achieved on the certificate, optional
  score: {
    type: Number,
    default: null,
  },
  // URL to badge or certificate image
  badgeUrl: {
    type: String,
    trim: true,
    default: '',
  },
  // Optional description or notes about the certificate
  description: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true, // createdAt and updatedAt timestamps
});

// Compound index to fetch certificates by user sorted by issue date descending
CertificateSchema.index({ user: 1, issueDate: -1 });

export default model('Certificate', CertificateSchema);
