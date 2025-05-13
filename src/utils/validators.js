// utils/validate.js
export default function validate(schema, property = 'body') {
  return (req, res, next) => {
    const data = req[property];
    // Zod support
    if (typeof schema.safeParse === 'function') {
      const result = schema.safeParse(data);
      if (!result.success) {
        const messages = result.error.errors.map(e => e.message).join('; ');
        return res.status(400).json({ message: messages });
      }
      req[property] = result.data;
      return next();
    }
    // Fallback to Joi-style
    if (typeof schema.validate === 'function') {
      const { error, value } = schema.validate(data);
      if (error) {
        const messages = error.details.map(d => d.message).join('; ');
        return res.status(400).json({ message: messages });
      }
      req[property] = value;
      return next();
    }
    // Unknown schema type
    throw new Error('Unsupported schema passed to validate()');
  };
}
