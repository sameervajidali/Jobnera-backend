import Notification from '../models/Notification.js';

// Fetch the latest 50 notifications for the authenticated user, sorted by newest first
export async function getNotifications(req, res) {
  try {
    const notifications = await Notification
      .find({ user: req.user._id })
      .sort('-createdAt')
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

// Mark a specific notification as read for the authenticated user
export async function markAsRead(req, res) {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}
