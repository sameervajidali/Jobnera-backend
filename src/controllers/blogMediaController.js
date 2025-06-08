import BlogMedia from '../models/BlogMedia.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/blog/media/upload
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // TODO: Upload to Supabase, get public URL, set meta
  const media = await BlogMedia.create({
    url: '<public supabase url>',
    type: req.file.mimetype.startsWith('image') ? 'image' : 'file',
    alt: req.body.alt || '',
    caption: req.body.caption || '',
    uploadedBy: req.user._id,
    meta: {
      size: req.file.size,
      mime: req.file.mimetype,
      // width/height (optional, use sharp/probe if needed)
    },
  });

  res.status(201).json(media);
});

// GET /api/blog/media/my
export const listMyMedia = asyncHandler(async (req, res) => {
  const media = await BlogMedia.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
  res.json(media);
});

// DELETE /api/blog/media/:id
export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await BlogMedia.findById(req.params.id);
  if (!media) return res.status(404).json({ message: 'Media not found' });
  if (!media.uploadedBy.equals(req.user._id) && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await media.deleteOne();
  res.json({ message: 'Media deleted' });
});
