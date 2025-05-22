// services/notificationSockets.js
import { sendNotification } from './notificationService.js';
const onlineUsers = new Map();

export function handleNotificationSockets(io) {
  io.on('connection', socket => {
    const user = socket.request.session.user;
    if (!user) return socket.disconnect();

    // track this socket
    const set = onlineUsers.get(user._id) || new Set();
    set.add(socket.id);
    onlineUsers.set(user._id, set);

    // detach on disconnect
    socket.on('disconnect', () => {
      const cur = onlineUsers.get(user._id);
      cur.delete(socket.id);
      if (cur.size === 0) onlineUsers.delete(user._id);
    });
  });
}

// Utility: used by sendNotification to broadcast
export function getUserSockets(userId) {
  return onlineUsers.get(userId.toString()) || new Set();
}
