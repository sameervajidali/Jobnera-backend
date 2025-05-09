// src/routes/dashboardRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

router.use(protect);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

export default router;
