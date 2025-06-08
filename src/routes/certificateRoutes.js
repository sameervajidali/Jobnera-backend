import express from 'express';
import {
  issueCertificate,
  verifyCertificate,
  bulkIssueCertificates,
  getUserCertificates,
  generateCertificateThumbnail
} from '../controllers/certificateController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- PUBLIC: Certificate Verification (for QR) ---
router.get('/verify/:certificateId', verifyCertificate);
router.get("/certificates/:certificateId/thumbnail", generateCertificateThumbnail);

// --- ADMIN: Issue and Bulk Issue Certificates (protected) ---
router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));
router.post('/admin/issue', issueCertificate);
router.post('/admin/bulk-issue', bulkIssueCertificates);

// --- USER: Get all certificates for the logged-in user ---
router.get('/', protect, getUserCertificates);

export default router;
