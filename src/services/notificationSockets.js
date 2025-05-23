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

  // Share Express session with Socket.IO
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  io.on('connection', socket => {
    const user = socket.request.session?.user;
    if (!user) return socket.disconnect();

    // Track this socket for the user
    const sockets = onlineUsers.get(user._id) || new Set();
    sockets.add(socket.id);
    onlineUsers.set(user._id, sockets);

    socket.on('disconnect', () => {
      const set = onlineUsers.get(user._id);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) onlineUsers.delete(user._id);
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
