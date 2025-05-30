import bcrypt from 'bcrypt';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendUserCredentialsEmail } from '../services/emailService.js';
import bus from '../events/notificationBus.js';
import { sendNotification } from '../services/notificationService.js';

const VALID_ROLES = [
  'USER', 'MODERATOR', 'CREATOR', 'SUPPORT', 'ADMIN', 'SUPERADMIN'
];

const PROTECTED_ROLES = ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'CREATOR', 'SUPPORT'];


export const createUser = asyncHandler(async (req, res) => {
  const roleDoc = await Role.findOne({ name: req.body.role.toUpperCase() });
  const user = await User.create({ ...req.body, role: roleDoc._id, provider: 'local' });
  console.log('🔔 Controller: admin created user', user._id);

  await sendNotification(
    user._id,
    'adminUserCreated',
    { message: 'Your account was created by an administrator.' }
  );

  const out = user.toObject();
  delete out.password;
  res.status(201).json({ user: out });
});



// ─── List users (with SUPERADMIN excluded for non-SUPERADMIN callers) ───
export const getAllUsers = asyncHandler(async (req, res) => {
  // pagination
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  // find the SUPERADMIN role doc
  const superRole = await Role.findOne({ name: 'SUPERADMIN' }).select('_id');
  const superId   = superRole ? superRole._id : null;

  // build filter object
  const filter = {};
  // if the caller is _not_ a SUPERADMIN, exclude SUPERADMIN users
  if (req.user.role.name !== 'SUPERADMIN' && superId) {
    filter.role = { $ne: superId };
  }

  // get total & paginated users
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('name email role provider isVerified createdAt updatedAt')
    .populate('role', 'name')    // bring back role.name
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({ total, page, limit, users });
});



export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshTokens -resetToken* -activationToken*')
    .lean();
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ user });
});

// export const updateUser = asyncHandler(async (req, res) => {
//   const { name, email, role, isVerified } = req.body;

//   const updates = {};
//   if (name) updates.name = name;
//   if (email) updates.email = email;

//   if (role) {
//     const normalizedRole = role.toUpperCase();
//     const currentUserRole = req.user?.role?.toUpperCase();

//     if (PROTECTED_ROLES.includes(normalizedRole) && currentUserRole !== 'SUPERADMIN') {
//       return res.status(403).json({ message: 'Insufficient rights to assign that role.' });
//     }

//     updates.role = normalizedRole;
//   }

//   if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

//   const user = await User.findByIdAndUpdate(req.params.id, updates, {
//     new: true,
//     runValidators: true,
//   })
//     .select('-password -refreshTokens -resetToken* -activationToken*')
//     .lean();

//   if (!user) return res.status(404).json({ message: 'User not found.' });
//   res.status(200).json({ message: 'User updated.', user });
// });

// src/controllers/adminController.js
export const updateUser = asyncHandler(async (req, res) => {
  const { role: roleName, ...rest } = req.body;

  // build the update payload
  const update = { ...rest };
  if (roleName) {
    const roleDoc = await Role.findOne({ name: roleName.toUpperCase() });
    if (!roleDoc) {
      return res.status(400).json({
        message: `Invalid role "${roleName}". Must be one of: USER, ADMIN, …`
      });
    }
    update.role = roleDoc._id;
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ user });
});



export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ message: 'User deleted.' });
});

// ─── ROLE CRUD ─────────────────────────────────────────────────────────────

export const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;
  if (await Role.exists({ name })) {
    return res.status(409).json({ message: 'Role already exists.' });
  }
  const role = await Role.create({ name, permissions });
  res.status(201).json({ message: 'Role created.', role });
});

export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().lean();
  res.status(200).json({ roles });
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).lean();
  if (!role) return res.status(404).json({ message: 'Role not found.' });
  res.status(200).json({ role });
});

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

export const deleteRole = asyncHandler(async (req, res) => {
  const deleted = await Role.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ message: 'Role not found.' });
  res.status(200).json({ message: 'Role deleted.' });
});
