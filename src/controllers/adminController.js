import bcrypt from 'bcrypt';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendUserCredentialsEmail } from '../services/emailService.js';  // ← new import

// ─── USER CRUD ────────────────────────────────────────────────────────────────
const VALID_ROLES = [
  'user',
  'moderator',
  'creator',
  'support',
  'admin',
  'superadmin',
];

// Create a new user (superadmin only if role ≠ USER)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1) Basic checks
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  // 2) Normalize role (default to 'user' if none provided)
  const normalizedRole = (role || 'user').toLowerCase();

  // 3) Validate against your enum
  if (!VALID_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: `Invalid role '${role}'.` });
  }

  // 4) Privilege check: only superadmin can create non-'user'
  if (normalizedRole !== 'user' && req.user.role !== 'superadmin') {
    return res
      .status(403)
      .json({ message: 'Insufficient rights to assign that elevated role.' });
  }

  // 5) Prevent duplicate email
  if (await User.exists({ email })) {
    return res.status(409).json({ message: 'Email already in use.' });
  }

  // 6) Hash & create
  //const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password,
    role: normalizedRole,
    isVerified: true,
    provider: 'local',
  });

   // 7) Send credentials email
   sendUserCredentialsEmail(email, name, password)
   .then(() => console.log(`📧 Sent credentials to ${email}`))
   .catch(err => console.error(`❌ Failed to send credentials:`, err));

 // 8) Respond
 res.status(201).json({
  message: 'User created successfully and credentials sent via email.',
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});
});


/**
 * GET /api/admin/users
 * List users with pagination, projecting only safe fields.
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  // Total count
  const total = await User.countDocuments();

  // Grab only the fields you want — exclude password, refreshTokens, etc.
  const users = await User.find({})
    .select('name email role provider isVerified createdAt updatedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    total,
    page,
    limit,
    users,
  });
});


export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshTokens -resetToken* -activationToken*')
    .lean();

  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isVerified } = req.body;

  // Prevent admins from escalating roles beyond their own power
  if (role && role !== 'USER' && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Insufficient rights to assign that role.' });
  }

  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .select('-password -refreshTokens -resetToken* -activationToken*')
    .lean();

  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ message: 'User updated.', user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ message: 'User deleted.' });
});

// ─── ROLE CRUD ────────────────────────────────────────────────────────────────

// Create a new role (SUPERADMIN only)
export const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;
  if (await Role.exists({ name })) {
    return res.status(409).json({ message: 'Role already exists.' });
  }
  const role = await Role.create({ name, permissions });
  res.status(201).json({ message: 'Role created.', role });
});

// List all roles (admin & superadmin)
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().lean();
  res.status(200).json({ roles });
});

// Get single role by ID
export const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).lean();
  if (!role) return res.status(404).json({ message: 'Role not found.' });
  res.status(200).json({ role });
});

// Update a role (SUPERADMIN only)
export const updateRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (permissions) updates.permissions = permissions;

  const role = await Role.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  if (!role) return res.status(404).json({ message: 'Role not found.' });
  res.status(200).json({ message: 'Role updated.', role });
});

// Delete a role (SUPERADMIN only)
export const deleteRole = asyncHandler(async (req, res) => {
  const deleted = await Role.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ message: 'Role not found.' });
  res.status(200).json({ message: 'Role deleted.' });
});
