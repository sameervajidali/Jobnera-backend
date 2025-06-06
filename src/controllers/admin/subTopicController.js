// src/controllers/admin/subTopicController.js
import asyncHandler from '../../utils/asyncHandler.js';
import SubTopic from '../../models/SubTopic.js';
import Topic from '../../models/Topic.js';
import mongoose from 'mongoose';
import xlsx from 'xlsx';

// ─────────────────────────────────────────────────────────
// ✅ GET ALL SUBTOPICS (with optional topic filter)
export const getAllSubTopics = asyncHandler(async (req, res) => {
  const { topic } = req.query;
  const filter = topic ? { topic } : {};

  const subtopics = await SubTopic.find(filter)
    .populate('topic', 'name')
    .sort({ order: 1, name: 1 });

  res.json({ subtopics });
});

// ✅ GET SUBTOPIC BY ID
export const getSubTopicById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid subtopic ID' });
  }
  const subtopic = await SubTopic.findById(id).populate('topic', 'name');
  if (!subtopic) return res.status(404).json({ message: 'SubTopic not found' });

  res.json({ subtopic });
});

// ✅ CREATE NEW SUBTOPIC
export const createSubTopic = asyncHandler(async (req, res) => {
  const { name, topic, description = '', icon = '', isVisible = true, order = 0 } = req.body;
  if (!mongoose.Types.ObjectId.isValid(topic)) {
    return res.status(400).json({ message: 'Invalid topic ID' });
  }
  const exists = await SubTopic.findOne({ name, topic });
  if (exists) return res.status(400).json({ message: 'SubTopic already exists under this topic' });

  const subtopic = await SubTopic.create({ name, topic, description, icon, isVisible, order });
  const populated = await subtopic.populate('topic', 'name');
  res.status(201).json({ subtopic: populated });
});

// ✅ UPDATE SUBTOPIC
export const updateSubTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, topic, description, icon, isVisible, order } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid subtopic ID' });

  const subtopic = await SubTopic.findById(id);
  if (!subtopic) return res.status(404).json({ message: 'SubTopic not found' });

  if (name && name !== subtopic.name) {
    const dup = await SubTopic.findOne({ name, topic: subtopic.topic });
    if (dup) return res.status(400).json({ message: 'Duplicate subtopic under same topic' });
    subtopic.name = name;
  }
  if (topic && topic !== subtopic.topic.toString()) {
    if (!mongoose.Types.ObjectId.isValid(topic)) return res.status(400).json({ message: 'Invalid topic' });
    subtopic.topic = topic;
  }
  if (description !== undefined) subtopic.description = description;
  if (icon !== undefined) subtopic.icon = icon;
  if (isVisible !== undefined) subtopic.isVisible = isVisible;
  if (order !== undefined) subtopic.order = order;

  await subtopic.save();
  const populated = await subtopic.populate('topic', 'name');
  res.json({ subtopic: populated });
});

// ✅ DELETE SUBTOPIC
export const deleteSubTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid subtopic ID' });
  const deleted = await SubTopic.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'SubTopic not found' });
  res.json({ success: true });
});

// ✅ BULK UPLOAD SUBTOPICS (CSV/XLSX)
export const bulkUploadSubTopics = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const workbook = xlsx.read(req.file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  let count = 0;
  for (const row of rows) {
    const { name, topicId, description = '', icon = '', isVisible = true, order = 0 } = row;
    if (!name || !topicId || !mongoose.Types.ObjectId.isValid(topicId)) continue;
    const exists = await SubTopic.findOne({ name, topic: topicId });
    if (exists) continue;
    await SubTopic.create({ name, topic: topicId, description, icon, isVisible, order });
    count++;
  }
  res.json({ success: true, count });
});


// 🆕 BULK UPLOAD SubTopics via JSON Paste
export const bulkUploadSubTopicsJSON = asyncHandler(async (req, res) => {
  const data = req.body.subtopics;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty subtopics array' });
  }

  let createdCount = 0;
  const errors = [];

  for (const entry of data) {
    const { name, topic, description = '', isVisible = true, order = 0 } = entry;

    if (!name || !topic || !mongoose.Types.ObjectId.isValid(topic)) {
      errors.push({ name, message: 'Missing or invalid name/topic' });
      continue;
    }

    const topicExists = await Topic.findById(topic);
    if (!topicExists) {
      errors.push({ name, message: 'Topic does not exist' });
      continue;
    }

    const duplicate = await SubTopic.findOne({ name, topic });
    if (duplicate) {
      errors.push({ name, message: 'Duplicate subtopic in same topic' });
      continue;
    }

    await SubTopic.create({ name, topic, description, isVisible, order });
    createdCount++;
  }

  res.status(201).json({
    message: `${createdCount} subtopics uploaded successfully`,
    failed: errors.length,
    errors,
  });
});