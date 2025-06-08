import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/blog/categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ type: 'blog' }).sort({ order: 1, name: 1 });
  res.json(categories);
});

// POST /api/blog/categories
export const createCategory = asyncHandler(async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'Category name is required' });
  req.body.type = 'blog'; // Force blog type
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

// PUT /api/blog/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

// DELETE /api/blog/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
});
