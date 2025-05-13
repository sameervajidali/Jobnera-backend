import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to validate request data against a Zod schema.
 * @param {import('zod').ZodTypeAny} schema - Zod schema object
 * @param {'body'|'params'|'query'} [property='body'] - Request property to validate
 */
export default function validateZod(schema, property = 'body') {
  return asyncHandler(async (req, res, next) => {
    const data = req[property];
    const result = schema.safeParse(data);
    if (!result.success) {
      // flatten all error messages
      const msgs = result.error.errors.map(e => e.message);
      res.status(400);
      throw new Error(msgs.join(', '));
    }
    // overwrite req[property] with the parsed data
    req[property] = result.data;
    next();
  });
}
