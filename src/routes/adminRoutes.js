// // src/routes/adminRoutes.js
// import express from 'express';
// import { protect, requireRole } from '../middlewares/authMiddleware.js';
// import { validate } from '../validators/validate.js';
// import {
//   createUser,
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
//   createRole,
//   getAllRoles,
//   getRoleById,
//   updateRole,
//   deleteRole,
// } from '../controllers/adminController.js';
// import {
//   userIdParamSchema,
//   createUserSchema,
//   updateUserSchema,
//   roleIdParamSchema,
//   createRoleSchema,
//   updateRoleSchema,
// } from '../validators/adminValidator.js';
// import { getUserHistory } from '../controllers/admin/adminUserController.js';

// const router = express.Router();

// // Protect all admin routes
// router.use(protect);

// // ── User Management ──────────────────────────────────────────────────────────
// // Create user (only ADMIN or SUPERADMIN; but controller itself enforces SUPERADMIN for elevated roles)
// router.post(
//   '/users',
//   requireRole(['ADMIN', 'SUPERADMIN']),
//   validate(createUserSchema),
//   createUser
// );


// // GET full history
// router.get(
//   '/admin/users/:id/history',
//   requireRole(['ADMIN', 'SUPERADMIN']),
//   getUserHistory
// );

// // List users
// router.get(
//   '/users',
//   requireRole(['ADMIN', 'SUPERADMIN']),
//   getAllUsers
// );

// // Get single user
// router.get(
//   '/users/:id',
//   requireRole(['ADMIN', 'SUPERADMIN']),
//   validate(userIdParamSchema, 'params'),
//   getUserById
// );

// // Update user
// router.put(
//   '/users/:id',
//   requireRole(['ADMIN', 'SUPERADMIN']),
//   validate(userIdParamSchema, 'params'),
//   validate(updateUserSchema),
//   updateUser
// );

// // Delete user
// router.delete(
//   '/users/:id',
//   requireRole(['ADMIN', 'SUPERADMIN']),
//   validate(userIdParamSchema, 'params'),
//   deleteUser
// );

// // ── Role Management ──────────────────────────────────────────────────────────
// // Create role (SUPERADMIN only)
// router.post(
//   '/roles',
//   requireRole(['SUPERADMIN']),
//   validate(createRoleSchema),
//   createRole
// );

// // List roles
// router.get(
//   '/roles',
//   requireRole(['SUPERADMIN']),
//   getAllRoles
// );

// // Get single role
// router.get(
//   '/roles/:id',
//   requireRole(['SUPERADMIN']),
//   validate(roleIdParamSchema, 'params'),
//   getRoleById
// );

// // Update role
// router.put(
//   '/roles/:id',
//   requireRole(['SUPERADMIN']),
//   validate(roleIdParamSchema, 'params'),
//   validate(updateRoleSchema),
//   updateRole
// );

// // Delete role
// router.delete(
//   '/roles/:id',
//   requireRole(['SUPERADMIN']),
//   validate(roleIdParamSchema, 'params'),
//   deleteRole
// );

// export default router;


// src/routes/adminRoutes.js
import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../validators/validate.js';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from '../controllers/adminController.js';
import {
  userIdParamSchema,
  createUserSchema,
  updateUserSchema,
  roleIdParamSchema,
  createRoleSchema,
  updateRoleSchema,
} from '../validators/adminValidator.js';
import { getUserHistory } from '../controllers/admin/adminUserController.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);

// ── User Management ──────────────────────────────────────────────────────────
// Create user (only ADMIN or SUPERADMIN; but controller itself enforces SUPERADMIN for elevated roles)
router.post(
  '/users',
  requireRole(['ADMIN', 'SUPERADMIN']),
  validate(createUserSchema),
  createUser
);

// GET full history for a specific user
router.get(
  '/users/:id/history',
  requireRole(['ADMIN', 'SUPERADMIN']),
  validate(userIdParamSchema, 'params'),
  getUserHistory
);

// List users
router.get(
  '/users',
  requireRole(['ADMIN', 'SUPERADMIN']),
  getAllUsers
);

// Get single user
router.get(
  '/users/:id',
  requireRole(['ADMIN', 'SUPERADMIN']),
  validate(userIdParamSchema, 'params'),
  getUserById
);

// Update user
router.put(
  '/users/:id',
  requireRole(['ADMIN', 'SUPERADMIN']),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  updateUser
);

// Delete user
router.delete(
  '/users/:id',
  requireRole(['ADMIN', 'SUPERADMIN']),
  validate(userIdParamSchema, 'params'),
  deleteUser
);

// ── Role Management ──────────────────────────────────────────────────────────
// Create role (SUPERADMIN only)
router.post(
  '/roles',
  requireRole(['SUPERADMIN']),
  validate(createRoleSchema),
  createRole
);

// List roles
router.get(
  '/roles',
  requireRole(['SUPERADMIN']),
  getAllRoles
);

// Get single role
router.get(
  '/roles/:id',
  requireRole(['SUPERADMIN']),
  validate(roleIdParamSchema, 'params'),
  getRoleById
);

// Update role
router.put(
  '/roles/:id',
  requireRole(['SUPERADMIN']),
  validate(roleIdParamSchema, 'params'),
  validate(updateRoleSchema),
  updateRole
);

// Delete role
router.delete(
  '/roles/:id',
  requireRole(['SUPERADMIN']),
  validate(roleIdParamSchema, 'params'),
  deleteRole
);

export default router;
