import express from 'express';
import { trackPageView, getAnalytics } from '../controllers/blogAnalyticsController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:slug/analytics', trackPageView); // public
router.get('/analytics', protect, requireRole('ADMIN'), getAnalytics);

export default router;


/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Blog analytics and stats
 */

/**
 * @swagger
 * /api/blog/analytics:
 *   get:
 *     summary: Get blog analytics (admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             example:
 *               - post: { _id: "666cafecc5f26c18b4cb2351", title: "First Post", slug: "first-post" }
 *                 date: "2025-06-09"
 *                 views: 55
 *                 uniqueVisitors: 31
 */

/**
 * @swagger
 * /api/blog/analytics:
 *   get:
 *     summary: Get blog analytics (admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: post
 *         schema:
 *           type: string
 *         description: Blog post ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: From date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: To date
 *     responses:
 *       200:
 *         description: Analytics data
 *       401:
 *         description: Unauthorized
 */
