import express from 'express';
import multer from 'multer';
import {
  createJob,
  getAllJobsAdmin,
  getPublicJobs,
  getSingleJob,
  updateJob,
  deleteJob,
  bulkUploadJobs,
} from '../controllers/jobController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import { validateJob } from '../validators/jobValidator.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Public
router.get('/public', getPublicJobs);
router.get('/:id', getSingleJob);

// ✅ Admin routes
router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN']));

router.get('/admin/jobs', getAllJobsAdmin);
router.post('/admin/jobs', validateJob, createJob);
router.put('/admin/jobs/:id', validateJob, updateJob);
router.delete('/admin/jobs/:id', deleteJob);
router.post('/admin/jobs/bulk-upload', upload.single('file'), bulkUploadJobs);

export default router;
