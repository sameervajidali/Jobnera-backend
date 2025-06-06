// src/controllers/admin/topicController.js
import asyncHandler from '../../utils/asyncHandler.js';
import Topic from '../../models/Topic.js';
import Category from '../../models/Category.js';
import mongoose from 'mongoose';

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

  const topic = await Topic.create({
    name,
    category,
    type,
    icon,
    description,
    isVisible,
    order
  });

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
