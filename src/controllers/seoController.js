import SeoMeta from '../models/SeoMeta.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllSeoMeta = asyncHandler(async (req, res) => {
  const entries = await SeoMeta.find();
  res.json(entries);
});

export const getSeoByPath = asyncHandler(async (req, res) => {
  const entry = await SeoMeta.findOne({ path: req.params.path });
  if (!entry) return res.status(404).json({ message: 'SEO entry not found' });
  res.json(entry);
});

export const updateOrCreateSeo = asyncHandler(async (req, res) => {
  const { path, ...rest } = req.body;
  const entry = await SeoMeta.findOneAndUpdate(
    { path },
    { ...rest, updatedBy: req.user._id, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ message: 'SEO meta saved', entry });
});

export const deleteSeoMeta = asyncHandler(async (req, res) => {
  await SeoMeta.findOneAndDelete({ path: req.params.path });
  res.json({ message: 'SEO entry deleted' });
});
