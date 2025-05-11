// src/models/Role.js
import mongoose from 'mongoose';

// 1️⃣ Define your modules/resources
const RESOURCES = [
  'USER',
  'ROLE',
  'QUIZ',
  'BLOG',
  'JOB',
  // add new modules here...
];

// 2️⃣ Define your CRUD actions (plus any extras)
const ACTIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'MANAGE'
  // you can add 'PUBLISH', 'ASSIGN', etc.
];

// 3️⃣ Auto-generate all valid permission keys
//    e.g. ['USER_CREATE','USER_READ',...,'JOB_DELETE']
export const VALID_PERMISSIONS = RESOURCES.flatMap(resource =>
  ACTIONS.map(action => `${resource}_${action}`)
);

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  permissions: {
    type: [String],
    enum: VALID_PERMISSIONS,
    default: [],           // by default a new role has no permissions
  },
}, {
  timestamps: true,
});

// Optional: add a static helper to list permissions if needed
roleSchema.statics.getValidPermissions = function() {
  return VALID_PERMISSIONS;
};

export default mongoose.model('Role', roleSchema);
