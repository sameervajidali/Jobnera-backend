// src/routes/adminStatsRoutes.js
import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  getDAU,
  getCategoryStats,
  getUserGrowth,
  getTicketStats
} from '../controllers/adminStatsController.js';

const router = express.Router();

// All stats endpoints require at least ADMIN
router.use(protect, requireRole('ADMIN', 'SUPERADMIN'));

// DAU: GET /api/admin/stats/dau
router.get('/stats/dau', getDAU);

// Category: GET /api/admin/stats/categories
router.get('/stats/categories', getCategoryStats);

// New users: GET /api/admin/stats/users-growth
router.get('/stats/users-growth', getUserGrowth);

// Tickets summary: GET /api/admin/stats/tickets
router.get('/stats/tickets', getTicketStats);

export default router;