// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import notificationPlugin from '../plugins/notificationPlugin.js';

const { Schema, model } = mongoose;

// Sub-schemas for repeatable fields
const ExperienceSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  company:     { type: String, required: true, trim: true },
  from:        { type: Date,   required: true },
  to:          { type: Date },
  description: { type: String, trim: true },
}, { _id: false });

const EducationSchema = new Schema({
  institution: { type: String, required: true, trim: true },
  degree:      { type: String, trim: true },
  from:        { type: Date,   required: true },
  to:          { type: Date },
  description: { type: String, trim: true },
}, { _id: false });

// Main User schema
const userSchema = new Schema({
  // ─ Authentication ───────────────────────────────────────────────
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password:        { type: String, minlength: 6, select: false },
  provider:        { type: String, enum: ['local','google','facebook','github'], default: 'local' },
  providerId:      { type: String, select: false },

  // ─ Profile Fields ────────────────────────────────────────────────
  phone:           { type: String, default: '', trim: true },
  location:        { type: String, default: '', trim: true },
  bio:             { type: String, default: '', trim: true },
  website:         { type: String, default: '', trim: true },
  linkedin:        { type: String, default: '', trim: true },
  avatar:          { type: String, default: '' },   // URL to avatar
  resume:          { type: String, default: '' },   // URL to resume PDF
  skills:          { type: [String], default: [] },
  languages:       { type: [String], default: [] },
  experience:      { type: [ExperienceSchema], default: [] },
  education:       { type: [EducationSchema], default: [] },

  // ─ Email Verification & Password Reset ───────────────────────────
  isVerified:           { type: Boolean, default: false },
  activationToken:      { type: String, select: false },
  activationTokenExpiry:{ type: Date,   select: false },
  resetToken:           { type: String, select: false },
  resetTokenExpiry:     { type: Date,   select: false },

  // ─ Refresh Tokens for Revocation ─────────────────────────────────
  refreshTokens: [
    {
      token:     { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      ip:        String,
      userAgent: String,
    }
  ],

  // ─ Roles & Brute-Force Protection ────────────────────────────────
  role:                 { type: Schema.Types.ObjectId, ref: 'Role', required: true, default: null },
  loginAttempts:        { type: Number, default: 0, select: false },
  lockUntil:            { type: Date, select: false },
  lastLogin:            { type: Date },
}, {
  timestamps: true,
});

// Virtual to check lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Hash Password ────────────────────────────────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Compare Helper ───────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ─── Auto-notifications via plugin ────────────────────────────────────────────
userSchema.plugin(notificationPlugin, {
  events: [
    // New user sign-up
    {
      on: 'insert',
      event: 'userRegistered',
      payload: doc => ({ userId: doc._id })
    },
    // Admin created a new user (role is ADMIN or SUPERADMIN)
    {
      on: 'insert',
      event: 'adminUserCreated',
      match: doc => ['ADMIN','SUPERADMIN'].includes(String(doc.role)),
      payload: doc => ({ userId: doc._id })
    },
    // Password reset requested (resetToken set)
    {
      on: 'update',
      event: 'passwordResetRequested',
      match: (_doc, update) => Boolean(update.$set?.resetToken),
      payload: doc => ({ userId: doc._id })
    },
    // Password actually changed
    {
      on: 'update',
      event: 'passwordResetCompleted',
      match: (_doc, update) => Boolean(update.$set?.password),
      payload: doc => ({ userId: doc._id })
    },
    // Role changed
    {
      on: 'update',
      event: 'roleChanged',
      match: (_doc, update) => Boolean(update.$set?.role),
      payload: doc => ({
        userId: doc._id,
        oldRole: _doc.role,
        newRole: update.$set.role
      })
    }
  ]
});
// Avoid model overwrite errors in development/hot reload
const User = mongoose.models.User || model('User', userSchema);
export default User;
