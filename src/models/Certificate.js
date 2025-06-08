// models/Certificate.js

import mongoose from "mongoose";

// -- Signature block (for future digital sign, QR, etc)
const SignerSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    title:     { type: String, required: true, trim: true },
    signatureText: { type: String, trim: true }, // e.g. handwriting font string, base64, or svg url
    signatureImg:  { type: String, trim: true }, // optional: URL to image or digital signature
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient:   { type: String, trim: true, required: true },    // Person's display name (required for printing)
    title:       { type: String, required: true, trim: true },    // E.g. "Key ML Algorithms"
    issuer:      { type: String, trim: true, default: "JobNeura" }, // Organization
    certificateId: { type: String, unique: true, required: true },  // Public-facing, e.g. JN-QUIZ-20250608-0001
    issued:      { type: String, trim: true, default: "" }, // e.g. "Lucknow, India"
    issueDate:   { type: Date, required: true, default: Date.now },
    expirationDate: { type: Date },

    // Achievement/result stats (robust, for all certs)
    score:         { type: Number, min: 0 }, // e.g. percentage (100 for 100%)
    rawScore:      { type: Number, min: 0 }, // e.g. 5 (out of 5)
    totalQuestions:{ type: Number, min: 1 }, // e.g. 5
    badgeUrl:      { type: String, trim: true, default: "" }, // optional
    description:   { type: String, trim: true, default: "" }, // e.g. "Awarded for..."
    quiz:          { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }, // optional
    signers:       [SignerSchema],

    // For analytics/future integrations
    downloaded:    { type: Number, default: 0 },
    lastViewedAt:  { type: Date },
    auditLog: [
      {
        date:    { type: Date, default: Date.now },
        action:  { type: String },
        details: { type: String },
        by:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      }
    ],
    // Any extra metadata
    meta:          { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Virtuals for robust UI display

CertificateSchema.virtual("percentage").get(function () {
  if (typeof this.rawScore === "number" && typeof this.totalQuestions === "number" && this.totalQuestions > 0)
    return Math.round((this.rawScore / this.totalQuestions) * 100);
  if (typeof this.score === "number") return this.score;
  return null;
});

CertificateSchema.virtual("quizName").get(function () {
  return this.title;
});

// -- Indexes for efficient lookups
CertificateSchema.index({ user: 1, issueDate: -1 });
CertificateSchema.index({ certificateId: 1 }, { unique: true });

export default mongoose.model("Certificate", CertificateSchema);
