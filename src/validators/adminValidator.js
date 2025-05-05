import Joi from 'joi';
import mongoose from 'mongoose';

// ─── Custom ObjectId Validator ────────────────────────────────────────────────
const objectId = Joi.string().custom((val, helpers) => {
  return mongoose.Types.ObjectId.isValid(val)
    ? val
    : helpers.error('any.invalid');
}).message('Invalid ObjectId');

// ─── Constants ────────────────────────────────────────────────────────────────
const VALID_ROLES = ['USER', 'MODERATOR', 'CREATOR', 'SUPPORT', 'ADMIN', 'SUPERADMIN'];

// ─── User Schemas ─────────────────────────────────────────────────────────────
export const userIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string()
    .valid(...VALID_ROLES)
    .required()
    .messages({
      'any.only': `Role must be one of: ${VALID_ROLES.join(', ')}`,
      'any.required': 'Role is required',
    }),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  email: Joi.string().email().messages({
    'string.email': 'Invalid email address',
  }),
  role: Joi.string()
    .valid(...VALID_ROLES)
    .messages({
      'any.only': `Role must be one of: ${VALID_ROLES.join(', ')}`,
    }),
  isVerified: Joi.boolean(),
});

// ─── Role Schemas ─────────────────────────────────────────────────────────────
export const roleIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const createRoleSchema = Joi.object({
  name: Joi.string().uppercase().min(2).max(30).required().messages({
    'string.uppercase': 'Role name must be in uppercase',
    'string.min': 'Role name must be at least 2 characters',
    'string.max': 'Role name cannot exceed 30 characters',
    'any.required': 'Role name is required',
  }),
  permissions: Joi.array()
    .items(Joi.string().uppercase())
    .required()
    .messages({
      'any.required': 'Permissions are required',
      'array.includes': 'Each permission must be a string in uppercase',
    }),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().uppercase().min(2).max(30).messages({
    'string.uppercase': 'Role name must be in uppercase',
    'string.min': 'Role name must be at least 2 characters',
    'string.max': 'Role name cannot exceed 30 characters',
  }),
  permissions: Joi.array().items(Joi.string().uppercase()).messages({
    'array.includes': 'Each permission must be a string in uppercase',
  }),
});
