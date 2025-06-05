import Joi from 'joi';

// ─── User Registration Validation ──────────────────────────────────────
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.base': 'Name must be a string.',
      'string.empty': 'Name is required.',
      'string.min': 'Name must be at least 2 characters.',
      'string.max': 'Name must not exceed 50 characters.',
      'any.required': 'Name is required.',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address.',
      'any.required': 'Email is required.',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters.',
      'any.required': 'Password is required.',
    }),
});

// ─── Login Validation ───────────────────────────────────────────────────
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format.',
      'any.required': 'Email is required.',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required.',
    }),
});

// ─── Password Reset Request Validation ──────────────────────────────────
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format.',
      'any.required': 'Email is required.',
    }),
});

// ─── Password Reset Confirmation Validation ────────────────────────────
export const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required.',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters.',
      'any.required': 'New password is required.',
    }),
});
