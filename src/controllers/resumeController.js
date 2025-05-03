// src/controllers/resumeController.js
import asyncHandler from '../utils/asyncHandler.js';
import Resume from '../models/Resume.js';
import pdfService from '../services/pdfService.js';
import aiService from '../services/aiService.js';
import atsService from '../services/atsService.js';

/**
 * Create a new resume for the authenticated user
 */
export const createResume = asyncHandler(async (req, res) => {
  const resume = await Resume.create({ userId: req.user._id, data: req.body.data || {} });
  res.status(201).json(resume);
});

/**
 * List all resumes for the authenticated user
 */
export const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).lean();
  res.json(resumes);
});

/**
 * Get a single resume by ID for the authenticated user
 */
export const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }
  res.json(resume);
});

/**
 * Update an existing resume for the authenticated user
 */
export const updateResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }
  resume.data = { ...resume.data, ...req.body.data };
  resume.status = req.body.status || resume.status;
  await resume.save();
  res.json(resume);
});

/**
 * Delete a resume by ID for the authenticated user
 */
export const deleteResume = asyncHandler(async (req, res) => {
  const result = await Resume.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Resume not found.' });
  }
  res.sendStatus(204);
});

/**
 * Generate a PDF preview of the resume
 */
export const previewResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }
  const buffer = await pdfService.generatePDF(resume.data);
  res.type('application/pdf').send(buffer);
});

/**
 * Provide AI-based enhancement suggestions for resume content
 */
export const enhanceResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }
  const suggestions = await aiService.enhanceText(resume.data);
  res.json(suggestions);
});

/**
 * Run ATS compliance checks on the resume
 */
export const atsCheckResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }
  const report = await atsService.runChecks(resume.data);
  res.json(report);
});
