// src/routes/admin/categoryRoutes.js
import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/admin/categoryController.js';

const router = express.Router();
router.use(protect, requireRole('SUPERADMIN','ADMIN'));

router.route('/')
  .get(getAllCategories)
  .post(createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

export default router;
