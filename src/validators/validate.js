import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to validate request data against a Joi schema.
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {'body'|'params'|'query'} [property='body'] - Request property to validate
 * @returns {Function} Express middleware function
 */
export const validate = (schema, property = 'body') =>
  asyncHandler(async (req, res, next) => {
    const data = req[property];

    // Validate using Joi, allowing unknown keys and collecting all errors
    const { error } = schema.validate(data, { abortEarly: false, allowUnknown: true });

    if (error) {
      // Extract all error messages from Joi validation error details
      const messages = error.details.map(detail => detail.message);

      // Respond with 400 Bad Request and error messages concatenated
      res.status(400);
      throw new Error(messages.join(', '));
    }

    // If no error, continue to next middleware or route handler
    next();
  });
