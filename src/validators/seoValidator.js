export const validateSeoMeta = (req, res, next) => {
  const { path, title, description } = req.body;
  if (!path || !title || !description) {
    return res.status(400).json({ message: 'Path, title, and description are required.' });
  }
  next();
};
