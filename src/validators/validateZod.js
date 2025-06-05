import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to validate request data against a Zod schema.
 *
 * @param {import('zod').ZodTypeAny} schema - Zod schema object
 * @param {'body'|'params'|'query'} [property='body'] - Request property to validate
 * @returns {Function} Express middleware function
 */
export default function validateZod(schema, property = 'body') {
  return asyncHandler(async (req, res, next) => {
    const data = req[property];

    // Use Zod's safeParse to validate and parse
    const result = schema.safeParse(data);

    if (!result.success) {
      // Flatten all error messages from Zod validation errors
      const msgs = result.error.errors.map(e => e.message);

      // Respond with 400 Bad Request and concatenated messages
      res.status(400);
      throw new Error(msgs.join(', '));
    }

    // Overwrite the request property with parsed and validated data
    req[property] = result.data;

    next();
  });
}
