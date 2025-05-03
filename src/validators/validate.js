// src/validators/validate.js
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to validate request data against a Joi schema.
 * @param {Joi.Schema} schema - Joi schema object
 * @param {'body'|'params'|'query'} [property='body'] - Request property to validate
 */
export const validate = (schema, property = 'body') =>
  asyncHandler(async (req, res, next) => {
    const data = req[property];
    const { error } = schema.validate(data, { abortEarly: false, allowUnknown: true });
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      res.status(400);
      throw new Error(messages.join(', '));
    }
    next();
  });
