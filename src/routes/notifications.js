import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { sendNotification } from '../services/notificationService.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Require authentication for all notification routes
router.use(protect);

// GET /api/notifications
// Fetch the latest 50 notifications for the logged-in user
router.get('/', getNotifications);

// POST /api/notifications/test
// Create a test notification (for the logged-in user unless userId is provided)
router.post('/test', async (req, res, next) => {
  try {
    const targetUser = req.body.userId || req.user._id;
    const type       = req.body.type     || 'system';
    const message    = req.body.message  || 'Test notification';
    const payload    = { message };

    const notification = await sendNotification(targetUser, type, payload);
    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
// Mark the given notification as read for the logged-in user
router.patch('/:id/read', markAsRead);

export default router;
