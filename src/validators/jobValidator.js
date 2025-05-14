export const validateJob = (req, res, next) => {
  const { title, company, location, applyLink } = req.body;
  if (!title || !company || !location || !applyLink) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  next();
};
