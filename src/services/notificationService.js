// services/notificationService.js
import Notification from '../models/Notification.js';
import { getUserSockets } from './notificationSockets.js';

export async function sendNotification(userId, type, payload) {
  const notif = await Notification.create({ user: userId, type, payload });
  for (const sockId of getUserSockets(userId)) {
    // note: `io` instance could also be imported or passed in
    io.to(sockId).emit('notification:new', {
      _id:       notif._id,
      type:      notif.type,
      payload:   notif.payload,
      createdAt: notif.createdAt
    });
  }
  return notif;
}
