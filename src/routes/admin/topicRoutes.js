// src/routes/admin/topicRoutes.js
import express from 'express';
import multer from 'multer';
import { protect, requireRole } from '../../middlewares/authMiddleware.js';
import {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  bulkUploadTopics, // ✅ Add this controller
} from '../../controllers/admin/topicController.js';

const router = express.Router();
const upload = multer(); // for handling multipart/form-data

// Protect all topic routes
router.use(protect, requireRole('SUPERADMIN', 'ADMIN'));

// ─────────────────────────────────────────────
// GET all + CREATE new
router.route('/')
  .get(getAllTopics)
  .post(createTopic);

// ─────────────────────────────────────────────
// GET, UPDATE, DELETE by ID
router.route('/:id')
  .get(getTopicById)
  .put(updateTopic)
  .delete(deleteTopic);

// ─────────────────────────────────────────────
// ✅ BULK UPLOAD route — CSV/XLSX
router.post('/bulk-upload', upload.single('file'), bulkUploadTopics);

export default router;
