// src/middlewares/validateRequest.js

/**
 * Usage:
 *    import validateRequest from '../middlewares/validateRequest.js'
 *    router.post('/', validateRequest(schema), controller)
 */

export default function validateRequest(schema, partial = false) {
  return (req, res, next) => {
    let result;
    if (typeof schema === 'function' && schema.validate) {
      // Joi schema
      result = partial
        ? schema.fork(Object.keys(req.body), field => field.optional()).validate(req.body)
        : schema.validate(req.body);
    } else if (typeof schema === 'function') {
      // Zod or other
      try {
        schema.parse(req.body);
        result = { error: null };
      } catch (err) {
        result = { error: err };
      }
    } else {
      result = { error: { message: 'No validation schema provided' } };
    }

    if (result.error) {
      return res.status(400).json({ message: result.error.details ? result.error.details[0].message : result.error.message });
    }
    next();
  };
}
