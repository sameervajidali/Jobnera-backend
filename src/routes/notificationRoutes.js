import express from 'express';
import { listNotifications, markNotificationRead } from '../controllers/blogNotificationController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, listNotifications);
router.patch('/:id/read', protect, markNotificationRead);

export default router;


/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Blog notifications for user
 */

/**
 * @swagger
 * /api/blog/notifications:
 *   get:
 *     summary: List notifications for the logged-in user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             example:
 *               - _id: "n1"
 *                 post: { _id: "666cafecc5f26c18b4cb2351", title: "First Post", slug: "first-post" }
 *                 user: { _id: "user2", name: "Khushboo" }
 *                 type: "comment"
 *                 message: "New comment on your post"
 *                 status: "unread"
 *                 createdAt: "2025-06-09T13:35:00.000Z"
 */


/**
 * @swagger
 * /api/blog/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification updated
 *       401:
 *         description: Unauthorized
 */
