// src/controllers/admin/categoryController.js

import asyncHandler from '../../utils/asyncHandler.js';
import Category from '../../models/Category.js';
import mongoose from 'mongoose';
import csv from 'csvtojson';
import XLSX from 'xlsx';
import path from 'path';

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
  const { name, description = '', type = 'both', icon = '', isVisible = true, order = 0 } = req.body;
  const exists = await Category.findOne({ name });
  if (exists) {
    return res.status(400).json({ message: 'Category name already exists' });
  }
  const category = await Category.create({ name, description, type, icon, isVisible, order });
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

// ─────────────────────────────────────────────────────────
// ✅ TOGGLE VISIBILITY
// PATCH /api/admin/categories/:id/toggle
export const toggleCategoryVisibility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }
  const category = await Category.findById(id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  category.isVisible = !category.isVisible;
  await category.save();
  res.json({ category });
});

// ─────────────────────────────────────────────────────────
// ✅ BULK UPLOAD FROM FILE (CSV/XLSX)
// POST /api/admin/categories/bulk-upload
export const bulkUploadCategories = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  let rows;

  try {
    if (ext === '.csv') {
      rows = await csv().fromString(req.file.buffer.toString());
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Use CSV or XLSX.' });
    }
  } catch {
    return res.status(400).json({ message: 'Failed to parse uploaded file.' });
  }

  let count = 0;
  for (let r of rows) {
    if (!r.name) continue;
    const exists = await Category.findOne({ name: r.name.trim() });
    if (exists) continue;

    await Category.create({
      name: r.name.trim(),
      description: r.description?.trim() || '',
      type: r.type?.trim() || 'both',
      isVisible: r.isVisible !== 'false',
      order: parseInt(r.order || 0, 10) || 0
    });
    count++;
  }

  res.status(201).json({ message: 'Bulk upload successful', count });
});
