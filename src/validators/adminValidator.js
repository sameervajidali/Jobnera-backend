import Joi from 'joi';
import mongoose from 'mongoose';

// ObjectId validator
const objectId = Joi.string().custom((val, helpers) => {
  return mongoose.Types.ObjectId.isValid(val)
    ? val
    : helpers.error('any.invalid');
}).message('Invalid ObjectId');

// ==== User Schemas ====
export const userIdParamSchema = Joi.object({ id: objectId.required() });

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid('USER','MODERATOR','CREATOR','SUPPORT','ADMIN','SUPERADMIN')
    .required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  role: Joi.string().valid('USER','MODERATOR','CREATOR','SUPPORT','ADMIN','SUPERADMIN'),
  isVerified: Joi.boolean(),
});

// ==== Role Schemas ====
export const roleIdParamSchema = Joi.object({ id: objectId.required() });

export const createRoleSchema = Joi.object({
  name: Joi.string().uppercase().min(2).max(30).required(),
  permissions: Joi.array().items(Joi.string().uppercase()).required(),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().uppercase().min(2).max(30),
  permissions: Joi.array().items(Joi.string().uppercase()),
});
