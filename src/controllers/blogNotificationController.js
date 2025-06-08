import BlogNotification from '../models/BlogNotification.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/blog/notifications (for logged in user)
export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await BlogNotification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('post', 'title slug')
    .limit(50); // Limit for performance
  res.json(notifications);
});

// PATCH /api/blog/notifications/:id/read (mark as read)
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await BlogNotification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: 'read' },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
});
