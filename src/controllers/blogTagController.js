import BlogTag from '../models/BlogTag.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/blog/tags
export const listTags = asyncHandler(async (req, res) => {
  const tags = await BlogTag.find({}).sort({ name: 1 });
  res.json(tags);
});

// POST /api/blog/tags
export const createTag = asyncHandler(async (req, res) => {
  const tag = await BlogTag.create(req.body);
  res.status(201).json(tag);
});

// PUT /api/blog/tags/:id
export const updateTag = asyncHandler(async (req, res) => {
  const tag = await BlogTag.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!tag) return res.status(404).json({ message: 'Tag not found' });
  res.json(tag);
});

// DELETE /api/blog/tags/:id
export const deleteTag = asyncHandler(async (req, res) => {
  const tag = await BlogTag.findByIdAndDelete(req.params.id);
  if (!tag) return res.status(404).json({ message: 'Tag not found' });
  res.json({ message: 'Tag deleted' });
});
