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
  const exists = await SubTopic.findOne({ name: name.trim(), topic });
  if (exists) return res.status(400).json({ message: 'SubTopic already exists under this topic' });

  const subtopic = await SubTopic.create({
    name: name.trim(),
    topic,
    description: description.trim(),
    icon: icon.trim(),
    isVisible,
    order: parseInt(order, 10) || 0
  });
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

  if (name && name.trim() !== subtopic.name) {
    const dup = await SubTopic.findOne({ name: name.trim(), topic: topic || subtopic.topic });
    if (dup) return res.status(400).json({ message: 'Duplicate subtopic under same topic' });
    subtopic.name = name.trim();
  }
  if (topic && topic !== subtopic.topic.toString()) {
    if (!mongoose.Types.ObjectId.isValid(topic)) return res.status(400).json({ message: 'Invalid topic' });
    subtopic.topic = topic;
  }
  if (description !== undefined) subtopic.description = description.trim();
  if (icon !== undefined) subtopic.icon = icon.trim();
  if (isVisible !== undefined) subtopic.isVisible = isVisible;
  if (order !== undefined) subtopic.order = parseInt(order, 10) || 0;

  await subtopic.save();
  const populated = await subtopic.populate('topic', 'name');
  res.json({ subtopic: populated });
});

// ✅ DELETE SUBTOPIC (removes from Quiz via model hook)
export const deleteSubTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid subtopic ID' });
  const deleted = await SubTopic.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'SubTopic not found' });
  res.json({ success: true });
});

// ✅ BULK UPLOAD SUBTOPICS (CSV/XLSX)
export const bulkUploadSubTopics = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const workbook = xlsx.read(req.file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  let createdCount = 0;
  const errors = [];

  for (const row of rows) {
    const { name, topicId, description = "", icon = "", isVisible = true, order = 0 } = row;
    if (!name || !topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      errors.push({ name, message: "Invalid or missing name/topicId" });
      continue;
    }
    const topicExists = await Topic.findById(topicId);
    if (!topicExists) {
      errors.push({ name, message: "Topic not found" });
      continue;
    }
    const exists = await SubTopic.findOne({ name: name.trim(), topic: topicId });
    if (exists) {
      errors.push({ name, message: "Duplicate subtopic" });
      continue;
    }
    await SubTopic.create({
      name: name.trim(),
      topic: topicId,
      description: description.trim(),
      icon: icon.trim(),
      isVisible,
      order: parseInt(order, 10) || 0
    });
    createdCount++;
  }

  res.status(200).json({
    message: `${createdCount} subtopics uploaded`,
    failed: errors.length,
    errors,
  });
});

// ✅ BULK UPLOAD SubTopics via JSON Paste
export const bulkUploadSubTopicsJSON = asyncHandler(async (req, res) => {
  const { topic } = req.query;
  const data = req.body.subtopics;

  if (!mongoose.Types.ObjectId.isValid(topic)) {
    return res.status(400).json({ message: 'Invalid topic ID in query' });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty subtopics array' });
  }

  let createdCount = 0;
  const errors = [];

  for (const entry of data) {
    const { name, description = '', isVisible = true, order = 0 } = entry;
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push({ name: '', message: 'Missing or invalid name field' });
      continue;
    }
    const duplicate = await SubTopic.findOne({ name: name.trim(), topic });
    if (duplicate) {
      errors.push({ name: name.trim(), message: 'Duplicate subtopic in same topic' });
      continue;
    }
    await SubTopic.create({
      name: name.trim(),
      topic,
      description: description.trim(),
      isVisible,
      order: parseInt(order, 10) || 0
    });
    createdCount++;
  }

  const successMessage = createdCount === 0
    ? "No subtopics uploaded"
    : `${createdCount} subtopics uploaded successfully`;

  res.status(201).json({
    success: createdCount > 0,
    message: successMessage,
    created: createdCount,
    failed: errors.length,
    errors,
  });
});

// ✅ BULK UPLOAD SubTopics via CSV with Topic in Query
export const bulkUploadSubTopicsCSV = asyncHandler(async (req, res) => {
  const { topic } = req.query;

  if (!req.file || !topic || !mongoose.Types.ObjectId.isValid(topic)) {
    return res.status(400).json({ message: "File and valid topic ID required" });
  }

  const topicExists = await Topic.findById(topic);
  if (!topicExists) {
    return res.status(404).json({ message: "Topic not found" });
  }

  const workbook = xlsx.read(req.file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const subTopics = [];
  const errors = [];

  for (const item of rows) {
    const name = item.name?.trim();
    if (!name) {
      errors.push({ name, message: "Name missing" });
      continue;
    }
    const exists = await SubTopic.findOne({ name, topic });
    if (exists) {
      errors.push({ name, message: "Duplicate subtopic" });
      continue;
    }
    subTopics.push({
      name,
      description: item.description?.trim() || "",
      icon: item.icon?.trim() || "",
      order: parseInt(item.order, 10) || 0,
      isVisible: item.isVisible !== false,
      topic,
    });
  }

  if (subTopics.length === 0) {
    return res.status(400).json({ message: "No new subtopics to upload", failed: errors.length, errors });
  }

  await SubTopic.insertMany(subTopics);
  res.status(200).json({
    message: "Bulk upload successful",
    count: subTopics.length,
    failed: errors.length,
    errors
  });
});
