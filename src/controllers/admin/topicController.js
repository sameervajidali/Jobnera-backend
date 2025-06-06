
// src/controllers/admin/topicController.js
import asyncHandler from '../../utils/asyncHandler.js';
import Topic from '../../models/Topic.js';
import Category from '../../models/Category.js';
import mongoose from 'mongoose';
import csv from 'csvtojson';
import XLSX from 'xlsx';
import path from 'path';

// ─────────────────────────────────────────────────────────
// ✅ GET ALL TOPICS (optionally by type or category)
// GET /api/admin/topics?type=quiz&category=6630085...
export const getAllTopics = asyncHandler(async (req, res) => {
  const { type, category } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  const topics = await Topic.find(filter)
    .populate('category', 'name')
    .sort({ order: 1, name: 1 });
  res.json({ topics });
});

// ─────────────────────────────────────────────────────────
// ✅ GET TOPIC BY ID
// GET /api/admin/topics/:id
export const getTopicById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const topic = await Topic.findById(id).populate('category', 'name');
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  res.json({ topic });
});

// ─────────────────────────────────────────────────────────
// ✅ CREATE NEW TOPIC
// POST /api/admin/topics
export const createTopic = asyncHandler(async (req, res) => {
  const { name, category, type = 'all', icon = '', description = '', isVisible = true, order = 0 } = req.body;
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }
  const cat = await Category.findById(category);
  if (!cat) return res.status(400).json({ message: 'Category not found' });
  const exists = await Topic.findOne({ name, category });
  if (exists) return res.status(400).json({ message: 'Topic already exists in this category' });
  const topic = await Topic.create({ name, category, type, icon, description, isVisible, order });
  const populated = await topic.populate('category', 'name');
  res.status(201).json({ topic: populated });
});

// ─────────────────────────────────────────────────────────
// ✅ UPDATE TOPIC
// PUT /api/admin/topics/:id
export const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, type, icon, description, isVisible, order } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const topic = await Topic.findById(id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  if (category && category !== topic.category.toString()) {
    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });
    topic.category = category;
  }
  if (name && name !== topic.name) {
    const dup = await Topic.findOne({ name, category: topic.category });
    if (dup) return res.status(400).json({ message: 'Another topic with this name already exists in the category' });
    topic.name = name;
  }
  if (type !== undefined) topic.type = type;
  if (icon !== undefined) topic.icon = icon;
  if (description !== undefined) topic.description = description;
  if (isVisible !== undefined) topic.isVisible = isVisible;
  if (order !== undefined) topic.order = order;
  await topic.save();
  const populated = await topic.populate('category', 'name');
  res.json({ topic: populated });
});

// ─────────────────────────────────────────────────────────
// ✅ DELETE TOPIC
// DELETE /api/admin/topics/:id
export const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const deleted = await Topic.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Topic not found' });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────
// ✅ TOGGLE VISIBILITY
// PATCH /api/admin/topics/:id/toggle
export const toggleTopicVisibility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const topic = await Topic.findById(id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  topic.isVisible = !topic.isVisible;
  await topic.save();
  res.json({ topic });
});

// ─────────────────────────────────────────────────────────
// ✅ BULK UPLOAD TOPICS (CSV/XLSX)
// POST /api/admin/topics/bulk-upload
export const bulkUploadTopics = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  let rows;

  try {
    if (ext === '.csv') {
      rows = await csv().fromString(req.file.buffer.toString());
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Use CSV or XLSX.' });
    }
  } catch {
    return res.status(400).json({ message: 'Failed to parse uploaded file.' });
  }

  let count = 0;
  for (let r of rows) {
    if (!r.name || !r.category) continue;
    const cat = await Category.findOne({ name: r.category.trim() });
    if (!cat) continue;
    const exists = await Topic.findOne({ name: r.name.trim(), category: cat._id });
    if (exists) continue;

    await Topic.create({
      name: r.name.trim(),
      category: cat._id,
      description: r.description?.trim() || '',
      type: r.type?.trim() || 'both',
      icon: r.icon || '',
      isVisible: r.isVisible !== 'false',
      order: parseInt(r.order || 0, 10) || 0
    });
    count++;
  }

  res.status(201).json({ message: 'Bulk upload successful', count });
});


// POST /api/admin/topics/bulk-upload/json
export const bulkUploadTopicsJSON = asyncHandler(async (req, res) => {
  const { topics } = req.body;
  if (!Array.isArray(topics) || !topics.length) {
    return res.status(400).json({ message: 'No topics to upload' });
  }
  let created = [];
  let errors = [];
  for (const t of topics) {
    try {
      // Accept category as _id or name
      let cat = null;
      if (mongoose.Types.ObjectId.isValid(t.category)) {
        cat = await Category.findById(t.category);
      } else if (typeof t.category === "string") {
        cat = await Category.findOne({ name: t.category.trim() });
      }
      if (!cat) {
        errors.push({ name: t.name, message: "Category not found" });
        continue;
      }
      const exists = await Topic.findOne({ name: t.name.trim(), category: cat._id });
      if (exists) {
        errors.push({ name: t.name, message: "Already exists" });
        continue;
      }
      const topic = await Topic.create({
        name: t.name.trim(),
        category: cat._id,
        description: t.description?.trim() || '',
        type: t.type?.trim() || 'all',
        icon: t.icon || '',
        isVisible: t.isVisible !== false && t.isVisible !== "false",
        order: parseInt(t.order || 0, 10) || 0
      });
      created.push(topic);
    } catch (err) {
      errors.push({ name: t.name, message: err.message });
    }
  }
  res.status(201).json({
    message: `Bulk upload: ${created.length} created, ${errors.length} failed`,
    createdTopics: created,
    failed: errors.length,
    errors,
  });
});


// POST /api/admin/topics/bulk-upload/csv
export const bulkUploadTopicsCSV = asyncHandler(async (req, res) => {
  const { category } = req.body; // accept from FormData
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  let rows;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    if (ext === '.csv') {
      rows = await csv().fromString(req.file.buffer.toString());
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Use CSV or XLSX.' });
    }
  } catch {
    return res.status(400).json({ message: 'Failed to parse uploaded file.' });
  }

  let created = [];
  let errors = [];

  for (let r of rows) {
    try {
      // Determine category (priority: API param, then file column)
      let cat = null;
      if (category && mongoose.Types.ObjectId.isValid(category)) {
        cat = await Category.findById(category);
      } else if (r.category && mongoose.Types.ObjectId.isValid(r.category)) {
        cat = await Category.findById(r.category);
      } else if (r.category && typeof r.category === "string") {
        cat = await Category.findOne({ name: r.category.trim() });
      }
      if (!cat) {
        errors.push({ name: r.name, message: "Category not found" });
        continue;
      }
      const exists = await Topic.findOne({ name: r.name.trim(), category: cat._id });
      if (exists) {
        errors.push({ name: r.name, message: "Already exists" });
        continue;
      }
      const topic = await Topic.create({
        name: r.name.trim(),
        category: cat._id,
        description: r.description?.trim() || '',
        type: r.type?.trim() || 'all',
        icon: r.icon || '',
        isVisible: r.isVisible !== false && r.isVisible !== "false",
        order: parseInt(r.order || 0, 10) || 0
      });
      created.push(topic);
    } catch (err) {
      errors.push({ name: r.name, message: err.message });
    }
  }

  res.status(201).json({
    message: `Bulk upload: ${created.length} created, ${errors.length} failed`,
    createdTopics: created,
    failed: errors.length,
    errors,
  });
});
