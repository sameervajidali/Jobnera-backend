// src/controllers/admin/topicController.js
import asyncHandler from '../../utils/asyncHandler.js';
import Topic from '../../models/Topic.js';
import Category from '../../models/Category.js';
import mongoose from 'mongoose';
import csv from 'csvtojson';
import XLSX from 'xlsx';
import path from 'path';

// ─────────────────────────────────────────────
// ✅ GET ALL TOPICS (filter by type/category)
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

// ─────────────────────────────────────────────
// ✅ GET TOPIC BY ID
export const getTopicById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const topic = await Topic.findById(id).populate('category', 'name');
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  res.json({ topic });
});

// ─────────────────────────────────────────────
// ✅ CREATE NEW TOPIC
export const createTopic = asyncHandler(async (req, res) => {
  const { name, category, type = 'all', icon = '', description = '', isVisible = true, order = 0 } = req.body;
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }
  const cat = await Category.findById(category);
  if (!cat) return res.status(400).json({ message: 'Category not found' });

  const exists = await Topic.findOne({ name: name.trim(), category });
  if (exists) return res.status(400).json({ message: 'Topic already exists in this category' });

  const topic = await Topic.create({
    name: name.trim(),
    category,
    type: type.trim() || 'all',
    icon: icon.trim(),
    description: description.trim(),
    isVisible,
    order: parseInt(order, 10) || 0
  });
  const populated = await topic.populate('category', 'name');
  res.status(201).json({ topic: populated });
});

// ─────────────────────────────────────────────
// ✅ UPDATE TOPIC
export const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, type, icon, description, isVisible, order } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const topic = await Topic.findById(id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });

  // Handle category change
  if (category && category !== topic.category.toString()) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });
    topic.category = category;
  }

  // Check for duplicate name in the (possibly new) category
  if (name && name.trim() !== topic.name) {
    const dup = await Topic.findOne({ name: name.trim(), category: topic.category });
    if (dup) return res.status(400).json({ message: 'Another topic with this name already exists in the category' });
    topic.name = name.trim();
  }
  if (type !== undefined) topic.type = type.trim();
  if (icon !== undefined) topic.icon = icon.trim();
  if (description !== undefined) topic.description = description.trim();
  if (isVisible !== undefined) topic.isVisible = isVisible;
  if (order !== undefined) topic.order = parseInt(order, 10) || 0;

  await topic.save();
  const populated = await topic.populate('category', 'name');
  res.json({ topic: populated });
});

// ─────────────────────────────────────────────
// ✅ DELETE TOPIC (cascade handled in model)
export const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const deleted = await Topic.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'Topic not found' });
  res.json({ success: true, deleted });
});

// ─────────────────────────────────────────────
// ✅ TOGGLE VISIBILITY
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

// ─────────────────────────────────────────────
// ✅ BULK UPLOAD TOPICS (CSV/XLSX)
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

  let created = 0;
  let errors = [];
  for (let r of rows) {
    try {
      if (!r.name || !r.category) {
        errors.push({ name: r.name, message: 'Missing name or category' });
        continue;
      }
      // Accept category as _id or name
      let cat = null;
      if (mongoose.Types.ObjectId.isValid(r.category)) {
        cat = await Category.findById(r.category);
      } else if (typeof r.category === 'string') {
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
      await Topic.create({
        name: r.name.trim(),
        category: cat._id,
        description: r.description?.trim() || '',
        type: r.type?.trim() || 'all',
        icon: r.icon?.trim() || '',
        isVisible: r.isVisible !== false && r.isVisible !== "false",
        order: parseInt(r.order || 0, 10) || 0
      });
      created++;
    } catch (err) {
      errors.push({ name: r.name, message: err.message });
    }
  }

  res.status(201).json({
    message: `Bulk upload: ${created} created, ${errors.length} failed`,
    created,
    failed: errors.length,
    errors
  });
});

// ─────────────────────────────────────────────
// ✅ BULK UPLOAD (JSON)
export const bulkUploadTopicsJSON = asyncHandler(async (req, res) => {
  const { topics } = req.body;
  if (!Array.isArray(topics) || !topics.length) {
    return res.status(400).json({ message: 'No topics to upload' });
  }
  let created = [];
  let errors = [];
  for (const t of topics) {
    try {
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
        icon: t.icon?.trim() || '',
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

// ─────────────────────────────────────────────
// ✅ BULK UPLOAD (CSV, topic category in param or column)
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
        icon: r.icon?.trim() || '',
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
