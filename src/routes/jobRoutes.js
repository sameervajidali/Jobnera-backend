
import express from 'express';
import {
  createJob,
  getPublicJobs,
  getSingleJob,
  updateJob,
  deleteJob,
  bulkUploadJobs
} from '../controllers/jobController.js';
import { protect,requireRole } from '../middlewares/authMiddleware.js';
import { validateJob } from '../validators/jobValidator.js';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });


const router = express.Router();

// Public
router.get('/public', getPublicJobs);
router.get('/:id', getSingleJob);

// Admin only
router.post('/', protect, requireRole, validateJob, createJob);
router.put('/:id', protect, requireRole, validateJob, updateJob);
router.delete('/:id', protect, requireRole, deleteJob);
router.post('/admin/bulk-upload',protect,requireRole,upload.single('file'),bulkUploadJobs);

export default router;
