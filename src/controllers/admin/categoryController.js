// src/controllers/admin/categoryController.js
import asyncHandler from '../../utils/asyncHandler.js';
import Category from '../../models/Category.js';

// List all categories
export const getAllCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find().sort('name');
  res.json({ categories: cats });
});

// Get one
export const getCategoryById = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json({ category: cat });
});

// Create
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const exists = await Category.findOne({ name });
  if (exists) return res.status(400).json({ message: 'Name already exists' });
  const cat = await Category.create({ name, description });
  res.status(201).json({ category: cat });
});

// Update
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  if (name && name !== cat.name) {
    const dup = await Category.findOne({ name });
    if (dup) return res.status(400).json({ message: 'Name already exists' });
  }
  cat.name = name;
  cat.description = description;
  await cat.save();
  res.json({ category: cat });
});

// Delete
export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  await cat.remove();
  res.json({ message: 'Category deleted' });
});
