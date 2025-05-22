// controllers/notificationController.js
import Notification from '../models/Notification.js';

export async function getNotifications(req, res) {
  const notifications = await Notification
    .find({ user: req.user._id })
    .sort('-createdAt')
    .limit(50);
  res.json({ notifications });
}

export async function markAsRead(req, res) {
  const { id } = req.params;
  await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isRead: true }
  );
  res.json({ success: true });
}
