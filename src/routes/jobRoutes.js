import express from 'express';
import multer from 'multer';
import {
  createJob,
  getPublicJobs,
  getSingleJob,
  updateJob,
  deleteJob,
  bulkUploadJobs
} from '../controllers/jobController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import { validateJob } from '../validators/jobValidator.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// ─────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────
router.get('/public', getPublicJobs);
router.get('/:id', getSingleJob);

// ─────────────────────────────────────────────
// Admin routes (SUPERADMIN | ADMIN only)
// ─────────────────────────────────────────────
router.use(
  '/admin',
  protect,
  requireRole(['SUPERADMIN', 'ADMIN'])
);

// Full CRUD
router.post('/jobs', validateJob, createJob);
router.put('/jobs/:id', validateJob, updateJob);
router.delete('/jobs/:id', deleteJob);

// Bulk upload
router.post('/jobs/bulk-upload', upload.single('file'), bulkUploadJobs);

export default router;
