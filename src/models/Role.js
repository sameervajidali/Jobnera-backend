import mongoose from 'mongoose';

// ─── 1️⃣ Define your modules/resources ────────────────────────────────
// These represent your system’s main resource entities for permissions
const RESOURCES = [
  'USER',
  'ROLE',
  'QUIZ',
  'BLOG',
  'JOB',
  // Add new modules here as your system expands
];

// ─── 2️⃣ Define your CRUD actions (plus any extras) ───────────────────
// Common actions plus extra like MANAGE for higher-level access
const ACTIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'MANAGE',
  // Add more granular actions if needed (e.g., 'PUBLISH', 'ASSIGN')
];

// ─── 3️⃣ Auto-generate all valid permission keys ─────────────────────
// Combines each resource with every action (e.g., USER_CREATE)
export const VALID_PERMISSIONS = RESOURCES.flatMap(resource =>
  ACTIONS.map(action => `${resource}_${action}`)
);

// ─── Role Schema ──────────────────────────────────────────────────────
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,  // Normalize role names to uppercase for consistency
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  permissions: {
    type: [String],
    enum: VALID_PERMISSIONS,  // Validate permissions against allowed keys
    default: [],              // New roles start with no permissions
  },
}, {
  timestamps: true, // createdAt, updatedAt auto-managed
});

// Optional: Static method to get all valid permissions
roleSchema.statics.getValidPermissions = function() {
  return VALID_PERMISSIONS;
};

// Avoid model overwrite on hot reloads (especially in dev)
export default mongoose.models.Role || mongoose.model('Role', roleSchema);
