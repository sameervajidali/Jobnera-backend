import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  createBlog,
  updateBlog,
  getBlogById,
  getBlogs,
  deleteBlog,
} from '../controllers/blogController.js';

const router = express.Router();

// Public routes
router.get('/', getBlogs);
router.get('/:blogId', getBlogById);

// Protected admin routes (only SUPERADMIN, ADMIN, CREATOR)
router.use(protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));
router.post('/', createBlog);
router.patch('/:blogId', updateBlog);
router.delete('/:blogId', deleteBlog);

export default router;
