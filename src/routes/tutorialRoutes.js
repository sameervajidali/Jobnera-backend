// src/routes/tutorialRoutes.js
import express from 'express';
import multer from 'multer';
import asyncHandler from '../utils/asyncHandler.js';
import Tutorial from '../models/Tutorial.js';
import TutorialCategory from '../models/TutorialCategory.js';

import {
  // Public controllers
  getPublicTutorials,
  getTutorialById,
  getTutorialCategories,

  // Admin controllers
  createTutorial,
  updateTutorial,
  deleteTutorial,
  listTutorials,
  bulkUpdateTutorials,

  // Tutorial Categories Admin controllers
  createTutorialCategory,
  updateTutorialCategory,
  deleteTutorialCategory,
  listTutorialCategories,
} from '../controllers/tutorialController.js';

import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer(); // For potential CSV or file uploads in future
const router = express.Router();

// ──────────────────────────────────────────────────────────────
// Public routes (no authentication required)
// ──────────────────────────────────────────────────────────────

// Public routes
router.get('/', asyncHandler(getPublicTutorials));
router.get('/:tutorialId', asyncHandler(getTutorialById));
router.get('/tutorial-categories', asyncHandler(getTutorialCategories));  // <- Public list categories

// Admin routes (require auth + roles)
router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// Tutorials CRUD
router.post('/admin/tutorials', asyncHandler(createTutorial));
router.get('/admin/tutorials', asyncHandler(listTutorials));
router.route('/admin/tutorials/:tutorialId')
  .get(asyncHandler(getTutorialById))  // Admin can get any tutorial
  .patch(asyncHandler(updateTutorial))
  .delete(asyncHandler(deleteTutorial));

// Bulk update tutorials (status, order)
router.patch('/admin/tutorials/bulk-update', asyncHandler(bulkUpdateTutorials));

// Admin tutorial categories CRUD
router.post('/admin/tutorial-categories', asyncHandler(createTutorialCategory));
router.get('/admin/tutorial-categories', asyncHandler(listTutorialCategories));
router.route('/admin/tutorial-categories/:categoryId')
  .patch(asyncHandler(updateTutorialCategory))
  .delete(asyncHandler(deleteTutorialCategory));

export default router;