// src/routes/admin/subTopicRoutes.js
import express from 'express';
import multer from 'multer';
import {
  getAllSubTopics,
  getSubTopicById,
  createSubTopic,
  updateSubTopic,
  deleteSubTopic,
  bulkUploadSubTopicsCSV,
  bulkUploadSubTopicsJSON,
} from '../../controllers/admin/subTopicController.js';
import { protect, requireRole } from '../../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer(); // for handling file uploads

// Admin access control
router.use(protect, requireRole('SUPERADMIN', 'ADMIN'));

// CRUD routes
router.route('/')
  .get(getAllSubTopics)
  .post(createSubTopic);

router.route('/:id')
  .get(getSubTopicById)
  .put(updateSubTopic)
  .delete(deleteSubTopic);

// Bulk Upload via CSV/XLSX
router.post('/bulk-upload', upload.single('file'), bulkUploadSubTopicsCSV);

// Bulk Upload via JSON Paste
router.post('/bulk-json', bulkUploadSubTopicsJSON);

export default router;
