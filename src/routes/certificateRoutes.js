// routes/certificateRoutes.js
import express from 'express';
import {
  issueCertificate,
  verifyCertificate,
  bulkIssueCertificates
} from '../controllers/certificateController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ---- PUBLIC ROUTES ----

// Public QR verification (no auth)
router.get('/verify/:certificateId', verifyCertificate);

// ---- ADMIN ROUTES ----

// All admin certificate actions under '/admin'
router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// Issue a single certificate (ADMIN only)
router.post('/admin/issue', issueCertificate);

// Bulk issue (ADMIN only)
router.post('/admin/bulk-issue', bulkIssueCertificates);

export default router;
