// src/controllers/admin/categoryController.js

import asyncHandler from '../../utils/asyncHandler.js';
import Category from '../../models/Category.js';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────
// ✅ GET ALL CATEGORIES (with optional type filtering)
// GET /api/admin/categories?type=quiz/tutorial/blog
export const getAllCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const filter = type ? { type } : {};
  const categories = await Category.find(filter).sort({ order: 1, name: 1 });

  res.json({ categories });
});

// ─────────────────────────────────────────────────────────
// ✅ GET CATEGORY BY ID
// GET /api/admin/categories/:id
export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  res.json({ category });
});

// ─────────────────────────────────────────────────────────
// ✅ CREATE NEW CATEGORY
// POST /api/admin/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, type = 'all', icon = '', isVisible = true, order = 0 } = req.body;

  const exists = await Category.findOne({ name });
  if (exists) {
    return res.status(400).json({ message: 'Category name already exists' });
  }

  const category = await Category.create({
    name,
    description,
    type,
    icon,
    isVisible,
    order
  });

  res.status(201).json({ category });
});

// ─────────────────────────────────────────────────────────
// ✅ UPDATE CATEGORY
// PUT /api/admin/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const { name, description, type, icon, isVisible, order } = req.body;
  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  if (name && name !== category.name) {
    const dup = await Category.findOne({ name });
    if (dup) return res.status(400).json({ message: 'Category name already exists' });
    category.name = name;
  }

  if (description !== undefined) category.description = description;
  if (type !== undefined) category.type = type;
  if (icon !== undefined) category.icon = icon;
  if (isVisible !== undefined) category.isVisible = isVisible;
  if (order !== undefined) category.order = order;

  await category.save();
  res.json({ category });
});

// ─────────────────────────────────────────────────────────
// ✅ DELETE CATEGORY
// DELETE /api/admin/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: 'Category not found' });
  }

  res.json({ success: true });
});
