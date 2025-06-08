import express from 'express';
import { generateCertificateOgImage } from '../controllers/ogController.js';

const router = express.Router();

// GET /api/og/certificates/:id
router.get('/certificates/:id', generateCertificateOgImage);

export default router;
