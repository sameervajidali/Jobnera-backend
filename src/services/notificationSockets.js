// src/services/notificationSockets.js
import sessionMiddleware from '../middlewares/session.js';

// Map to track online users: userId -> Set of socket IDs
const onlineUsers = new Map();
let ioInstance = null;

/**
 * Attach Socket.IO instance and session handling
 * @param {Server} io - instance of Socket.IO server
 */
export function handleNotificationSockets(io) {
  ioInstance = io;

  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  io.on('connection', socket => {
    // Passport saves the user ID here:
    const passportSession = socket.request.session.passport;
    const userId = passportSession && passportSession.user;
    if (!userId) {
      return socket.disconnect();
    }

    // Track this socket for the user
    const sockets = onlineUsers.get(userId) || new Set();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);

    socket.on('disconnect', () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) onlineUsers.delete(userId);
      }
    });
  });
}


/**
 * Get the Socket.IO instance
 * @returns {Server|null}
 */
export function getIO() {
  return ioInstance;
}

/**
 * Get the map of online users
 * @returns {Map<string, Set<string>>}
 */
export function getOnlineUsers() {
  return onlineUsers;
}
