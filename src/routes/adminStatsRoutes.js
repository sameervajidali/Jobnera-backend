import express from 'express';
import { getDailyActiveUsers } from '../controllers/adminStatsController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// protect + restrict to admins/creators:
router.use(protect, requireRole(['SUPERADMIN','ADMIN','CREATOR']));

router.get('/stats/dau', getDailyActiveUsers);

export default router;
