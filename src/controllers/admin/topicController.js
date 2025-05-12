// src/controllers/admin/topicController.js
import asyncHandler from '../../utils/asyncHandler.js';
import Topic from '../../models/Topic.js';
import Category from '../../models/Category.js';

// List all topics
export const getAllTopics = asyncHandler(async (req, res) => {
  const topics = await Topic.find()
    .populate('category', 'name')
    .sort('name');
  res.json({ topics });
});

// Get one
export const getTopicById = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id)
    .populate('category', 'name');
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  res.json({ topic });
});

// Create
export const createTopic = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  // ensure category exists
  const cat = await Category.findById(category);
  if (!cat) return res.status(400).json({ message: 'Invalid category' });
  const exists = await Topic.findOne({ name, category });
  if (exists) return res.status(400).json({ message: 'Topic already exists in this category' });
  const topic = await Topic.create({ name, category });
  const populated = await topic.populate('category', 'name');
  res.status(201).json({ topic: populated });
});

// Update
export const updateTopic = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  const topic = await Topic.findById(req.params.id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });

  if (category && category !== topic.category.toString()) {
    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });
    topic.category = category;
  }
  topic.name = name;
  await topic.save();
  const populated = await topic.populate('category', 'name');
  res.json({ topic: populated });
});

// Delete
export const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  await topic.remove();
  res.json({ message: 'Topic deleted' });
});
