import Material from '../models/Material.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── Admin: Create a new material ─────────────────────────────────────────────
export const createMaterial = asyncHandler(async (req, res) => {
  // req.body: { title, description, url, quizId? }
  const mat = await Material.create({ 
    ...req.body, 
    createdBy: req.user._id 
  });
  res.status(201).json(mat);
});

// ─── Admin: Get all materials ─────────────────────────────────────────────────
export const getAllMaterials = asyncHandler(async (_req, res) => {
  const mats = await Material.find().sort('-createdAt');
  res.json(mats);
});

// ─── Admin or User: Get one material by ID ────────────────────────────────────
export const getMaterialById = asyncHandler(async (req, res) => {
  const mat = await Material.findById(req.params.materialId);
  if (!mat) return res.status(404).json({ message: 'Material not found' });
  res.json(mat);
});

// ─── Admin: Update a material ─────────────────────────────────────────────────
export const updateMaterial = asyncHandler(async (req, res) => {
  const mat = await Material.findByIdAndUpdate(
    req.params.materialId,
    { $set: req.body },
    { new: true }
  );
  if (!mat) return res.status(404).json({ message: 'Material not found' });
  res.json(mat);
});

// ─── Admin: Delete a material ─────────────────────────────────────────────────
export const deleteMaterial = asyncHandler(async (req, res) => {
  const mat = await Material.findByIdAndDelete(req.params.materialId);
  if (!mat) return res.status(404).json({ message: 'Material not found' });
  res.json({ message: 'Material deleted' });
});

// ─── Admin: Assign material to user(s) ────────────────────────────────────────
export const assignMaterial = asyncHandler(async (req, res) => {
  // req.body: { userIds: [<userId>, ...] }
  const { userIds } = req.body;
  await Material.findByIdAndUpdate(req.params.materialId, {
    $addToSet: { assignedTo: { $each: userIds } }
  });
  res.json({ message: `Assigned to ${userIds.length} user(s)` });
});

// ─── User: Get all materials assigned to me ───────────────────────────────────
export const getMyMaterials = asyncHandler(async (req, res) => {
  const mats = await Material.find({ assignedTo: req.user._id });
  res.json(mats);
});

// ─── User: Bookmark / un-bookmark a material ──────────────────────────────────
export const toggleBookmark = asyncHandler(async (req, res) => {
  const mat = await Material.findById(req.params.materialId);
  if (!mat) return res.status(404).json({ message: 'Material not found' });

  const idx = mat.bookmarkedBy.indexOf(req.user._id);
  if (idx >= 0) {
    mat.bookmarkedBy.splice(idx, 1);
    await mat.save();
    return res.json({ message: 'Removed bookmark' });
  } else {
    mat.bookmarkedBy.push(req.user._id);
    await mat.save();
    return res.json({ message: 'Bookmarked' });
  }
});

// ─── User: Get all my bookmarks ────────────────────────────────────────────────
export const getMyBookmarks = asyncHandler(async (req, res) => {
  const mats = await Material.find({ bookmarkedBy: req.user._id });
  res.json(mats);
});
