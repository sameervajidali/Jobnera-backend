// src/routes/admin/categoryRoutes.js
import express from 'express';
import multer from 'multer';
import { protect, requireRole } from '../../middlewares/authMiddleware.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUploadCategories, // ✅ Add this import
} from '../../controllers/admin/categoryController.js';

const router = express.Router();
const upload = multer(); // for parsing multipart/form-data

// Protect all category routes
router.use(protect, requireRole('SUPERADMIN', 'ADMIN'));

// ─────────────────────────────────────────────
// GET all + CREATE new category
router.route('/')
  .get(getAllCategories)
  .post(createCategory);

// ─────────────────────────────────────────────
// GET, UPDATE, DELETE by ID
router.route('/:id')
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

// ─────────────────────────────────────────────
// ✅ BULK UPLOAD route — CSV or XLSX
router.post('/bulk-upload', upload.single('file'), bulkUploadCategories);

export default router;
