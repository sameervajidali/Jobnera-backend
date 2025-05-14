import express from 'express';
import {
  getAllSeoMeta,
  getSeoByPath,
  updateOrCreateSeo,
  deleteSeoMeta
} from '../controllers/seoController.js';

import { protect,requireRole  } from '../middlewares/authMiddleware.js';
import { validateSeoMeta } from '../validators/seoValidator.js';

const router = express.Router();

router.get('/all', protect, requireRole, getAllSeoMeta);
router.get('/:path', getSeoByPath);
router.post('/', protect, requireRole, validateSeoMeta, updateOrCreateSeo);
router.delete('/:path', protect, requireRole, deleteSeoMeta);

export default router;
