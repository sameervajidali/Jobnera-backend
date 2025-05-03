// src/routes/resumeRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  previewResume,
  enhanceResume,
  atsCheckResume,
} from '../controllers/resumeController.js';

const router = express.Router();

// Protect all resume routes
router.use(protect);

// Resume CRUD
router.post('/', createResume);
router.get('/', listResumes);
router.get('/:id', getResume);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

// Additional resume actions
router.post('/:id/preview', previewResume);
router.post('/:id/enhance', enhanceResume);
router.post('/:id/ats-check', atsCheckResume);

export default router;
