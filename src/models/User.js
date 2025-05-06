// // src/models/User.js
// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// const { Schema, model } = mongoose;

// // Constants for lockout
// const MAX_LOGIN_ATTEMPTS = 5;
// const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// const userSchema = new Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     index: true,
//   },

//   // only select password on demand
//   password: {
//     type: String,
//     minlength: 6,
//     select: false,
//   },

//   // Local vs social provider
//   provider: {
//     type: String,
//     enum: ['local', 'google', 'facebook', 'github'],
//     default: 'local',
//   },

//   // ID from OAuth provider (Google sub, Facebook id, etc.)
//   providerId: {
//     type: String,
//     select: false,
//   },

//   // Gravatar or uploaded avatar URL
//   avatar: {
//     type: String,
//   },

//   // Email verification
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },

//   activationToken: {
//     type: String,
//     select: false,
//   },
//   activationTokenExpiry: {
//     type: Date,
//     select: false,
//   },

//   // Password reset
//   resetToken: {
//     type: String,
//     select: false,
//   },
//   resetTokenExpiry: {
//     type: Date,
//     select: false,
//   },

//   // Track issued refresh tokens for revocation
//   refreshTokens: [
//     {
//       token: { type: String, required: true, select: false },
//       createdAt: { type: Date, default: Date.now },
//       expiresAt: { type: Date, required: true },
//       ip: String,
//       userAgent: String,
//     },
//   ],

//   // Roles & permissions
//   role: {
//     type: String,
//     enum: [
//       'USER',
//       'MODERATOR',
//       'CREATOR',
//       'SUPPORT',
//       'ADMIN',
//       'SUPERADMIN',
//     ],
//     default: 'USER',
//     uppercase: true, // 🔐 ensures value is stored as uppercase
//   },

//   // Brute-force protection
//   loginAttempts: {
//     type: Number,
//     default: 0,
//     select: false,
//   },
//   lockUntil: {
//     type: Date,
//     select: false,
//   },

//   // Track last successful login
//   lastLogin: {
//     type: Date,
//   },
// },
// {
//   timestamps: true,
// });

// // Virtual to check if account is currently locked
// userSchema.virtual('isLocked').get(function () {
//   return !!(this.lockUntil && this.lockUntil > Date.now());
// });

// // Hash password before saving (only when modified)
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Instance method to compare password
// userSchema.methods.comparePassword = function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Increment login attempts and lock account if needed
// userSchema.methods.incLoginAttempts = function () {
//   // reset if past lock time
//   if (this.lockUntil && this.lockUntil < Date.now()) {
//     return this.updateOne({
//       loginAttempts: 1,
//       lockUntil: null,
//     });
//   }

//   const updates = { $inc: { loginAttempts: 1 } };

//   // lock the account if max attempts reached
//   if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
//     updates.$set = { lockUntil: Date.now() + LOCK_TIME };
//   }

//   return this.updateOne(updates);
// };

// export default model('User', userSchema);


// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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

const userSchema = new Schema({
  // ─ Authentication ───────────────────────────────────────────────
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password:     { type: String, minlength: 6, select: false },
  provider:     { type: String, enum: ['local','google','facebook','github'], default: 'local' },
  providerId:   { type: String, select: false },

  // ─ Profile Fields ────────────────────────────────────────────────
  phone:        { type: String, trim: true, default: '' },
  location:     { type: String, trim: true, default: '' },
  bio:          { type: String, trim: true, default: '' },
  website:      { type: String, trim: true, default: '' },
  linkedin:     { type: String, trim: true, default: '' },

  avatar:       { type: String, default: '' },   // URL to avatar
  resume:       { type: String, default: '' },   // URL to resume PDF

  skills:       { type: [String], default: [] },
  languages:    { type: [String], default: [] },
  experience:   { type: [ExperienceSchema], default: [] },
  education:    { type: [EducationSchema],  default: [] },

  // ─ Email Verification & Password Reset ───────────────────────────
  isVerified:           { type: Boolean, default: false },
  activationToken:      { type: String, select: false },
  activationTokenExpiry:{ type: Date,   select: false },
  resetToken:           { type: String, select: false },
  resetTokenExpiry:     { type: Date,   select: false },

  // ─ Refresh Tokens for Revocation ─────────────────────────────────
  refreshTokens: [
    {
      token:     { type: String, required: true, select: false },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      ip:        String,
      userAgent: String,
    }
  ],

  // ─ Roles & Brute-Force Protection ────────────────────────────────
  role:        { type: String,
                 enum: ['USER','MODERATOR','CREATOR','SUPPORT','ADMIN','SUPERADMIN'],
                 default: 'USER',
                 uppercase: true },
  loginAttempts:{ type: Number, default: 0, select: false },
  lockUntil:    { type: Date,   select: false },

  lastLogin:   Date,
}, {
  timestamps: true,
});

// Virtual to check lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Lockout logic...
userSchema.methods.incLoginAttempts = function () { /* … */ };

export default model('User', userSchema);
