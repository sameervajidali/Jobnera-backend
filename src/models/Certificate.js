// src/models/Certificate.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const CertificateSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  issuer: {
    type: String,
    default: 'JobNeura',
    trim: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expirationDate: {
    type: Date // optional
  },
  score: {
    type: Number,
    default: null
  },
  badgeUrl: {
    type: String, // URL to certificate image/badge
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// If you want to fetch a user's certificates in order:
CertificateSchema.index({ user: 1, issueDate: -1 });

export default model('Certificate', CertificateSchema);
